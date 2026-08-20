const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');

const router = express.Router();

/**
 * TEMPORARY — for initial database setup only on hosts (like Render's
 * free tier) that don't give you a shell to run `npm run migrate` /
 * `npm run seed:admin` directly.
 *
 * Protected by a secret query param so randoms can't trigger it.
 * DELETE THIS FILE (and its mount in server.js) once your database
 * is set up — it should not stay live permanently.
 *
 * Usage: GET https://your-app.onrender.com/setup?key=YOUR_SETUP_KEY
 */
router.get('/setup', async (req, res) => {
  const { key } = req.query;

  if (!process.env.SETUP_KEY || key !== process.env.SETUP_KEY) {
    return res.status(403).json({ error: 'Invalid or missing setup key.' });
  }

  try {
    // 1. Run the migration SQL
    const sqlPath = path.join(__dirname, '../db/migrations.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);

    // 2. Seed the admin user (skip if it already exists)
    const email = 'admin@kitchenstock.local';
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    let adminStatus = 'already existed';
    if (existing.rows.length === 0) {
      const passwordHash = await bcrypt.hash('admin', 12);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, is_admin)
         VALUES ('Admin', $1, $2, TRUE)`,
        [email, passwordHash]
      );
      adminStatus = 'created';
    }

    res.json({
      success: true,
      migration: 'ran successfully (or tables already existed)',
      admin: adminStatus,
    });
  } catch (err) {
    console.error('Setup failed:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
