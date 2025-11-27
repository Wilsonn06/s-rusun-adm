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
        p.nama AS pemilik_nama,
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
      LEFT JOIN pemilik p ON u.pemilik_id = p.pemilik_id
      ORDER BY u.unit_id
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil data unit:', error);
    res.status(500).json({ message: 'Gagal mengambil data unit.' });
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
      LEFT JOIN floor f ON u.floor_id = f.floor_id
      LEFT JOIN tower t ON f.tower_id = t.tower_id
      LEFT JOIN flat fl ON t.flat_id = fl.flat_id
      WHERE u.unit_id = ?
    `, 
    [unit_id]
  );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Unit tidak ditemukan.' }
    );

    res.status(200).json({ data: rows[0] });
  } catch (error) {
    console.error('Error mengambil unit berdasarkan id:', error);
    res.status(500).json({ message: 'Gagal mengambil data unit.' });
  }
});

router.get('/:unit_id/devices', async (req, res) => {
  const { unit_id } = req.params;
  try {
    const response = await axios.get(`${APP_URL}/devices/unit/${unit_id}`);
    res.status(200).json(response.data.devices);
  } catch (err) {
    console.error('Gagal mengambil devices unit:', err.message);
    res.status(500).json({ message: 'Gagal mengambil devices unit' });
  }
});

router.post('/', async (req, res) => {
  const { unit_id, unit_number, floor_id } = req.body;

  if (!unit_id || !unit_number || !floor_id) {
    return res.status(400).json({
      message: 'id unit, nomor unit, dan id lantai wajib diisi.'
    });
  }

  try {
    //cek apakah unit_id sudah ada
    const [check] = await db.query(
      'SELECT unit_id FROM unit WHERE unit_id = ?',
      [unit_id]
    );

    if (check.length > 0) {
      return res.status(409).json({
        message: 'id unit sudah digunakan. Harap gunakan id unit lain.'
      });
    }

    //cek apakah floor_id valid
    const [floorCheck] = await db.query(
      'SELECT floor_id FROM floor WHERE floor_id = ?',
      [floor_id]
    );

    if (floorCheck.length === 0) {
      return res.status(400).json({
        message: 'id lantai tidak valid. Lantai tidak ditemukan.'
      });
    }

    //lanjut insert jika aman
    await db.query(
      'INSERT INTO unit (unit_id, unit_number, floor_id) VALUES (?, ?, ?)',
      [unit_id, unit_number, floor_id]
    );

    res.status(201).json({ message: 'Unit berhasil ditambahkan.' });

  } catch (error) {
    console.error('Error menambahkan unit:', error);
    res.status(500).json({ message: 'Gagal menambahkan unit.' });
  }
});

router.put('/:unit_id', async (req, res) => {
  const { unit_id } = req.params;
  const { unit_number, pemilik_id } = req.body;

  try {
    //validasi pemilik_id jika diisi
    if (pemilik_id) {
      const [pemilikCheck] = await db.query(
        'SELECT pemilik_id FROM pemilik WHERE pemilik_id = ?',
        [pemilik_id]
      );

      if (pemilikCheck.length === 0) {
        return res.status(400).json({
          message: 'pemilik_id tidak valid.'
        });
      }
    }

    const [result] = await db.query(
      `UPDATE unit SET unit_number = ?, pemilik_id = ? WHERE unit_id = ?`,
      [unit_number, pemilik_id || null, unit_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Unit tidak ditemukan.'});
    }

    res.status(200).json({ message: 'Unit berhasil diperbarui.' });

  } catch (error) {
    console.error('Error memperbarui unit:', error);
    res.status(500).json({ message: 'Gagal memperbarui unit.' });
  }
});

router.delete('/:unit_id', async (req, res) => {
  const { unit_id } = req.params;

  try {
    try {
      await axios.delete(`${APP_URL}/devices/unit/${unit_id}`);
      console.log(`Devices unit ${unit_id} berhasil dihapus.`);
    } catch (err) {
      console.error(`Gagal hapus devices unit ${unit_id}:`, err.message);
    }

    const [result] = await db.query(
      'DELETE FROM unit WHERE unit_id = ?', 
      [unit_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Unit tidak ditemukan.' });

    res.status(200).json({ message: 'Unit dan devices terkait berhasil dihapus.' });
  } catch (error) {
    console.error('Error menghapus unit:', error);
    res.status(500).json({ message: 'Gagal menghapus unit.' });
  }
});

module.exports = router;
