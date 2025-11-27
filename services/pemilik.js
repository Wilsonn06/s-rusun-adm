const express = require('express');
const router = express.Router();
const db = require('../db');

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

router.get('/:pemilik_id', async (req, res) => {
  const { pemilik_id } = req.params;
  try {
    const [pemilikRows] = await db.query(
      `SELECT * FROM pemilik WHERE pemilik_id = ?`,
      [pemilik_id]
    );

    if (pemilikRows.length === 0) {
      return res.status(404).json({ message: 'Pemilik tidak ditemukan.' });
    }

    const pemilik = pemilikRows[0];
    const [unitRows] = await db.query(`
      SELECT 
        u.unit_id,
        u.unit_number,
        u.floor_id,
        f.floor_number,
        f.tower_id,
        t.tower_name
      FROM unit u
      JOIN floor f ON u.floor_id = f.floor_id
      JOIN tower t ON f.tower_id = t.tower_id
      WHERE u.pemilik_id = ?
      `,
      [pemilik_id]
    );

    return res.status(200).json({
      ...pemilik,
      units: unitRows 
    });

  } catch (error) {
    console.error('Error mengambil data pemilik berdasarkan id:', error);
    res.status(500).json({ message: 'Gagal mengambil data pemilik.' });
  }
});

router.post('/', async (req, res) => {
  const { pemilik_id, nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat } = req.body;

  if (!pemilik_id || !nama || !nik) {
    return res.status(400).json({ message: 'id pemilik, nama, dan nik wajib diisi.'});
  }

  try {
    //apakah pemilik_id sudah ada
    const [check] = await db.query(
      'SELECT pemilik_id FROM pemilik WHERE pemilik_id = ?',
      [pemilik_id]
    );

    if (check.length > 0) {
      return res.status(409).json({
        message: 'id pemilik sudah digunakan. Harap gunakan id pemilik lain.'
      });
    }

    //lanjut insert jika aman
    await db.query(`
      INSERT INTO pemilik (pemilik_id, nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pemilik_id, nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat]
    );

    res.status(201).json({ message: 'Pemilik berhasil ditambahkan.' });

  } catch (error) {
    console.error('Error menambahkan pemilik:', error);
    res.status(500).json({ message: 'Gagal menambahkan pemilik.' });
  }
});

router.put('/:pemilik_id', async (req, res) => {
  const { pemilik_id } = req.params;
  const { nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat } = req.body;

  try {
    const updates = [];
    const values = [];

    if (nama !== undefined) { updates.push("nama = ?"); values.push(nama); }
    if (nik !== undefined) { updates.push("nik = ?"); values.push(nik); }
    if (tanggal_lahir !== undefined) { updates.push("tanggal_lahir = ?"); values.push(tanggal_lahir); }
    if (jenis_kelamin !== undefined) { updates.push("jenis_kelamin = ?"); values.push(jenis_kelamin); }
    if (no_telepon !== undefined) { updates.push("no_telepon = ?"); values.push(no_telepon); }
    if (alamat !== undefined) { updates.push("alamat = ?"); values.push(alamat); }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang diperbarui.' });
    }

    const sql = `UPDATE pemilik SET ${updates.join(', ')} WHERE pemilik_id = ?`;
    values.push(pemilik_id);

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pemilik tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Data pemilik berhasil diperbarui.' });

  } catch (error) {
    console.error('Error memperbarui data pemilik:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Duplikasi data.' });
    }

    res.status(500).json({ message: 'Gagal memperbarui data pemilik.' });
  }
});

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
