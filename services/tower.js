const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.tower_id, t.tower_name, t.flat_id, f.flat_name
      FROM tower t
      JOIN flat f ON t.flat_id = f.flat_id
      ORDER BY t.tower_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data tower.' });
  }
});

router.get('/:tower_id', async (req, res) => {
  const { tower_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT t.tower_id, t.tower_name, t.flat_id, f.flat_name
      FROM tower t
      JOIN flat f ON t.flat_id = f.flat_id
      WHERE t.tower_id = ?
    `, [tower_id]);

    if (!rows.length) return res.status(404).json({ message: 'Tower tidak ditemukan.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data tower.' });
  }
});

router.get('/:tower_id/floor', async (req, res) => {
  const { tower_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT fl.floor_id, fl.floor_number, fl.tower_id
      FROM floor fl
      WHERE fl.tower_id = ?
      ORDER BY fl.floor_number
    `, [tower_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil floor dalam tower ini.' });
  }
});

router.post('/', async (req, res) => {
  const { tower_id, tower_name, flat_id } = req.body;

  if (!tower_id || !tower_name || !flat_id) {
    return res.status(400).json({
      message: 'tower_id, tower_name, dan flat_id wajib diisi.'
    });
  }

  try {
    const [flatCheck] = await db.query(
      'SELECT flat_id FROM flat WHERE flat_id = ?',
      [flat_id]
    );

    if (!flatCheck.length) {
      return res.status(400).json({
        message: `flat_id '${flat_id}' tidak valid.`
      });
    }

    await db.query(
      'INSERT INTO tower (tower_id, tower_name, flat_id) VALUES (?, ?, ?)',
      [tower_id, tower_name, flat_id]
    );

    res.status(201).json({ message: 'Tower berhasil ditambahkan.' });

  } catch (err) {
    console.error("POST tower error:", err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: `Tower dengan ID '${tower_id}' sudah ada.`
      });
    }

    res.status(500).json({ message: 'Gagal menambahkan tower.' });
  }
});

router.put('/:tower_id', async (req, res) => {
  const { tower_id } = req.params;
  const { tower_name, flat_id } = req.body;

  try {
    const [check] = await db.query(
      'SELECT tower_id FROM tower WHERE tower_id = ?',
      [tower_id]
    );
    if (!check.length)
      return res.status(404).json({ message: 'Tower tidak ditemukan.' });

    if (flat_id === undefined) {
      await db.query(
        'UPDATE tower SET tower_name = ? WHERE tower_id = ?',
        [tower_name, tower_id]
      );
    } else {
      await db.query(
        'UPDATE tower SET tower_name = ?, flat_id = ? WHERE tower_id = ?',
        [tower_name, flat_id, tower_id]
      );
    }

    res.json({ message: 'Tower berhasil diperbarui.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui tower.' });
  }
});


router.delete('/:tower_id', async (req, res) => {
  const { tower_id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM tower WHERE tower_id = ?', [tower_id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Tower tidak ditemukan.' });

    res.json({ message: 'Tower berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus tower.' });
  }
});

module.exports = router;
