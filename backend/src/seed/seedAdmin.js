import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../db/pool.js';

/**
 * Creates a real admin user row (email: admin@kitchenstock.local) with
 * is_admin = true, in addition to the hardcoded admin/admin bypass in
 * auth.controller.js. Run once after migrations:
 *
 *   node src/seed/seedAdmin.js
 */
async function seedAdmin() {
  const email = 'admin@kitchenstock.local';
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

  if (existing.rows.length > 0) {
    console.log('Admin user already exists, skipping.');
    return;
  }

  const passwordHash = await bcrypt.hash('admin', 12);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, is_admin)
     VALUES ('Admin', $1, $2, TRUE) RETURNING id`,
    [email, passwordHash]
  );

  console.log('Admin user created:', result.rows[0].id);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
