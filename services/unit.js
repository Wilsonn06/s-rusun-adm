const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

const APP_URL = 'http://localhost:3002'; 

// =====================================================
// GET semua unit
// =====================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.unit_id,
        u.unit_number,
        u.pemilik_id,
        f.floor_id,
        f.floor_number,
        f.tower_id,
        t.tower_name,
        u.flat_id,
        fl.flat_name
      FROM unit u
      JOIN floor f ON u.floor_id = f.floor_id
      JOIN tower t ON f.tower_id = t.tower_id
      JOIN flat fl ON u.flat_id = fl.flat_id
      ORDER BY u.unit_id
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil data unit:', error);
    res.status(500).json({ message: 'Gagal mengambil data unit.' });
  }
});

// =====================================================
// GET unit berdasarkan ID
// =====================================================
router.get('/:unit_id', async (req, res) => {
  const { unit_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        u.unit_id,
        u.unit_number,
        u.pemilik_id,
        p.nama AS pemilik_nama,
        u.floor_id,
        f.floor_number,
        f.tower_id,
        t.tower_name,
        u.flat_id,
        fl.flat_name
      FROM unit u
      LEFT JOIN pemilik p ON u.pemilik_id = p.pemilik_id
      LEFT JOIN floor f ON u.floor_id = f.floor_id
      LEFT JOIN tower t ON f.tower_id = t.tower_id
      LEFT JOIN flat fl ON u.flat_id = fl.flat_id
      WHERE u.unit_id = ?
    `, [unit_id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Unit tidak ditemukan.' });

    res.status(200).json({ data: rows[0] });
  } catch (error) {
    console.error('Error mengambil unit berdasarkan ID:', error);
    res.status(500).json({ message: 'Gagal mengambil data unit.' });
  }
});

// =====================================================
// GET devices by unit (langsung array)
// =====================================================
router.get('/:unit_id/devices', async (req, res) => {
  const { unit_id } = req.params;
  try {
    const response = await axios.get(`${APP_URL}/devices/unit/${unit_id}`);
    res.status(200).json(response.data.devices); // array langsung
  } catch (err) {
    console.error('Gagal mengambil devices unit:', err.message);
    res.status(500).json({ message: 'Gagal mengambil devices unit' });
  }
});

// =====================================================
// POST tambah unit baru
// =====================================================
router.post('/', async (req, res) => {
  const { unit_id, unit_number, floor_id, flat_id } = req.body;
  if (!unit_id || !unit_number || !floor_id || !flat_id)
    return res.status(400).json({ message: 'unit_id, unit_number, floor_id, dan flat_id wajib diisi.' });

  try {
    const [floorCheck] = await db.query('SELECT * FROM floor WHERE floor_id = ?', [floor_id]);
    const [flatCheck] = await db.query('SELECT * FROM flat WHERE flat_id = ?', [flat_id]);
    if (floorCheck.length === 0) return res.status(400).json({ message: 'floor_id tidak valid.' });
    if (flatCheck.length === 0) return res.status(400).json({ message: 'flat_id tidak valid.' });

    await db.query('INSERT INTO unit (unit_id, unit_number, floor_id, flat_id) VALUES (?, ?, ?, ?)',
      [unit_id, unit_number, floor_id, flat_id]
    );
    res.status(201).json({ message: 'Unit berhasil ditambahkan.' });
  } catch (error) {
    console.error('Error menambahkan unit:', error);
    res.status(500).json({ message: 'Gagal menambahkan unit.' });
  }
});

// =====================================================
// PUT update unit
// =====================================================
router.put('/:unit_id', async (req, res) => {
  const { unit_id } = req.params;
  const { unit_number, floor_id, flat_id, pemilik_id } = req.body;

  try {
    const [unitCheck] = await db.query('SELECT * FROM unit WHERE unit_id = ?', [unit_id]);
    if (unitCheck.length === 0) return res.status(404).json({ message: 'Unit tidak ditemukan.' });

    if (floor_id) {
      const [floorCheck] = await db.query('SELECT * FROM floor WHERE floor_id = ?', [floor_id]);
      if (floorCheck.length === 0) return res.status(400).json({ message: 'floor_id tidak valid.' });
    }
    if (flat_id) {
      const [flatCheck] = await db.query('SELECT * FROM flat WHERE flat_id = ?', [flat_id]);
      if (flatCheck.length === 0) return res.status(400).json({ message: 'flat_id tidak valid.' });
    }
    if (pemilik_id) {
      const [pemilikCheck] = await db.query('SELECT * FROM pemilik WHERE pemilik_id = ?', [pemilik_id]);
      if (pemilikCheck.length === 0) return res.status(400).json({ message: 'pemilik_id tidak valid.' });
    }

    await db.query('UPDATE unit SET unit_number = ?, floor_id = ?, flat_id = ?, pemilik_id = ? WHERE unit_id = ?',
      [unit_number, floor_id, flat_id, pemilik_id || null, unit_id]
    );
    res.status(200).json({ message: 'Unit berhasil diperbarui.' });
  } catch (error) {
    console.error('Error memperbarui unit:', error);
    res.status(500).json({ message: 'Gagal memperbarui unit.' });
  }
});

// =====================================================
// DELETE hapus unit + devices terkait
// =====================================================
router.delete('/:unit_id', async (req, res) => {
  const { unit_id } = req.params;

  try {
    // 1️⃣ Hapus semua devices unit dari APP backend
    try {
      await axios.delete(`${APP_URL}/devices/unit/${unit_id}`);
      console.log(`Devices unit ${unit_id} berhasil dihapus di APP backend.`);
    } catch (err) {
      console.error(`Gagal menghapus devices unit ${unit_id} di APP backend:`, err.message);
      // Kita bisa lanjut hapus unit meskipun gagal hapus devices
    }

    // 2️⃣ Hapus unit di ADM DB
    const [result] = await db.query('DELETE FROM unit WHERE unit_id = ?', [unit_id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Unit tidak ditemukan.' });

    res.status(200).json({ message: 'Unit dan devices terkait berhasil dihapus.' });
  } catch (error) {
    console.error('Error menghapus unit:', error);
    res.status(500).json({ message: 'Gagal menghapus unit.' });
  }
});

module.exports = router;
