const express = require('express');
const router = express.Router();
const axios = require('axios');

const APP_URL = "http://s-rusun-app:3002";

router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${APP_URL}/devices`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil semua perangkat" });
  }
});

router.get('/unit/:unit_id', async (req, res) => {
  try {
    const response = await axios.get(`${APP_URL}/devices/unit/${req.params.unit_id}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil perangkat berdasarkan unit" });
  }
});

router.get('/:device_id', async (req, res) => {
  try {
    const response = await axios.get(`${APP_URL}/devices/${req.params.device_id}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil detail perangkat" });
  }
});

router.post('/', async (req, res) => {
  try {
    const response = await axios.post(`${APP_URL}/devices`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Gagal membuat perangkat" });
  }
});

router.put('/:device_id', async (req, res) => {
  try {
    const response = await axios.put(`${APP_URL}/devices/${req.params.device_id}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Gagal update device" });
  }
});

router.delete('/:device_id', async (req, res) => {
  try {
    const response = await axios.delete(`${APP_URL}/devices/${req.params.device_id}`);
    res.json({ message: "Device berhasil dihapus", result: response.data });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus device" });
  }
});

module.exports = router;
