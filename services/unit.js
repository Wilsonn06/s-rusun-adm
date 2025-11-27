const express = require('express');
const router = express.Router();
const axios = require('axios');

const ADMIN_URL = 'http://s-rusun-adm:3001'; // URL modul admin

// =====================================================
// GET semua unit milik pribadi (pemilik yang sedang login)
// =====================================================
router.get('/', async (req, res) => {
  try {
    // ⛔ Simulasi login sementara
    // Nanti ganti dengan req.user.pemilik_id (kalau sudah ada auth middleware)
    const pemilik_id = 'PM001';

    // Ambil semua unit dari modul admin
    const response = await axios.get(`${ADMIN_URL}/unit`);
    const allUnits = response.data;

    // Filter unit milik pemilik yang sedang login
    const personalUnits = allUnits.filter(unit => unit.pemilik_id === pemilik_id);

    if (personalUnits.length === 0) {
      return res.status(404).json({
        message: 'Anda belum memiliki unit.',
        data: [],
      });
    }

    res.status(200).json({
      message: 'Berhasil mengambil unit Anda.',
      total: personalUnits.length,
      data: personalUnits,
    });
  } catch (error) {
    console.error('Error mengambil unit pribadi:', error.message);

    // Jika admin service tidak bisa dihubungi
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'Service Admin tidak dapat dihubungi.' });
    }

    res.status(500).json({ message: 'Gagal mengambil data unit pribadi.' });
  }
});

router.get("/:unit_id", async (req, res) => {
  try {
    const { unit_id } = req.params;

    // 1. Ambil unit dari ADMIN
    const unitRes = await axios.get(`${ADMIN_URL}/unit/${unit_id}`);
    const unit = unitRes.data.data || unitRes.data;

    // 2. Ambil detail tower
    const towerRes = await axios.get(`${ADMIN_URL}/tower/${unit.tower_id}`);
    const tower = towerRes.data.data || towerRes.data || {};

    // 3. Ambil detail floor
    const floorRes = await axios.get(`${ADMIN_URL}/floor/${unit.floor_id}`);
    const floor = floorRes.data.data || floorRes.data || {};

    // 4. Ambil detail flat
    const flatRes = await axios.get(`${ADMIN_URL}/flat/${unit.flat_id}`);
    const flat = flatRes.data.data || flatRes.data || {};

    // 5. Combine data
    return res.json({
      ...unit,
      tower_name: tower.tower_name || null,
      floor_number: floor.floor_number || null,
      flat_name: flat.flat_name || null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memuat detail unit" });
  }
});


module.exports = router;
