/**
 * Smart Tree Tracker - Backend API Server
 * Express + MariaDB REST API
 */

const express = require('express');
const cors = require('cors');
const recordsRouter = require('./routes/records');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow base64 images up to 10MB
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/records', recordsRouter);

// Health check
app.get('/api/health', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT 1 AS alive');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: rows[0].alive ? 'MariaDB OK' : 'error'
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌳 Smart Tree Tracker API running on http://0.0.0.0:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
