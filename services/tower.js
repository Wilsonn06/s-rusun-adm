    const express = require("express");
    const router = express.Router();
    const axios = require("axios");

    const ADMIN_URL = "http://s-rusun-adm:3001";

    // =============================================
    // GET tower pribadi
    // =============================================
    router.get("/", async (req, res) => {
    try {
        const pemilikId = "PM001";

        // 1. Ambil unit pribadi langsung dari ADM
        const { data: allUnits } = await axios.get(`${ADMIN_URL}/unit`);
        const units = allUnits.filter(u => u.pemilik_id === pemilikId);

        if (units.length === 0) {
        return res.json({ message: "Tidak ada tower", data: [] });
        }

        // 2. Kumpulkan tower_id
        const towerIds = [...new Set(units.map(u => u.tower_id))];

        // 3. Ambil detail tower dari ADM
        const towers = [];
        for (const id of towerIds) {
        const { data } = await axios.get(`${ADMIN_URL}/tower/${id}`);
        towers.push(data);
        }

        res.json({ message: "OK", data: towers });

    } catch (err) {
        console.error("TOWER ERROR:", err);
        res.status(500).json({ message: "Gagal mengambil tower" });
    }
    });

    module.exports = router;
