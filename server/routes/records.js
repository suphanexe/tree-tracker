/**
 * Smart Tree Tracker - Records API Routes
 * CRUD operations for tree health records
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/records - Get all records (sorted by timestamp desc)
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT * FROM tree_records ORDER BY timestamp DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/records]', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/records/stats - Get aggregate statistics
router.get('/stats', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const [totalTrees, totalRecords, caretakerCount, statusCounts] = await Promise.all([
      conn.query('SELECT COUNT(DISTINCT tree_id) AS count FROM tree_records'),
      conn.query('SELECT COUNT(*) AS count FROM tree_records'),
      conn.query('SELECT COUNT(DISTINCT caretaker) AS count FROM tree_records'),
      conn.query(
        `SELECT t1.status, COUNT(*) AS count
         FROM tree_records t1
         INNER JOIN (
           SELECT tree_id, MAX(timestamp) AS max_ts
           FROM tree_records GROUP BY tree_id
         ) t2 ON t1.tree_id = t2.tree_id AND t1.timestamp = t2.max_ts
         GROUP BY t1.status`
      )
    ]);

    const normalCount = statusCounts.find(s => s.status === 'normal')?.count || 0;
    const total = totalTrees[0].count;

    res.json({
      totalTrees: total,
      totalRecords: totalRecords[0].count,
      normalCount,
      issueCount: total - normalCount,
      caretakerCount: caretakerCount[0].count
    });
  } catch (err) {
    console.error('[GET /api/records/stats]', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/records/search?q=query - Search records
router.get('/search', async (req, res) => {
  const query = req.query.q || '';
  if (!query.trim()) {
    return res.redirect('/api/records');
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const searchTerm = `%${query}%`;
    const rows = await conn.query(
      `SELECT * FROM tree_records
       WHERE tree_id LIKE ? OR caretaker LIKE ? OR notes LIKE ?
       ORDER BY timestamp DESC
       LIMIT 200`,
      [searchTerm, searchTerm, searchTerm]
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/records/search]', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/records/tree/:treeId - Get records for a specific tree
router.get('/tree/:treeId', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT * FROM tree_records WHERE tree_id = ? ORDER BY timestamp DESC',
      [req.params.treeId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/records/tree/:treeId]', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/records - Create a new record
router.post('/', async (req, res) => {
  const { treeId, caretaker, status, action, notes, photoUrl } = req.body;

  if (!treeId || !caretaker || !status || !action) {
    return res.status(400).json({
      error: 'Missing required fields: treeId, caretaker, status, action'
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const timestamp = Date.now();

    const result = await conn.query(
      `INSERT INTO tree_records (tree_id, caretaker, status, action, notes, photo_url, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [treeId, caretaker, status, action, notes || '', photoUrl || null, timestamp]
    );

    const newRecord = {
      id: result.insertId.toString(),
      treeId,
      caretaker,
      status,
      action,
      notes: notes || '',
      photoUrl: photoUrl || null,
      timestamp
    };

    res.status(201).json(newRecord);
  } catch (err) {
    console.error('[POST /api/records]', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /api/records/:id - Delete a record
router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'DELETE FROM tree_records WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Deleted', id: req.params.id });
  } catch (err) {
    console.error('[DELETE /api/records/:id]', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /api/records - Clear all records
router.delete('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM tree_records');
    res.json({ message: 'All records cleared' });
  } catch (err) {
    console.error('[DELETE /api/records]', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
