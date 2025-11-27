const express = require('express');
const router = express.Router();
const db = require('../db'); 


router.get('/tower/:tower_id', async (req, res) => {
  const { tower_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        fl.floor_id,
        fl.floor_number,
        fl.tower_id,
        t.tower_name,
        f.flat_id,
        f.flat_name
      FROM floor fl
      JOIN tower t ON fl.tower_id = t.tower_id
      JOIN flat f ON t.flat_id = f.flat_id
      WHERE fl.tower_id = ?
      ORDER BY fl.floor_number
    `, [tower_id]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil floor berdasarkan tower:', error);
    res.status(500).json({ message: 'Gagal mengambil data floor berdasarkan tower.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        fl.floor_id,
        fl.floor_number,
        fl.tower_id,
        t.tower_name,
        f.flat_id,
        f.flat_name
      FROM floor fl
      JOIN tower t ON fl.tower_id = t.tower_id
      JOIN flat f ON t.flat_id = f.flat_id
      ORDER BY fl.floor_id
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil data lantai:', error);
    res.status(500).json({ message: 'Gagal mengambil data lantai.' });
  }
});

router.get('/:floor_id', async (req, res) => {
  const { floor_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        fl.floor_id,
        fl.floor_number,
        fl.tower_id,
        t.tower_name,
        f.flat_id,
        f.flat_name
      FROM floor fl
      JOIN tower t ON fl.tower_id = t.tower_id
      JOIN flat f ON t.flat_id = f.flat_id
      WHERE fl.floor_id = ?
    `,
    [floor_id]
  );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lantai tidak ditemukan.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error mengambil lantai berdasarkan id:', error);
    res.status(500).json({ message: 'Gagal mengambil data lantai.' });
  }
});

router.post('/', async (req, res) => {
  const { floor_id, floor_number, tower_id } = req.body;

  if (!floor_id || !floor_number || !tower_id) {
    return res.status(400).json({ message: 'id lantai, nomor lantai, dan id tower wajib diisi.'});
  }

  try {
    //cek apakah floor_id sudah ada
    const [check] = await db.query(
      'SELECT floor_id FROM floor WHERE floor_id = ?',
      [floor_id]
    );

    if (check.length > 0) {
      return res.status(409).json({
        message: 'id lantai sudah digunakan. Harap gunakan id lantai lain.'
      });
    }

    // cek apakah tower_id valid
    const [towerCheck] = await db.query(
      'SELECT tower_id FROM tower WHERE tower_id = ?',
      [tower_id]
    );

    if (towerCheck.length === 0) {
      return res.status(400).json({
        message: 'id tower tidak valid. Tower tidak ditemukan.'
      });
    }

    //lanjut insert jika aman
    await db.query(
      'INSERT INTO floor (floor_id, floor_number, tower_id) VALUES (?, ?, ?)',
      [floor_id, floor_number, tower_id]
    );

    res.status(201).json({ message: 'Lantai berhasil ditambahkan.' });

  } catch (error) {
    console.error('Error menambahkan lantai:', error);
    res.status(500).json({ message: 'Gagal menambahkan lantai.' });
  }
});

router.put('/:floor_id', async (req, res) => {
  const { floor_id } = req.params;
  const { floor_number } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE floor SET floor_number = ? WHERE floor_id = ?',
      [floor_number, floor_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Lantai tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Lantai berhasil diperbarui.' });

  } catch (error) {
    console.error('Error memperbarui lantai:', error);
    res.status(500).json({ message: 'Gagal memperbarui lantai.' });
  }
});


router.delete('/:floor_id', async (req, res) => {
  const { floor_id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM floor WHERE floor_id = ?', [floor_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Lantai tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Lantai berhasil dihapus.' });
  } catch (error) {
    console.error('Error menghapus lantai:', error);
    res.status(500).json({ message: 'Gagal menghapus lantai.' });
  }
});

module.exports = router;
