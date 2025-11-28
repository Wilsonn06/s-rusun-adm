const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

const APP_URL = 'http://localhost:3002';

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.unit_id,
        u.unit_number,
        u.pemilik_id,
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
      ORDER BY u.unit_id
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error mengambil data unit:", err);
    res.status(500).json({ message: "Gagal mengambil data unit." });
  }
});

router.get('/:unit_id', async (req, res) => {
  const { unit_id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        u.unit_id,
        u.unit_number,
        u.pemilik_id,
        p.nama AS pemilik_nama,
        f.floor_id,
        f.floor_number,
        t.tower_id,
        t.tower_name,
        fl.flat_id,
        fl.flat_name
      FROM unit u
      LEFT JOIN pemilik p ON u.pemilik_id = p.pemilik_id
      JOIN floor f ON u.floor_id = f.floor_id
      JOIN tower t ON f.tower_id = t.tower_id
      JOIN flat fl ON t.flat_id = fl.flat_id
      WHERE u.unit_id = ?
    `, [unit_id]);

    if (!rows.length)
      return res.status(404).json({ message: "Unit tidak ditemukan." });

    res.json(rows[0]);
  } catch (err) {
    console.error("Error GET unit:", err);
    res.status(500).json({ message: "Gagal mengambil data unit." });
  }
});

router.get('/:unit_id/devices', async (req, res) => {
  const { unit_id } = req.params;

  try {
    const response = await axios.get(`${APP_URL}/devices/unit/${unit_id}`);
    res.json(response.data.devices);
  } catch (err) {
    console.error("Gagal mengambil devices unit:", err.message);
    res.status(500).json({ message: "Gagal mengambil devices unit." });
  }
});

router.post('/', async (req, res) => {
  const { unit_id, unit_number, floor_id, pemilik_id } = req.body;

  if (!unit_id || !unit_number || !floor_id)
    return res.status(400).json({
      message: "unit_id, unit_number, dan floor_id wajib diisi."
    });

  try {
    const [floorCheck] = await db.query(
      "SELECT floor_id FROM floor WHERE floor_id = ?",
      [floor_id]
    );
    if (!floorCheck.length)
      return res.status(400).json({ message: `floor_id '${floor_id}' tidak valid.` });

    if (pemilik_id) {
      const [pemilikCheck] = await db.query(
        "SELECT pemilik_id FROM pemilik WHERE pemilik_id = ?",
        [pemilik_id]
      );
      if (!pemilikCheck.length)
        return res.status(400).json({ message: `pemilik_id '${pemilik_id}' tidak valid.` });
    }

    await db.query(
      "INSERT INTO unit (unit_id, unit_number, floor_id, pemilik_id) VALUES (?, ?, ?, ?)",
      [unit_id, unit_number, floor_id, pemilik_id || null]
    );

    res.status(201).json({ message: "Unit berhasil ditambahkan." });

  } catch (err) {
    console.error("Error POST unit:", err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: `Unit dengan ID '${unit_id}' sudah ada.`
      });
    }

    res.status(500).json({ message: "Gagal menambahkan unit." });
  }
});

router.put('/:unit_id', async (req, res) => {
  const { unit_id } = req.params;
  const { unit_number, floor_id, pemilik_id } = req.body;

  try {
    const [unitCheck] = await db.query(
      "SELECT unit_id FROM unit WHERE unit_id = ?",
      [unit_id]
    );

    if (!unitCheck.length)
      return res.status(404).json({ message: "Unit tidak ditemukan." });

    if (floor_id) {
      const [floorCheck] = await db.query(
        "SELECT floor_id FROM floor WHERE floor_id = ?",
        [floor_id]
      );
      if (!floorCheck.length)
        return res.status(400).json({ message: "floor_id tidak valid." });
    }

    if (pemilik_id) {
      const [pemilikCheck] = await db.query(
        "SELECT pemilik_id FROM pemilik WHERE pemilik_id = ?",
        [pemilik_id]
      );
      if (!pemilikCheck.length)
        return res.status(400).json({ message: "pemilik_id tidak valid." });
    }

    await db.query(
      "UPDATE unit SET unit_number = ?, floor_id = ?, pemilik_id = ? WHERE unit_id = ?",
      [unit_number, floor_id, pemilik_id || null, unit_id]
    );

    res.json({ message: "Unit berhasil diperbarui." });
  } catch (err) {
    console.error("Error PUT unit:", err);
    res.status(500).json({ message: "Gagal memperbarui unit." });
  }
});

router.delete('/:unit_id', async (req, res) => {
  const { unit_id } = req.params;

  try {
    try {
      await axios.delete(`${APP_URL}/devices/unit/${unit_id}`);
    } catch (err) {
      console.error("Gagal menghapus devices di APP:", err.message);
    }

    const [result] = await db.query(
      "DELETE FROM unit WHERE unit_id = ?",
      [unit_id]
    );

    if (!result.affectedRows)
      return res.status(404).json({ message: "Unit tidak ditemukan." });

    res.json({ message: "Unit dan devices terkait berhasil dihapus." });
  } catch (err) {
    console.error("Error DELETE unit:", err);
    res.status(500).json({ message: "Gagal menghapus unit." });
  }
});

module.exports = router;
