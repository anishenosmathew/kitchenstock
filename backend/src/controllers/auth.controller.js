import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db/pool.js';
import { JWT_SECRET } from '../middleware/auth.js';

function generateInviteCode() {
  // e.g. "7FK2M9" — short, shareable, easy to type
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

function issueToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, isAdmin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * POST /api/auth/signup
 * Body: { name, email, password, inviteCode? }
 *
 * If inviteCode is provided, the new user joins that household as a member.
 * Otherwise, they get a brand-new kitchen of their own, as owner.
 */
async function signup(req, res) {
  const { name, email, password, inviteCode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, name, email, is_admin`,
      [name, email, passwordHash]
    );
    const user = userResult.rows[0];

    let kitchen;
    if (inviteCode) {
      const kitchenResult = await client.query(
        'SELECT id, name FROM kitchens WHERE invite_code = $1',
        [inviteCode.toUpperCase()]
      );
      if (kitchenResult.rows.length === 0) {
        throw { status: 400, message: 'Invalid invite code.' };
      }
      kitchen = kitchenResult.rows[0];
      await client.query(
        `INSERT INTO kitchen_members (kitchen_id, user_id, role) VALUES ($1, $2, 'member')`,
        [kitchen.id, user.id]
      );
    } else {
      const kitchenResult = await client.query(
        `INSERT INTO kitchens (name, created_by, invite_code)
         VALUES ($1, $2, $3) RETURNING id, name`,
        [`${name}'s Kitchen`, user.id, generateInviteCode()]
      );
      kitchen = kitchenResult.rows[0];
      await client.query(
        `INSERT INTO kitchen_members (kitchen_id, user_id, role) VALUES ($1, $2, 'owner')`,
        [kitchen.id, user.id]
      );
    }

    await client.query('COMMIT');

    const token = issueToken(user);
    res.status(201).json({ token, user, kitchen });
  } catch (err) {
    await client.query('ROLLBACK');
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Signup failed.' });
  } finally {
    client.release();
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * Special case: admin/admin always works, even if the DB seed hasn't run,
 * as a last-resort superuser login for the hosted app.
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (email === 'admin' && password === 'admin') {
    const adminToken = jwt.sign(
      { id: 'admin-superuser', email: 'admin', isAdmin: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      token: adminToken,
      user: { id: 'admin-superuser', name: 'Admin', email: 'admin', is_admin: true },
      kitchen: null,
    });
  }

  const result = await pool.query(
    'SELECT id, name, email, password_hash, is_admin FROM users WHERE email = $1',
    [email]
  );
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const kitchenResult = await pool.query(
    `SELECT k.id, k.name, km.role FROM kitchens k
     JOIN kitchen_members km ON km.kitchen_id = k.id
     WHERE km.user_id = $1 LIMIT 1`,
    [user.id]
  );

  delete user.password_hash;
  const token = issueToken(user);
  res.json({ token, user, kitchen: kitchenResult.rows[0] || null });
}

export { signup, login };

export async function updateProfile(req, res) {
  const { name, phone } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
  const result = await pool.query(
    'UPDATE users SET name = $1, phone = $2 WHERE id = $3 RETURNING id, name, email, phone',
    [name.trim(), phone || null, req.user.id]
  );
  res.json({ user: result.rows[0] });
}

export async function joinKitchen(req, res) {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'Invite code is required.' });

  const kitchenResult = await pool.query(
    'SELECT id, name FROM kitchens WHERE invite_code = $1',
    [inviteCode.toUpperCase()]
  );
  if (kitchenResult.rows.length === 0)
    return res.status(400).json({ error: 'Invalid invite code.' });

  const kitchen = kitchenResult.rows[0];

  const existing = await pool.query(
    'SELECT 1 FROM kitchen_members WHERE kitchen_id = $1 AND user_id = $2',
    [kitchen.id, req.user.id]
  );
  if (existing.rows.length > 0)
    return res.status(400).json({ error: 'You are already a member of this kitchen.' });

  await pool.query(
    `INSERT INTO kitchen_members (kitchen_id, user_id, role) VALUES ($1, $2, 'member')`,
    [kitchen.id, req.user.id]
  );

  res.json({ kitchen });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });

  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
  res.json({ success: true });
}
