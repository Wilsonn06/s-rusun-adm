const express = require('express');
const router = express.Router();
const db = require('../db');

// =====================================================
// GET semua unit (lengkap dengan floor_number dan flat_name)
// =====================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.unit_id,
        u.unit_number,
        u.pemilik_id,
        u.floor_id,
        f.floor_number,
        u.flat_id,
        fl.flat_name
      FROM unit u
      JOIN floor f ON u.floor_id = f.floor_id
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
    const [rows] = await db.query(
      `
      SELECT 
        u.unit_id,
        u.unit_number,
        u.pemilik_id,        -- 🟢 Tambahkan baris ini
        u.floor_id,
        f.floor_number,
        u.flat_id,
        fl.flat_name
      FROM unit u
      JOIN floor f ON u.floor_id = f.floor_id
      JOIN flat fl ON u.flat_id = fl.flat_id
      WHERE u.unit_id = ?
      `,
      [unit_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Unit tidak ditemukan.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error mengambil unit berdasarkan ID:', error);
    res.status(500).json({ message: 'Gagal mengambil data unit.' });
  }
});


// =====================================================
// POST tambah unit baru
// =====================================================
router.post('/', async (req, res) => {
  const { unit_id, unit_number, floor_id, flat_id } = req.body;

  if (!unit_id || !unit_number || !floor_id || !flat_id) {
    return res.status(400).json({
      message: 'unit_id, unit_number, floor_id, dan flat_id wajib diisi.',
    });
  }

  try {
    // Pastikan floor dan flat valid
    const [floorCheck] = await db.query('SELECT * FROM floor WHERE floor_id = ?', [floor_id]);
    const [flatCheck] = await db.query('SELECT * FROM flat WHERE flat_id = ?', [flat_id]);

    if (floorCheck.length === 0) {
      return res.status(400).json({ message: 'floor_id tidak valid.' });
    }
    if (flatCheck.length === 0) {
      return res.status(400).json({ message: 'flat_id tidak valid.' });
    }

    await db.query(
      'INSERT INTO unit (unit_id, unit_number, floor_id, flat_id) VALUES (?, ?, ?, ?)',
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
  const { unit_number, floor_id, flat_id } = req.body;

  try {
    // Cek apakah unit ada
    const [unitCheck] = await db.query('SELECT * FROM unit WHERE unit_id = ?', [unit_id]);
    if (unitCheck.length === 0) {
      return res.status(404).json({ message: 'Unit tidak ditemukan.' });
    }

    // Cek validitas floor & flat (jika dikirim)
    if (floor_id) {
      const [floorCheck] = await db.query('SELECT * FROM floor WHERE floor_id = ?', [floor_id]);
      if (floorCheck.length === 0) {
        return res.status(400).json({ message: 'floor_id tidak valid.' });
      }
    }
    if (flat_id) {
      const [flatCheck] = await db.query('SELECT * FROM flat WHERE flat_id = ?', [flat_id]);
      if (flatCheck.length === 0) {
        return res.status(400).json({ message: 'flat_id tidak valid.' });
      }
    }

    await db.query(
      'UPDATE unit SET unit_number = ?, floor_id = ?, flat_id = ? WHERE unit_id = ?',
      [unit_number, floor_id, flat_id, unit_id]
    );

    res.status(200).json({ message: 'Unit berhasil diperbarui.' });
  } catch (error) {
    console.error('Error memperbarui unit:', error);
    res.status(500).json({ message: 'Gagal memperbarui unit.' });
  }
});

// =====================================================
// DELETE hapus unit
// =====================================================
router.delete('/:unit_id', async (req, res) => {
  const { unit_id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM unit WHERE unit_id = ?', [unit_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Unit tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Unit berhasil dihapus.' });
  } catch (error) {
    console.error('Error menghapus unit:', error);
    res.status(500).json({ message: 'Gagal menghapus unit.' });
  }
});

module.exports = router;
