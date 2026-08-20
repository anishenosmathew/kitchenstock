import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * requireAuth — verifies the JWT on the Authorization header,
 * attaches { id, email, isAdmin } to req.user.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email, isAdmin }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * requireKitchenAccess — checks the logged-in user belongs to :kitchenId
 * in the URL. This is the multi-tenant boundary check that keeps
 * Family A from ever touching Family B's data.
 *
 * The admin superuser bypasses this check entirely — admin/admin can
 * open any kitchen, any time, for support/debugging purposes.
 */
async function requireKitchenAccess(req, res, next) {
  const { kitchenId } = req.params;

  if (req.user.isAdmin) {
    req.kitchenRole = 'owner'; // admin acts with full owner permissions everywhere
    return next();
  }

  const result = await pool.query(
    `SELECT role FROM kitchen_members WHERE kitchen_id = $1 AND user_id = $2`,
    [kitchenId, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(403).json({ error: 'You do not have access to this kitchen.' });
  }

  req.kitchenRole = result.rows[0].role; // 'owner' or 'member'
  next();
}

/**
 * requireOwner — for actions only the kitchen owner (or admin) should do,
 * e.g. removing a member, deleting the kitchen. Must run after requireKitchenAccess.
 */
function requireOwner(req, res, next) {
  if (req.kitchenRole !== 'owner') {
    return res.status(403).json({ error: 'Only the kitchen owner can do this.' });
  }
  next();
}

export { requireAuth, requireKitchenAccess, requireOwner, JWT_SECRET };
