const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db'); // pastikan path sesuai struktur ADM-mu

// SECRET sederhana untuk TA (di produksi: pakai env)
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';
const JWT_EXPIRES_IN = '1h';

/**
 * POST /auth/login
 * Menerima { username, password } dan mengembalikan JWT.
 * - Admin & pemilik disimpan di tabel `users`
 * - Kolom:
 *   - username, password, role ('admin'|'pemilik'), pemilik_id (nullable)
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username dan password wajib diisi.' });
  }

  try {
    // Cari user di tabel `users`
    const [rows] = await db.query(
      'SELECT username, password, role, pemilik_id FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ message: 'Username atau password salah.' });
    }

    const user = rows[0];

    // Untuk TA, kamu masih pakai plaintext password di DB
    // Di produksi, sebaiknya pakai bcrypt.hash dan bcrypt.compare
    if (user.password !== password) {
      return res
        .status(401)
        .json({ message: 'Username atau password salah.' });
    }

    // Siapkan payload JWT
    const payload = {
      iss: 's-rusun-frontend',               // issuer = 1 consumer per aplikasi
      sub: user.pemilik_id || user.username, // pemilik_id (pemilik) atau username (admin)
      username: user.username,
      role: user.role,                       // 'admin' atau 'pemilik'
      pemilik_id: user.pemilik_id,           // null untuk admin
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: JWT_EXPIRES_IN,
      user: payload,
    });
  } catch (error) {
    console.error('Error di /auth/login:', error);
    return res
      .status(500)
      .json({ message: 'Terjadi kesalahan saat memproses login.' });
  }
});

module.exports = router;