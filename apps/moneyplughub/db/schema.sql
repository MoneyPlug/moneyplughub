-- ==========================================================
-- PrimordiaOS / MoneyPlugHub — Purchase System Database Schema
-- ACID SQLite with WAL Mode Compatibility
-- ==========================================================

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'Novice Plug',
  subscriptionTier TEXT NOT NULL DEFAULT 'FREE',
  subscriptionActive INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  planId TEXT NOT NULL,
  price REAL NOT NULL,
  promoCode TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- INDICES FOR HIGH-VELOCITY QUERYING
CREATE INDEX IF NOT EXISTS idx_users_sub_tier ON users(subscriptionTier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(userId);
