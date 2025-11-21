// /mnt/data/app.js
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 3001;

app.use(cors());
app.use(express.json());

// NOTE: Auth disabled for development / no-auth mode
// Removed mounting of /auth service so ADM no longer requires login.
// If you later want to re-enable auth, uncomment the next line and ensure services/auth exists.
// app.use('/auth', require('./services/auth'));

app.use('/flat', require('./services/flat'));
app.use('/tower', require('./services/tower'));
app.use('/unit', require('./services/unit'));
app.use('/floor', require('./services/floor'));
app.use('/pemilik', require('./services/pemilik'));
app.use('/devices', require('./services/devices'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (auth disabled)`); 
});
