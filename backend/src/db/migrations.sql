-- KitchenStock schema
-- Run with: psql $DATABASE_URL -f src/db/migrations.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users: every person with a login, including the admin superuser
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone         TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kitchens: one per household. This is the multi-tenant boundary —
-- every family's data lives under their own kitchen_id and never crosses over.
CREATE TABLE IF NOT EXISTS kitchens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  created_by  UUID REFERENCES users(id),
  invite_code TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Membership: who belongs to which kitchen, and their role in it
CREATE TABLE IF NOT EXISTS kitchen_members (
  kitchen_id  UUID NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (kitchen_id, user_id)
);

-- Inventory items: scoped by kitchen_id, so each household's list is isolated
CREATE TABLE IF NOT EXISTS inventory_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kitchen_id        UUID NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'Other',
  location          TEXT NOT NULL DEFAULT 'Pantry',
  quantity          NUMERIC NOT NULL DEFAULT 0,
  unit              TEXT NOT NULL DEFAULT 'count',
  low_stock_at      NUMERIC,
  low_stock_unit    TEXT,
  last_restocked_at TIMESTAMPTZ,
  expiry_date       DATE,
  avg_daily_use     NUMERIC,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock ledger: history of quantity changes for each item (the "receipt" log)
CREATE TABLE IF NOT EXISTS stock_ledger (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id      UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  delta        NUMERIC NOT NULL,          -- positive = restock, negative = used
  reason       TEXT,                      -- e.g. 'restock', 'used', 'manual edit'
  resulting_qty NUMERIC NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_kitchen ON inventory_items(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON kitchen_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_item ON stock_ledger(item_id);
