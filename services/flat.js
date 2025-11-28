const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT flat_id, flat_name, flat_address FROM flat ORDER BY flat_id'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data flat.' });
  }
});

router.get('/:flat_id', async (req, res) => {
  const { flat_id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT flat_id, flat_name, flat_address FROM flat WHERE flat_id = ?',
      [flat_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Flat tidak ditemukan.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data flat.' });
  }
});

router.get('/:flat_id/tower', async (req, res) => {
  const { flat_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT t.tower_id, t.tower_name, t.flat_id
      FROM tower t
      WHERE t.flat_id = ?
      ORDER BY t.tower_id
    `, [flat_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil tower di flat ini.' });
  }
});

router.post('/', async (req, res) => {
  const { flat_id, flat_name, flat_address } = req.body;
  if (!flat_id || !flat_name)
    return res.status(400).json({ message: 'flat_id dan flat_name wajib diisi.' });

  try {
    await db.query(
      'INSERT INTO flat (flat_id, flat_name, flat_address) VALUES (?, ?, ?)',
      [flat_id, flat_name, flat_address || null]
    );

    res.status(201).json({ message: 'Flat berhasil ditambahkan.' });
  } catch (err) {
    console.error(err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: `Rusun dengan ID '${flat_id}' sudah ada.`
      });
    }

    res.status(500).json({ message: 'Gagal menambahkan flat.' });
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
    if (!result.affectedRows) return res.status(404).json({ message: 'Flat tidak ditemukan.' });

    res.json({ message: 'Flat berhasil diperbarui.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui flat.' });
  }
});

router.delete('/:flat_id', async (req, res) => {
  const { flat_id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM flat WHERE flat_id = ?', [flat_id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Flat tidak ditemukan.' });

    res.json({ message: 'Flat berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus flat.' });
  }
});

module.exports = router;
