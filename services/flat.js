const express = require('express');
const router = express.Router();
const db = require('../db');

// =====================================================
// GET semua flat
// =====================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM flat ORDER BY flat_id');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil data flat:', error);
    res.status(500).json({ message: 'Gagal mengambil data flat.' });
  }
});

// =====================================================
// GET flat berdasarkan ID
// =====================================================
router.get('/:flat_id', async (req, res) => {
  const { flat_id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM flat WHERE flat_id = ?', [flat_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Flat tidak ditemukan.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error mengambil flat berdasarkan ID:', error);
    res.status(500).json({ message: 'Gagal mengambil data flat.' });
  }
});

// =====================================================
// POST tambah flat baru
// =====================================================
router.post('/', async (req, res) => {
  const { flat_id, flat_name, flat_address } = req.body;

  if (!flat_id || !flat_name) {
    return res.status(400).json({ message: 'flat_id dan flat_name wajib diisi.' });
  }

  try {
    await db.query(
      'INSERT INTO flat (flat_id, flat_name, flat_address) VALUES (?, ?, ?)',
      [flat_id, flat_name, flat_address || null]
    );
    res.status(201).json({ message: 'Flat berhasil ditambahkan.' });
  } catch (error) {
    console.error('Error menambahkan flat:', error);
    res.status(500).json({ message: 'Gagal menambahkan flat.' });
  }
});

// =====================================================
// PUT update flat
// =====================================================
router.put('/:flat_id', async (req, res) => {
  const { flat_id } = req.params;
  const { flat_name, flat_address } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE flat SET flat_name = ?, flat_address = ? WHERE flat_id = ?',
      [flat_name, flat_address, flat_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Flat tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Flat berhasil diperbarui.' });
  } catch (error) {
    console.error('Error memperbarui flat:', error);
    res.status(500).json({ message: 'Gagal memperbarui flat.' });
  }
});

// =====================================================
// DELETE hapus flat
// =====================================================
router.delete('/:flat_id', async (req, res) => {
  const { flat_id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM flat WHERE flat_id = ?', [flat_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Flat tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Flat berhasil dihapus.' });
  } catch (error) {
    console.error('Error menghapus flat:', error);
    res.status(500).json({ message: 'Gagal menghapus flat.' });
  }
});

module.exports = router;
