const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM flat ORDER BY flat_id');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil data rusun:', error);
    res.status(500).json({ message: 'Gagal mengambil data rusun.' });
  }
});

router.get('/:flat_id', async (req, res) => {
  const { flat_id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM flat WHERE flat_id = ?', [flat_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Rusun tidak ditemukan.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error mengambil rusun berdasarkan id:', error);
    res.status(500).json({ message: 'Gagal mengambil data rusun.' });
  }
});

router.post('/', async (req, res) => {
  const { flat_id, flat_name, flat_address } = req.body;

  if (!flat_id || !flat_name) {
    return res.status(400).json({ message: 'id rusun dan nama rusun wajib diisi.' });
  }

  try {
    //cek apakah flat_id sudah ada
    const [check] = await db.query(
      'SELECT flat_id FROM flat WHERE flat_id = ?',
      [flat_id]
    );

    if (check.length > 0) {
      return res.status(409).json({
        message: 'id rusun sudah digunakan. Harap gunakan id rusun lain.'
      });
    }

    //lanjut insert jika aman
    await db.query(
      'INSERT INTO flat (flat_id, flat_name, flat_address) VALUES (?, ?, ?)',
      [flat_id, flat_name, flat_address || null]
    );

    res.status(201).json({ message: 'Rusun berhasil ditambahkan.' });

  } catch (error) {
    console.error('Error menambahkan flat:', error);
    res.status(500).json({ message: 'Gagal menambahkan rusun.' });
  }
});

router.put('/:flat_id', async (req, res) => {
  const { flat_id } = req.params;
  const { flat_name, flat_address } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE flat SET flat_name = ?, flat_address = ? WHERE flat_id = ?',
      [flat_name, flat_address, flat_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rusun tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Rusun berhasil diperbarui.' });
  } catch (error) {
    console.error('Error memperbarui rusun:', error);
    res.status(500).json({ message: 'Gagal memperbarui rusun.' });
  }
});

router.delete('/:flat_id', async (req, res) => {
  const { flat_id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM flat WHERE flat_id = ?', [flat_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rusun tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Rusun berhasil dihapus.' });
  } catch (error) {
    console.error('Error menghapus rusun:', error);
    res.status(500).json({ message: 'Gagal menghapus rusun.' });
  }
});

module.exports = router;
