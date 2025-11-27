const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.tower_id, 
        t.tower_name, 
        t.flat_id, 
        f.flat_name 
      FROM tower t
      JOIN flat f ON t.flat_id = f.flat_id
      ORDER BY t.tower_id
    `);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil data tower:', error);
    res.status(500).json({ message: 'Gagal mengambil data tower.' });
  }
});

router.get('/:tower_id', async (req, res) => {
  const { tower_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        t.tower_id, 
        t.tower_name, 
        t.flat_id, 
        f.flat_name 
      FROM tower t
      JOIN flat f ON t.flat_id = f.flat_id
      WHERE t.tower_id = ?
    `, 
    [tower_id]
  );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tower tidak ditemukan.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error mengambil tower berdasarkan id:', error);
    res.status(500).json({ message: 'Gagal mengambil data tower.' });
  }
});

router.post('/', async (req, res) => {
  const { tower_id, tower_name, flat_id } = req.body;

  if (!tower_id || !tower_name || !flat_id) {
    return res.status(400).json({ message: 'id tower, nama tower, dan id rusun wajib diisi.' });
  }

  try {
    //cek apakah tower_id sudah ada
    const [check] = await db.query(
      'SELECT tower_id FROM tower WHERE tower_id = ?',
      [tower_id]
    );

    if (check.length > 0) {
      return res.status(409).json({
        message: 'id tower sudah digunakan. Harap gunakan id tower lain.'
      });
    }

    //cek apakah flat_id valid
    const [flatCheck] = await db.query(
      'SELECT flat_id FROM flat WHERE flat_id = ?',
      [flat_id]
    );

    if (flatCheck.length === 0) {
      return res.status(400).json({
        message: 'id rusun tidak valid. Rusun tidak ditemukan.'
      });
    }

    //lanjut insert jika aman
    await db.query(
      'INSERT INTO tower (tower_id, tower_name, flat_id) VALUES (?, ?, ?)',
      [tower_id, tower_name, flat_id]
    );

    res.status(201).json({ message: 'Tower berhasil ditambahkan.' });

  } catch (error) {
    console.error('Error menambahkan tower:', error);
    res.status(500).json({ message: 'Gagal menambahkan tower.' });
  }
});

router.put('/:tower_id', async (req, res) => {
  const { tower_id } = req.params;
  const { tower_name } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE tower SET tower_name = ? WHERE tower_id = ?',
      [tower_name, tower_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tower tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Tower berhasil diperbarui.' });

  } catch (error) {
    console.error('Error memperbarui tower:', error);
    res.status(500).json({ message: 'Gagal memperbarui tower.' });
  }
});

router.delete('/:tower_id', async (req, res) => {
  const { tower_id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM tower WHERE tower_id = ?', [tower_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tower tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Tower berhasil dihapus.' });
  } catch (error) {
    console.error('Error menghapus tower:', error);
    res.status(500).json({ message: 'Gagal menghapus tower.' });
  }
});

module.exports = router;
