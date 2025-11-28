const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT fl.floor_id, fl.floor_number, fl.tower_id,
             t.tower_name, f.flat_id, f.flat_name
      FROM floor fl
      JOIN tower t ON fl.tower_id = t.tower_id
      JOIN flat f ON t.flat_id = f.flat_id
      ORDER BY fl.floor_number
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data floor.' });
  }
});

router.get('/:floor_id', async (req, res) => {
  const { floor_id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT fl.floor_id, fl.floor_number, fl.tower_id,
             t.tower_name, f.flat_id, f.flat_name
      FROM floor fl
      JOIN tower t ON fl.tower_id = t.tower_id
      JOIN flat f ON t.flat_id = f.flat_id
      WHERE fl.floor_id = ?
    `, [floor_id]);

    if (!rows.length)
      return res.status(404).json({ message: 'Floor tidak ditemukan.' });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data floor.' });
  }
});

router.get('/:floor_id/unit', async (req, res) => {
  const { floor_id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT u.unit_id, u.unit_number, u.pemilik_id, u.floor_id
      FROM unit u
      WHERE u.floor_id = ?
      ORDER BY u.unit_number
    `, [floor_id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil unit dalam floor ini.' });
  }
});

router.post('/', async (req, res) => {
  const { floor_id, floor_number, tower_id } = req.body;

  if (!floor_id || !floor_number || !tower_id) {
    return res.status(400).json({
      message: 'floor_id, floor_number, dan tower_id wajib diisi.'
    });
  }

  try {
    const [towerCheck] = await db.query(
      'SELECT tower_id FROM tower WHERE tower_id = ?',
      [tower_id]
    );

    if (!towerCheck.length) {
      return res.status(400).json({
        message: `tower_id '${tower_id}' tidak valid.`
      });
    }

    await db.query(
      'INSERT INTO floor (floor_id, floor_number, tower_id) VALUES (?, ?, ?)',
      [floor_id, floor_number, tower_id]
    );

    res.status(201).json({ message: 'Floor berhasil ditambahkan.' });

  } catch (err) {
    console.error("POST floor error:", err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: `Lantai dengan ID '${floor_id}' sudah ada.`
      });
    }

    res.status(500).json({ message: 'Gagal menambahkan floor.' });
  }
});

router.put('/:floor_id', async (req, res) => {
  const { floor_id } = req.params;
  const { floor_number } = req.body;

  try {
    const [check] = await db.query(
      'SELECT floor_id FROM floor WHERE floor_id = ?',
      [floor_id]
    );

    if (!check.length)
      return res.status(404).json({ message: 'Floor tidak ditemukan.' });

    await db.query(
      'UPDATE floor SET floor_number = ? WHERE floor_id = ?',
      [floor_number, floor_id]
    );

    res.json({ message: 'Floor berhasil diperbarui.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui floor.' });
  }
});

router.delete('/:floor_id', async (req, res) => {
  const { floor_id } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM floor WHERE floor_id = ?',
      [floor_id]
    );

    if (!result.affectedRows)
      return res.status(404).json({ message: 'Floor tidak ditemukan.' });

    res.json({ message: 'Floor berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus floor.' });
  }
});

module.exports = router;
