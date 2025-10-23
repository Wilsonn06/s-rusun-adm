const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'mysql.srusun.id',
  user: 'wilson',
  password: 'WilsonSRusunDB!2025',
  database: 'payment',
});

module.exports = pool;
