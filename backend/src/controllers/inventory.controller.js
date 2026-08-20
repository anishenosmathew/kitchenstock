import pool from '../db/pool.js';

/** GET /api/kitchens/:kitchenId/inventory */
async function listItems(req, res) {
  const { kitchenId } = req.params;
  const result = await pool.query(
    `SELECT * FROM inventory_items WHERE kitchen_id = $1 ORDER BY category, name`,
    [kitchenId]
  );
  const items = result.rows.map(withStatus);
  res.json({ items });
}

/** GET /api/kitchens/:kitchenId/inventory/:itemId */
async function getItem(req, res) {
  const { kitchenId, itemId } = req.params;
  const itemResult = await pool.query(
    `SELECT * FROM inventory_items WHERE id = $1 AND kitchen_id = $2`,
    [itemId, kitchenId]
  );
  if (itemResult.rows.length === 0) {
    return res.status(404).json({ error: 'Item not found.' });
  }
  const ledgerResult = await pool.query(
    `SELECT * FROM stock_ledger WHERE item_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [itemId]
  );
  res.json({ item: withStatus(itemResult.rows[0]), ledger: ledgerResult.rows });
}

/** POST /api/kitchens/:kitchenId/inventory */
async function createItem(req, res) {
  const { kitchenId } = req.params;
  const { name, category, location, quantity, unit, lowStockAt, lowStockUnit, expiryDate, avgDailyUse } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Item name is required.' });
  }

  const result = await pool.query(
    `INSERT INTO inventory_items
       (kitchen_id, name, category, location, quantity, unit, low_stock_at, low_stock_unit, expiry_date, avg_daily_use)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      kitchenId, name,
      category || 'Other',
      location || 'Pantry',
      quantity || 0,
      unit || 'count',
      lowStockAt ?? null,
      lowStockUnit || unit || 'count',
      expiryDate || null,
      avgDailyUse || null,
    ]
  );

  res.status(201).json({ item: withStatus(result.rows[0]) });
}

/**
 * PATCH /api/kitchens/:kitchenId/inventory/:itemId/quantity
 * Body: { delta, reason }  — e.g. { delta: -5, reason: 'used' }
 *
 * This is the endpoint the +/- stepper on the item detail page calls.
 * It updates the quantity AND writes a stock_ledger row in one transaction,
 * so the "receipt" history stays accurate.
 */
async function adjustQuantity(req, res) {
  const { kitchenId, itemId } = req.params;
  const { delta, reason } = req.body;

  if (typeof delta !== 'number') {
    return res.status(400).json({ error: 'delta must be a number.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const current = await client.query(
      `SELECT quantity FROM inventory_items WHERE id = $1 AND kitchen_id = $2 FOR UPDATE`,
      [itemId, kitchenId]
    );
    if (current.rows.length === 0) {
      throw { status: 404, message: 'Item not found.' };
    }

    const newQty = Math.max(0, Number(current.rows[0].quantity) + delta);

    const updated = await client.query(
      `UPDATE inventory_items
       SET quantity = $1, updated_at = now(),
           last_restocked_at = CASE WHEN $2 > 0 THEN now() ELSE last_restocked_at END
       WHERE id = $3 RETURNING *`,
      [newQty, delta, itemId]
    );

    await client.query(
      `INSERT INTO stock_ledger (item_id, delta, reason, resulting_qty)
       VALUES ($1, $2, $3, $4)`,
      [itemId, delta, reason || (delta > 0 ? 'restock' : 'used'), newQty]
    );

    await client.query('COMMIT');
    res.json({ item: withStatus(updated.rows[0]) });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(err.status || 500).json({ error: err.message || 'Could not update quantity.' });
  } finally {
    client.release();
  }
}

/** DELETE /api/kitchens/:kitchenId/inventory/:itemId */
async function deleteItem(req, res) {
  const { kitchenId, itemId } = req.params;
  const result = await pool.query(
    `DELETE FROM inventory_items WHERE id = $1 AND kitchen_id = $2 RETURNING id`,
    [itemId, kitchenId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found.' });
  res.json({ success: true });
}

/** PATCH /api/kitchens/:kitchenId/inventory/:itemId */
async function updateItem(req, res) {
  const { kitchenId, itemId } = req.params;
  const { name, category, location, unit, lowStockAt, lowStockUnit, expiryDate, avgDailyUse } = req.body;

  const result = await pool.query(
    `UPDATE inventory_items SET
      name = COALESCE($1, name),
      category = COALESCE($2, category),
      location = COALESCE($3, location),
      unit = COALESCE($4, unit),
      low_stock_at = $5,
      low_stock_unit = COALESCE($6, low_stock_unit),
      expiry_date = $7,
      avg_daily_use = $8,
      updated_at = now()
     WHERE id = $9 AND kitchen_id = $10 RETURNING *`,
    [name, category, location, unit, lowStockAt ?? null, lowStockUnit, expiryDate || null, avgDailyUse || null, itemId, kitchenId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found.' });
  res.json({ item: withStatus(result.rows[0]) });
}

/** PATCH /api/kitchens/:kitchenId/inventory/:itemId/threshold */
async function updateThreshold(req, res) {
  const { kitchenId, itemId } = req.params;
  const { lowStockAt, lowStockUnit } = req.body;

  const result = await pool.query(
    `UPDATE inventory_items SET low_stock_at = $1, low_stock_unit = $2, updated_at = now()
     WHERE id = $3 AND kitchen_id = $4 RETURNING *`,
    [lowStockAt, lowStockUnit, itemId, kitchenId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Item not found.' });
  }
  res.json({ item: withStatus(result.rows[0]) });
}

/**
 * GET /api/kitchens/:kitchenId/shopping-list
 * Returns items where quantity <= low_stock_at — this list is never
 * stored separately; it's always derived live from inventory.
 */
async function getShoppingList(req, res) {
  const { kitchenId } = req.params;
  const result = await pool.query(
    `SELECT * FROM inventory_items
     WHERE kitchen_id = $1 AND low_stock_at IS NOT NULL AND quantity <= low_stock_at
     ORDER BY category, name`,
    [kitchenId]
  );
  res.json({ items: result.rows.map(withStatus) });
}

/** Adds a computed `status` field: 'ok' | 'low' */
function withStatus(item) {
  const isLow = item.low_stock_at !== null && Number(item.quantity) <= Number(item.low_stock_at);
  return { ...item, status: isLow ? 'low' : 'ok' };
}

export {
  listItems,
  getItem,
  createItem,
  adjustQuantity,
  deleteItem,
  updateItem,
  updateThreshold,
  getShoppingList,
};
