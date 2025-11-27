const express = require('express');
const router = express.Router();
const axios = require('axios');

const ADMIN_URL = 'http://s-rusun-adm:3001';

// Simulasi login
const pemilikId = "PM001";

router.get('/', async (req, res) => {
  try {
    console.log("👉 Memanggil ADMIN /unit");

    const unitResp = await axios.get(`${ADMIN_URL}/unit`);
    console.log("👉 Hasil /unit:", unitResp.data);

    const units = unitResp.data;

    const myUnits = units.filter(u => u.pemilik_id == pemilikId);

    console.log("👉 Unit milik user:", myUnits);

    const floorIds = [...new Set(myUnits.map(u => u.floor_id))];

    console.log("👉 floorIds:", floorIds);

    const floors = [];

    for (const floorId of floorIds) {
      console.log(`👉 Memanggil ADMIN /floor/${floorId}`);

      const floorResp = await axios.get(`${ADMIN_URL}/floor/${floorId}`);
      console.log("👉 Hasil floor:", floorResp.data);

      const data = floorResp.data;

      const floorObj = data.data ? data.data : data;

      floors.push(floorObj);
    }

    res.json({ message: "OK", data: floors });

  } catch (err) {
    console.error("🔥 ERROR di service /floor:", err.response?.data || err.message);
    res.status(500).json({ message: "Gagal mengambil floor" });
  }
});

module.exports = router;
