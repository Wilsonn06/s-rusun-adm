const express = require('express');
const router = express.Router();
const db = require('../db');

// =====================================================
// GET semua floor (beserta tower_name & flat_name)
// =====================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        fl.floor_id,
        fl.floor_number,
        fl.tower_id,
        fl.flat_id,
        t.tower_name,
        f.flat_name
      FROM floor fl
      JOIN tower t ON fl.tower_id = t.tower_id
      JOIN flat f ON fl.flat_id = f.flat_id
      ORDER BY fl.floor_id
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil data floor:', error);
    res.status(500).json({ message: 'Gagal mengambil data floor.' });
  }
});

// =====================================================
// GET floor berdasarkan ID
// =====================================================
router.get('/:floor_id', async (req, res) => {
  const { floor_id } = req.params;
  try {
    const [rows] = await db.query(
      `
      SELECT 
        fl.floor_id,
        fl.floor_number,
        fl.tower_id,
        fl.flat_id,
        t.tower_name,
        f.flat_name
      FROM floor fl
      JOIN tower t ON fl.tower_id = t.tower_id
      JOIN flat f ON fl.flat_id = f.flat_id
      WHERE fl.floor_id = ?
      `,
      [floor_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Floor tidak ditemukan.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error mengambil floor berdasarkan ID:', error);
    res.status(500).json({ message: 'Gagal mengambil data floor.' });
  }
});

// =====================================================
// POST tambah floor baru
// =====================================================
router.post('/', async (req, res) => {
  const { floor_id, floor_number, tower_id, flat_id } = req.body;

  if (!floor_id || !floor_number || !tower_id || !flat_id) {
    return res.status(400).json({
      message: 'floor_id, floor_number, tower_id, dan flat_id wajib diisi.',
    });
  }

  try {
    // Pastikan tower & flat valid
    const [towerCheck] = await db.query('SELECT * FROM tower WHERE tower_id = ?', [tower_id]);
    const [flatCheck] = await db.query('SELECT * FROM flat WHERE flat_id = ?', [flat_id]);

    if (towerCheck.length === 0) {
      return res.status(400).json({ message: 'tower_id tidak valid.' });
    }
    if (flatCheck.length === 0) {
      return res.status(400).json({ message: 'flat_id tidak valid.' });
    }

    await db.query(
      'INSERT INTO floor (floor_id, floor_number, tower_id, flat_id) VALUES (?, ?, ?, ?)',
      [floor_id, floor_number, tower_id, flat_id]
    );

    res.status(201).json({ message: 'Floor berhasil ditambahkan.' });
  } catch (error) {
    console.error('Error menambahkan floor:', error);
    res.status(500).json({ message: 'Gagal menambahkan floor.' });
  }
});

// =====================================================
// PUT update floor
// =====================================================
router.put('/:floor_id', async (req, res) => {
  const { floor_id } = req.params;
  const { floor_number, tower_id, flat_id } = req.body;

  try {
    // Cek apakah floor ada
    const [floorCheck] = await db.query('SELECT * FROM floor WHERE floor_id = ?', [floor_id]);
    if (floorCheck.length === 0) {
      return res.status(404).json({ message: 'Floor tidak ditemukan.' });
    }

    // Cek validitas tower & flat (jika dikirim)
    if (tower_id) {
      const [towerCheck] = await db.query('SELECT * FROM tower WHERE tower_id = ?', [tower_id]);
      if (towerCheck.length === 0) {
        return res.status(400).json({ message: 'tower_id tidak valid.' });
      }
    }
    if (flat_id) {
      const [flatCheck] = await db.query('SELECT * FROM flat WHERE flat_id = ?', [flat_id]);
      if (flatCheck.length === 0) {
        return res.status(400).json({ message: 'flat_id tidak valid.' });
      }
    }

    await db.query(
      'UPDATE floor SET floor_number = ?, tower_id = ?, flat_id = ? WHERE floor_id = ?',
      [floor_number, tower_id, flat_id, floor_id]
    );

    res.status(200).json({ message: 'Floor berhasil diperbarui.' });
  } catch (error) {
    console.error('Error memperbarui floor:', error);
    res.status(500).json({ message: 'Gagal memperbarui floor.' });
  }
});

// =====================================================
// DELETE hapus floor
// =====================================================
router.delete('/:floor_id', async (req, res) => {
  const { floor_id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM floor WHERE floor_id = ?', [floor_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Floor tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Floor berhasil dihapus.' });
  } catch (error) {
    console.error('Error menghapus floor:', error);
    res.status(500).json({ message: 'Gagal menghapus floor.' });
  }
});

module.exports = router;
