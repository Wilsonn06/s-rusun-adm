const express = require('express');
const router = express.Router();
const axios = require('axios');

const ADMIN_URL = 'http://s-rusun-adm:3001';
const pemilikId = "PM001"; // sementara hardcoded login

// GET flat pribadi
router.get('/', async (req, res) => {
  try {
    // ambil unit pribadi
    // Ambil unit langsung dari ADM
    const { data: unitResp } = await axios.get(`${ADMIN_URL}/unit`);
    const allUnits = unitResp;
    const units = allUnits.filter(u => u.pemilik_id === pemilikId);

    const flatIds = [...new Set(units.map(u => u.flat_id))];

    const flats = [];
    for (const id of flatIds) {
      const { data } = await axios.get(`${ADMIN_URL}/flat/${id}`);
      flats.push(data);
    }

    res.json({ message: "OK", data: flats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil flat" });
  }
});

module.exports = router;
