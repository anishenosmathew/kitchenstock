import crypto from 'crypto';
import pool from '../db/pool.js';

function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

/** GET /api/kitchens/:kitchenId/household */
async function getHousehold(req, res) {
  const { kitchenId } = req.params;

  const kitchenResult = await pool.query(
    'SELECT id, name, invite_code FROM kitchens WHERE id = $1',
    [kitchenId]
  );
  if (kitchenResult.rows.length === 0) {
    return res.status(404).json({ error: 'Kitchen not found.' });
  }

  const membersResult = await pool.query(
    `SELECT u.id, u.name, u.email, km.role, km.joined_at
     FROM kitchen_members km
     JOIN users u ON u.id = km.user_id
     WHERE km.kitchen_id = $1
     ORDER BY km.role = 'owner' DESC, km.joined_at`,
    [kitchenId]
  );

  res.json({ kitchen: kitchenResult.rows[0], members: membersResult.rows });
}

/** POST /api/kitchens/:kitchenId/household/rotate-code — owner only */
async function rotateInviteCode(req, res) {
  const { kitchenId } = req.params;
  const newCode = generateInviteCode();
  await pool.query('UPDATE kitchens SET invite_code = $1 WHERE id = $2', [newCode, kitchenId]);
  res.json({ inviteCode: newCode });
}

/** DELETE /api/kitchens/:kitchenId/household/members/:userId — owner only */
async function removeMember(req, res) {
  const { kitchenId, userId } = req.params;

  const target = await pool.query(
    `SELECT role FROM kitchen_members WHERE kitchen_id = $1 AND user_id = $2`,
    [kitchenId, userId]
  );
  if (target.rows[0]?.role === 'owner') {
    return res.status(400).json({ error: 'Cannot remove the kitchen owner.' });
  }

  await pool.query(
    'DELETE FROM kitchen_members WHERE kitchen_id = $1 AND user_id = $2',
    [kitchenId, userId]
  );
  res.json({ success: true });
}

/** POST /api/kitchens/:kitchenId/household/leave */
async function leaveKitchen(req, res) {
  const { kitchenId } = req.params;
  const userId = req.user.id;

  const membership = await pool.query(
    `SELECT role FROM kitchen_members WHERE kitchen_id = $1 AND user_id = $2`,
    [kitchenId, userId]
  );
  if (membership.rows[0]?.role === 'owner') {
    return res.status(400).json({ error: 'Owners cannot leave — transfer ownership or delete the kitchen instead.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM kitchen_members WHERE kitchen_id = $1 AND user_id = $2',
      [kitchenId, userId]
    );

    const userResult = await client.query('SELECT name FROM users WHERE id = $1', [userId]);
    const userName = userResult.rows[0].name;

    const newKitchen = await client.query(
      `INSERT INTO kitchens (name, created_by, invite_code) VALUES ($1, $2, $3) RETURNING id, name`,
      [`${userName}'s Kitchen`, userId, generateInviteCode()]
    );
    await client.query(
      `INSERT INTO kitchen_members (kitchen_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [newKitchen.rows[0].id, userId]
    );

    await client.query('COMMIT');
    res.json({ success: true, kitchen: newKitchen.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message || 'Failed to leave kitchen.' });
  } finally {
    client.release();
  }
}

export { getHousehold, rotateInviteCode, removeMember, leaveKitchen };
