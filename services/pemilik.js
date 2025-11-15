const express = require('express');
const router = express.Router();
const db = require('../db');

// =====================================================
// GET semua pemilik (lengkap dengan daftar unit yang dimiliki)
// =====================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.pemilik_id,
        p.nama,
        p.nik,
        p.tanggal_lahir,
        p.jenis_kelamin,
        p.no_telepon,
        p.alamat,
        GROUP_CONCAT(u.unit_id ORDER BY u.unit_id SEPARATOR ', ') AS unit_ids
      FROM pemilik p
      LEFT JOIN unit u ON p.pemilik_id = u.pemilik_id
      GROUP BY p.pemilik_id
      ORDER BY p.pemilik_id;
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil data pemilik:', error);
    res.status(500).json({ message: 'Gagal mengambil data pemilik.' });
  }
});

// =====================================================
// GET satu pemilik berdasarkan ID
// =====================================================
router.get('/:pemilik_id', async (req, res) => {
  const { pemilik_id } = req.params;
  try {
    const [rows] = await db.query(
      `
      SELECT 
        p.*,
        GROUP_CONCAT(u.unit_id ORDER BY u.unit_id SEPARATOR ', ') AS unit_ids
      FROM pemilik p
      LEFT JOIN unit u ON p.pemilik_id = u.pemilik_id
      WHERE p.pemilik_id = ?
      GROUP BY p.pemilik_id
      `,
      [pemilik_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pemilik tidak ditemukan.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error mengambil data pemilik berdasarkan ID:', error);
    res.status(500).json({ message: 'Gagal mengambil data pemilik.' });
  }
});

// =====================================================
// POST tambah pemilik baru
// =====================================================
router.post('/', async (req, res) => {
  const { pemilik_id, nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat } = req.body;

  if (!pemilik_id || !nama || !nik) {
    return res.status(400).json({ message: 'pemilik_id, nama, dan nik wajib diisi.' });
  }

  try {
    await db.query(
      `
      INSERT INTO pemilik (pemilik_id, nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [pemilik_id, nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat]
    );

    res.status(201).json({ message: 'Pemilik berhasil ditambahkan.' });
  } catch (error) {
    console.error('Error menambahkan pemilik:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'NIK atau ID pemilik sudah terdaftar.' });
    }
    res.status(500).json({ message: 'Gagal menambahkan pemilik.' });
  }
});

// =====================================================
// PUT update data pemilik
// =====================================================
// PUT update data pemilik (dengan validasi unik NIK)
router.put('/:pemilik_id', async (req, res) => {
  const { pemilik_id } = req.params;
  const { nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat } = req.body;

  try {
    const [check] = await db.query('SELECT * FROM pemilik WHERE pemilik_id = ?', [pemilik_id]);
    if (check.length === 0) {
      return res.status(404).json({ message: 'Pemilik tidak ditemukan.' });
    }

    // Jika NIK dikirim, cek apakah NIK ini sudah dipakai oleh pemilik lain
    if (nik) {
      const [nikRows] = await db.query('SELECT pemilik_id FROM pemilik WHERE nik = ? AND pemilik_id <> ?', [nik, pemilik_id]);
      if (nikRows.length > 0) {
        return res.status(400).json({ message: 'NIK sudah dipakai oleh pemilik lain.' });
      }
    }

    await db.query(
      `
      UPDATE pemilik
      SET nama = ?, nik = ?, tanggal_lahir = ?, jenis_kelamin = ?, no_telepon = ?, alamat = ?
      WHERE pemilik_id = ?
      `,
      [nama || null, nik || null, tanggal_lahir || null, jenis_kelamin || null, no_telepon || null, alamat || null, pemilik_id]
    );

    res.status(200).json({ message: 'Data pemilik berhasil diperbarui.' });
  } catch (error) {
    console.error('Error memperbarui data pemilik:', error);

    // Tangani duplicate entry generik jika masih terjadi
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Duplikasi data.' });
    }

    res.status(500).json({ message: 'Gagal memperbarui data pemilik.' });
  }
});


// =====================================================
// DELETE hapus pemilik
// =====================================================
router.delete('/:pemilik_id', async (req, res) => {
  const { pemilik_id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM pemilik WHERE pemilik_id = ?', [pemilik_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pemilik tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Pemilik berhasil dihapus.' });
  } catch (error) {
    console.error('Error menghapus pemilik:', error);
    res.status(500).json({ message: 'Gagal menghapus pemilik.' });
  }
});

module.exports = router;
