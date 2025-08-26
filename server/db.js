const mysql = require('mysql2');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // replace with your MySQL root password
  database: 'smart_product_finder',
});

module.exports = db;
