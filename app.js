const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/flat', require('./services/flat'));
app.use('/tower', require('./services/tower'));
app.use('/unit', require('./services/unit'));
app.use('/floor', require('./services/floor'));
app.use('/pemilik', require('./services/pemilik'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
