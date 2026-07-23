/**
 * Smart Tree Tracker - MariaDB Connection Pool
 */

const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'tracker',
  password: process.env.DB_PASSWORD || 'tracker_pass',
  database: process.env.DB_NAME || 'tree_tracker',
  connectionLimit: 5,
  acquireTimeout: 30000,
});

module.exports = pool;
