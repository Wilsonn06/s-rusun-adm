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
        COUNT(u.unit_id) AS total_unit
      FROM pemilik p
      LEFT JOIN unit u ON p.pemilik_id = u.pemilik_id
      GROUP BY p.pemilik_id
      ORDER BY p.pemilik_id
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error mengambil data pemilik:", err);
    res.status(500).json({ message: "Gagal mengambil data pemilik." });
  }
});

router.get('/:pemilik_id', async (req, res) => {
  const { pemilik_id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        p.pemilik_id,
        p.nama,
        p.nik,
        p.tanggal_lahir,
        p.jenis_kelamin,
        p.no_telepon,
        p.alamat
      FROM pemilik p
      WHERE p.pemilik_id = ?
    `, [pemilik_id]);

    if (!rows.length)
      return res.status(404).json({ message: 'Pemilik tidak ditemukan.' });

    res.json(rows[0]);

  } catch (err) {
    console.error("Error GET pemilik:", err);
    res.status(500).json({ message: "Gagal mengambil data pemilik." });
  }
});

router.get('/:pemilik_id/unit', async (req, res) => {
  const { pemilik_id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        u.unit_id,
        u.unit_number,
        f.floor_id,
        f.floor_number,
        t.tower_id,
        t.tower_name,
        fl.flat_id,
        fl.flat_name
      FROM unit u
      JOIN floor f ON u.floor_id = f.floor_id
      JOIN tower t ON f.tower_id = t.tower_id
      JOIN flat fl ON t.flat_id = fl.flat_id
      WHERE u.pemilik_id = ?
      ORDER BY u.unit_number
    `, [pemilik_id]);

    res.json(rows);

  } catch (err) {
    console.error("Error GET unit pemilik:", err);
    res.status(500).json({ message: "Gagal mengambil unit pemilik." });
  }
});

router.get('/:pemilik_id/detail', async (req, res) => {
  const { pemilik_id } = req.params;

  try {
    const [pemilikRows] = await db.query(
      `SELECT * FROM pemilik WHERE pemilik_id = ?`,
      [pemilik_id]
    );

    if (!pemilikRows.length)
      return res.status(404).json({ message: 'Pemilik tidak ditemukan.' });

    const pemilik = pemilikRows[0];

    const [units] = await db.query(`
      SELECT 
        u.unit_id,
        u.unit_number,
        f.floor_id,
        f.floor_number,
        t.tower_id,
        t.tower_name,
        fl.flat_id,
        fl.flat_name
      FROM unit u
      JOIN floor f ON u.floor_id = f.floor_id
      JOIN tower t ON f.tower_id = t.tower_id
      JOIN flat fl ON t.flat_id = fl.flat_id
      WHERE u.pemilik_id = ?
      ORDER BY u.unit_number
    `, [pemilik_id]);

    res.json({
      ...pemilik,
      units
    });

  } catch (err) {
    console.error("Error GET detail pemilik:", err);
    res.status(500).json({ message: "Gagal mengambil detail pemilik." });
  }
});

router.post('/', async (req, res) => {
  const { pemilik_id, nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat } = req.body;

  if (!pemilik_id || !nama || !nik)
    return res.status(400).json({ message: "pemilik_id, nama, dan nik wajib diisi." });

  try {
    await db.query(`
      INSERT INTO pemilik (pemilik_id, nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [pemilik_id, nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat]);

    res.status(201).json({ message: "Pemilik berhasil ditambahkan." });

  } catch (err) {
    console.error("Error POST pemilik:", err);

    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: "Pemilik dengan ID '${pemilik_id}' sudah ada" });

    res.status(500).json({ message: "Gagal menambahkan pemilik." });
  }
});

router.put('/:pemilik_id', async (req, res) => {
  const { pemilik_id } = req.params;
  const { nama, nik, tanggal_lahir, jenis_kelamin, no_telepon, alamat } = req.body;

  try {
    const [check] = await db.query(
      "SELECT pemilik_id FROM pemilik WHERE pemilik_id = ?",
      [pemilik_id]
    );
    if (!check.length)
      return res.status(404).json({ message: "Pemilik tidak ditemukan." });

    if (nik) {
      const [dupeNIK] = await db.query(
        "SELECT pemilik_id FROM pemilik WHERE nik = ? AND pemilik_id <> ?",
        [nik, pemilik_id]
      );
      if (dupeNIK.length)
        return res.status(400).json({ message: "NIK sudah dipakai pemilik lain." });
    }

    const fields = [];
    const values = [];

    if (nama !== undefined) { fields.push("nama = ?"); values.push(nama); }
    if (nik !== undefined) { fields.push("nik = ?"); values.push(nik); }
    if (tanggal_lahir !== undefined) { fields.push("tanggal_lahir = ?"); values.push(tanggal_lahir); }
    if (jenis_kelamin !== undefined) { fields.push("jenis_kelamin = ?"); values.push(jenis_kelamin); }
    if (no_telepon !== undefined) { fields.push("no_telepon = ?"); values.push(no_telepon); }
    if (alamat !== undefined) { fields.push("alamat = ?"); values.push(alamat); }

    if (!fields.length)
      return res.status(400).json({ message: "Tidak ada data yang diperbarui." });

    const sql = `UPDATE pemilik SET ${fields.join(', ')} WHERE pemilik_id = ?`;
    values.push(pemilik_id);

    await db.query(sql, values);

    res.json({ message: "Data pemilik berhasil diperbarui." });

  } catch (err) {
    console.error("Error PUT pemilik:", err);
    res.status(500).json({ message: "Gagal memperbarui data pemilik." });
  }
});

router.delete('/:pemilik_id', async (req, res) => {
  const { pemilik_id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM pemilik WHERE pemilik_id = ?",
      [pemilik_id]
    );

    if (!result.affectedRows)
      return res.status(404).json({ message: "Pemilik tidak ditemukan." });

    res.json({ message: "Pemilik berhasil dihapus." });

  } catch (err) {
    console.error("Error DELETE pemilik:", err);
    res.status(500).json({ message: "Gagal menghapus pemilik." });
  }
});

module.exports = router;
