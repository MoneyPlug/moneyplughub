import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from './config';

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(config.dbPath);

// Configure SQLite for high performance, ACID durability, and concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

export function runInTransaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Initializes extended database schema & column migrations
 */
export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      referral_code TEXT UNIQUE NOT NULL COLLATE NOCASE,
      referrer_user_id TEXT,
      referral_count INTEGER NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      streak_days INTEGER NOT NULL DEFAULT 1,
      tier_title TEXT NOT NULL DEFAULT 'Novice Plug',
      created_at NOT NULL,
      updated_at NOT NULL,
      FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

    -- COMMISSION LEDGER
    CREATE TABLE IF NOT EXISTS commission_ledger (
      id TEXT PRIMARY KEY,
      referrer_user_id TEXT NOT NULL,
      referred_user_id TEXT NOT NULL UNIQUE,
      amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'paid')),
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- ACCOUNTS
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('bank', 'crypto', 'investment', 'cash', 'credit_card', 'loan')),
      balance_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      institution TEXT NOT NULL DEFAULT 'Self-Managed',
      is_liability INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

    -- FINANCIAL GOALS
    CREATE TABLE IF NOT EXISTS financial_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('emergency_fund', 'crypto', 'savings', 'purchase', 'investment')),
      target_cents INTEGER NOT NULL,
      current_cents INTEGER NOT NULL DEFAULT 0,
      target_date TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Target',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- DEBTS
    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      total_balance_cents INTEGER NOT NULL,
      minimum_payment_cents INTEGER NOT NULL,
      interest_rate REAL NOT NULL DEFAULT 0.0,
      due_date TEXT NOT NULL,
      strategy TEXT NOT NULL DEFAULT 'avalanche' CHECK(strategy IN ('snowball', 'avalanche')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- BUDGET CATEGORIES
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      monthly_limit_cents INTEGER NOT NULL,
      month TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- TRANSACTIONS
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer', 'debt_payment', 'crypto_buy', 'reward')),
      amount_cents INTEGER NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);

    -- RECURRING BILLS
    CREATE TABLE IF NOT EXISTS recurring_bills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'monthly' CHECK(frequency IN ('monthly', 'annual', 'weekly')),
      next_due_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- QUEST TASKS
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('budget', 'crypto', 'referral', 'learning', 'debt', 'savings')),
      reward_cents INTEGER NOT NULL DEFAULT 0,
      reward_xp INTEGER NOT NULL DEFAULT 50,
      task_type TEXT NOT NULL DEFAULT 'daily' CHECK(task_type IN ('daily', 'one_time', 'milestone')),
      is_active INTEGER NOT NULL DEFAULT 1
    );

    -- USER TASK STATUS
    CREATE TABLE IF NOT EXISTS user_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'completed', 'claimed')),
      completed_at TEXT,
      claimed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      UNIQUE(user_id, task_id)
    );

    -- CRYPTO WALLETS
    CREATE TABLE IF NOT EXISTS crypto_wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      currency TEXT NOT NULL CHECK(currency IN ('USDC', 'SOL', 'BTC', 'ETH', 'MPH')),
      balance REAL NOT NULL DEFAULT 0.0,
      address TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, currency)
    );

    -- CRYPTO LEDGER
    CREATE TABLE IF NOT EXISTS crypto_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tx_hash TEXT NOT NULL UNIQUE,
      tx_type TEXT NOT NULL CHECK(tx_type IN ('reward', 'deposit', 'transfer', 'referral_payout', 'budget_bonus')),
      currency TEXT NOT NULL,
      amount REAL NOT NULL,
      usd_value_cents INTEGER NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'pending')),
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- REFERRAL PROGRAMS (Referral Hub v1.0 Model)
    CREATE TABLE IF NOT EXISTS crypto_referral_programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL COLLATE NOCASE,
      destination_url TEXT NOT NULL,
      bonus_desc TEXT NOT NULL,
      payout_type TEXT NOT NULL DEFAULT 'Cash Bonus',
      payout_amount TEXT NOT NULL DEFAULT '$30.00',
      earnings_today_cents INTEGER NOT NULL DEFAULT 0,
      earnings_month_cents INTEGER NOT NULL DEFAULT 0,
      total_earnings_cents INTEGER NOT NULL DEFAULT 0,
      total_clicks INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'pending', 'disabled', 'paused')),
      tags TEXT NOT NULL DEFAULT 'finance,referral',
      category TEXT NOT NULL DEFAULT 'finance',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_crypto_prog_slug ON crypto_referral_programs(slug);

    -- 1. USER PROFILE DB (Adaptive & Behavior-Aware)
    CREATE TABLE IF NOT EXISTS user_profile_os (
      user_id TEXT PRIMARY KEY,
      behavior_type TEXT NOT NULL DEFAULT 'Sprinter' CHECK(behavior_type IN ('Sprinter', 'Slow Builder', 'Minimal Friction')),
      energy_pattern TEXT NOT NULL DEFAULT 'Morning Peak / Evening Creative Flow',
      friction_points TEXT NOT NULL DEFAULT 'Manual data entry, over-complex spreadsheets',
      strengths TEXT NOT NULL DEFAULT 'Short-form content, viral hooks, speed execution',
      current_focus TEXT NOT NULL DEFAULT 'Scale Rakuten + Plug-In OS referral funnels to $500/week',
      stress_level INTEGER NOT NULL DEFAULT 2 CHECK(stress_level BETWEEN 1 AND 5),
      notes TEXT DEFAULT 'Prefers automated micro-tasks under 5 minutes.',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 2. XP ACTIONS DB
    CREATE TABLE IF NOT EXISTS xp_actions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Money', 'Content', 'Routine', 'System')),
      difficulty TEXT NOT NULL DEFAULT 'XS' CHECK(difficulty IN ('XS', 'S', 'M', 'L', 'XL')),
      time_required TEXT NOT NULL DEFAULT '2 min',
      status TEXT NOT NULL DEFAULT 'To Do' CHECK(status IN ('To Do', 'Doing', 'Done')),
      xp_value INTEGER NOT NULL DEFAULT 50,
      is_automated INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_xp_actions_user ON xp_actions(user_id);

    -- 4. PROGRAM TRACKER DB
    CREATE TABLE IF NOT EXISTS program_tracker (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      program TEXT NOT NULL,
      clicks INTEGER NOT NULL DEFAULT 0,
      signups INTEGER NOT NULL DEFAULT 0,
      conversions INTEGER NOT NULL DEFAULT 0,
      earnings_cents INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      source_platform TEXT NOT NULL DEFAULT 'TikTok',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_prog_track_user ON program_tracker(user_id);

    -- 5. CONTENT QUEUE DB
    CREATE TABLE IF NOT EXISTS content_queue (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      video_idea TEXT NOT NULL,
      script TEXT NOT NULL,
      hook TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Idea' CHECK(status IN ('Idea', 'Scripted', 'Ready to Post', 'Editing', 'Posted')),
      platform TEXT NOT NULL DEFAULT 'TikTok',
      link TEXT DEFAULT '',
      views INTEGER NOT NULL DEFAULT 0,
      ctr REAL NOT NULL DEFAULT 0.0,
      saves INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_content_q_user ON content_queue(user_id);

    -- 6. AUTOMATIONS DB (Make.com + Zapier Workflow Map)
    CREATE TABLE IF NOT EXISTS automations_map (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      trigger_desc TEXT NOT NULL,
      action_desc TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Error', 'Off')),
      notes TEXT DEFAULT '',
      last_run TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_auto_map_user ON automations_map(user_id);

    -- 7. SELF-UNDERSTANDING DB (Adaptive Behavior Engine)
    CREATE TABLE IF NOT EXISTS self_understanding_patterns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pattern TEXT NOT NULL,
      insight TEXT NOT NULL,
      trigger_event TEXT NOT NULL,
      suggested_adjustment TEXT NOT NULL,
      confirmed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_self_und_user ON self_understanding_patterns(user_id);

    -- SCRATCHPAD NOTES
    CREATE TABLE IF NOT EXISTS scratchpad_notes (
      user_id TEXT PRIMARY KEY,
      content TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- PROGRAM CLICKS
    CREATE TABLE IF NOT EXISTS program_clicks (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'unknown' CHECK(source IN ('app', 'web', 'unknown')),
      campaign TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (program_id) REFERENCES crypto_referral_programs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_clicks_prog ON program_clicks(program_id);

    -- FUNNEL TEMPLATES
    CREATE TABLE IF NOT EXISTS funnel_templates (
      id TEXT PRIMARY KEY,
      program TEXT NOT NULL UNIQUE,
      steps_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- AFFILIATE SETTINGS & PAYOUT LOGS
    CREATE TABLE IF NOT EXISTS affiliate_settings (
      user_id TEXT PRIMARY KEY,
      stan_affiliate_link TEXT NOT NULL DEFAULT '',
      weekly_tiktok_target INTEGER NOT NULL DEFAULT 5,
      weekly_tiktok_completed INTEGER NOT NULL DEFAULT 0,
      weekly_ig_target INTEGER NOT NULL DEFAULT 3,
      weekly_ig_completed INTEGER NOT NULL DEFAULT 0,
      weekly_yt_target INTEGER NOT NULL DEFAULT 2,
      weekly_yt_completed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS affiliate_payout_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_label TEXT NOT NULL,
      clicks INTEGER NOT NULL DEFAULT 0,
      activations INTEGER NOT NULL DEFAULT 0,
      earnings_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Processing', 'Paid')),
      payout_date TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- CONNECTED PROVIDERS
    CREATE TABLE IF NOT EXISTS connected_providers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      provider_type TEXT NOT NULL CHECK(provider_type IN ('bank', 'crypto', 'brokerage', 'card')),
      status TEXT NOT NULL DEFAULT 'connected' CHECK(status IN ('connected', 'disconnected', 'error')),
      last_sync_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, provider_name)
    );

    -- BALANCE SNAPSHOTS & EVENTS
    CREATE TABLE IF NOT EXISTS balance_snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      balance_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      as_of TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      UNIQUE(user_id, account_id)
    );

    CREATE TABLE IF NOT EXISTS balance_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('balance.pull_started', 'balance.pull_completed', 'balance.pull_failed')),
      payload TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- EARNINGS SNAPSHOTS & EVENTS
    CREATE TABLE IF NOT EXISTS earnings_snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      window TEXT NOT NULL CHECK(window IN ('daily', 'weekly', 'monthly')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      gross_cents INTEGER NOT NULL,
      net_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      computed_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, window)
    );

    CREATE TABLE IF NOT EXISTS earnings_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('earnings.compute_started', 'earnings.compute_completed', 'earnings.compute_failed')),
      payload TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- REFERRAL SUGGESTIONS & CONTENT SCRIPTS
    CREATE TABLE IF NOT EXISTS referral_suggestions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      program TEXT NOT NULL,
      suggested_action TEXT NOT NULL,
      reason TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS content_engine_scripts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      suggestion_id TEXT,
      program TEXT NOT NULL,
      hook TEXT NOT NULL,
      script TEXT NOT NULL,
      cta TEXT NOT NULL,
      cta_link TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'TikTok, IG Reels, YT Shorts',
      status TEXT NOT NULL DEFAULT 'Idea' CHECK(status IN ('Idea', 'Script Ready', 'Posted')),
      created_at TEXT NOT NULL,
      posted_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS referral_agent_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- AUTOMATION TOGGLES & RUNS
    CREATE TABLE IF NOT EXISTS automation_toggles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      automation_id TEXT NOT NULL,
      name TEXT NOT NULL,
      schedule TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, automation_id)
    );

    CREATE TABLE IF NOT EXISTS automation_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      automation_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('success', 'failure')),
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      error TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- DAILY INSIGHTS & EVENTS
    CREATE TABLE IF NOT EXISTS daily_insights (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      summary TEXT NOT NULL,
      suggestions_json TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    );

    -- ORCHESTRATOR STATE & EVENTS
    CREATE TABLE IF NOT EXISTS orchestrator_state (
      user_id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'operational' CHECK(status IN ('operational', 'degraded', 'cooldown', 'busy')),
      consecutive_failures INTEGER NOT NULL DEFAULT 0,
      last_run_at TEXT,
      degraded_reason TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orchestrator_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- AUDIT LOGS
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      target_entity TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );

    -- WEALTH TIERS (6 Sovereign Vault Tiers)
    CREATE TABLE IF NOT EXISTS wealth_tiers (
      tier_number INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      min_net_worth_cents INTEGER NOT NULL DEFAULT 0,
      min_level INTEGER NOT NULL DEFAULT 1,
      multiplier REAL NOT NULL DEFAULT 1.0,
      daily_limit_cents INTEGER NOT NULL DEFAULT 200,
      prestige_bonus_cents INTEGER NOT NULL DEFAULT 50,
      frequency_hz INTEGER NOT NULL DEFAULT 432,
      atmosphere TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- AI MODULES (12 Subsystems)
    CREATE TABLE IF NOT EXISTS ai_modules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      tier TEXT NOT NULL,
      description TEXT NOT NULL
    );

    -- AI MODELS (6 Model Families)
    CREATE TABLE IF NOT EXISTS ai_models (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      context_window TEXT NOT NULL,
      avg_latency_ms INTEGER NOT NULL,
      cost_per_1k_tokens_cents REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Online',
      strength TEXT NOT NULL
    );

    -- AI ORCHESTRATOR TASKS
    CREATE TABLE IF NOT EXISTS ai_orchestrator_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      task_category TEXT NOT NULL,
      assigned_model_id TEXT NOT NULL,
      response_preview TEXT NOT NULL,
      latency_ms INTEGER NOT NULL,
      tokens_used INTEGER NOT NULL,
      feedback_rating INTEGER,
      created_at TEXT NOT NULL
    );

    -- PULSE ENGINE TELEMETRY
    CREATE TABLE IF NOT EXISTS pulse_engine_telemetry (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      active_models INTEGER NOT NULL,
      avg_latency_ms INTEGER NOT NULL,
      uptime_pct REAL NOT NULL,
      success_rate_pct REAL NOT NULL,
      throughput_rpm INTEGER NOT NULL
    );

    -- MONEYOS CONVERSATIONS
    CREATE TABLE IF NOT EXISTS moneyos_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_moneyos_user ON moneyos_conversations(user_id, created_at);

    -- DAILY LOOT CLAIMS (Daily Mystery Loot Crate & Gacha Engine)
    CREATE TABLE IF NOT EXISTS daily_loot_claims (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      reward_value TEXT NOT NULL,
      reward_description TEXT NOT NULL,
      streak_days INTEGER NOT NULL DEFAULT 1,
      claimed_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_daily_loot_user ON daily_loot_claims(user_id);
    CREATE INDEX IF NOT EXISTS idx_daily_loot_claimed_at ON daily_loot_claims(claimed_at);
  `);

  const progCols = [
    "payout_type TEXT NOT NULL DEFAULT 'Cash Bonus'",
    "payout_amount TEXT NOT NULL DEFAULT '$30.00'",
    "notes TEXT DEFAULT ''",
    "updated_at TEXT",
  ];

  for (const col of progCols) {
    try {
      db.exec(`ALTER TABLE crypto_referral_programs ADD COLUMN ${col};`);
    } catch (e) {}
  }

  // Ensure subscription columns exist on users
  const userCols = [
    "subscriptionTier TEXT NOT NULL DEFAULT 'FREE'",
    "subscriptionActive INTEGER NOT NULL DEFAULT 0",
  ];
  for (const col of userCols) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col};`);
    } catch (e) {}
  }

  // Ensure subscriptions table and columns exist
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        userId TEXT,
        plan_id TEXT,
        planId TEXT,
        price REAL NOT NULL DEFAULT 0,
        promoCode TEXT,
        createdAt TEXT,
        created_at TEXT
      );
    `);
  } catch (e) {}

  const subCols = [
    "userId TEXT",
    "planId TEXT",
    "price REAL NOT NULL DEFAULT 0",
    "promoCode TEXT",
    "createdAt TEXT",
  ];
  for (const col of subCols) {
    try {
      db.exec(`ALTER TABLE subscriptions ADD COLUMN ${col};`);
    } catch (e) {}
  }

  try {
    db.exec(`
      DELETE FROM crypto_referral_programs 
      WHERE rowid NOT IN (
        SELECT MIN(rowid) FROM crypto_referral_programs GROUP BY name
      );
    `);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_prog_name_unique ON crypto_referral_programs(name);`);
  } catch (e) {}

  seedDefaultTasks();
  seedAllReferralPrograms();
  seedFunnelTemplates();
  seedAiOrchestrator();
  seedWealthTiers();
}

export function seedWealthTiers(): void {
  const tiers = [
    { tier: 1, name: 'Tier 1: Neo-Emerald Seed', title: 'Neo-Emerald Seed', minNetWorth: 0, minLevel: 1, mult: 1.0, limit: 200, bonus: 50, hz: 432, atmos: 'emerald_matrix' },
    { tier: 2, name: 'Tier 2: Cyan Cashflow River', title: 'Cyan Cashflow River', minNetWorth: 100000, minLevel: 2, mult: 1.1, limit: 500, bonus: 100, hz: 528, atmos: 'cyan_currents' },
    { tier: 3, name: 'Tier 3: Amethyst Quantum Ledger', title: 'Amethyst Quantum Ledger', minNetWorth: 500000, minLevel: 3, mult: 1.25, limit: 1000, bonus: 250, hz: 639, atmos: 'amethyst_quantum' },
    { tier: 4, name: 'Tier 4: 24K Imperial Bullion', title: '24K Imperial Bullion', minNetWorth: 2500000, minLevel: 5, mult: 1.5, limit: 2000, bonus: 500, hz: 741, atmos: 'imperial_gold' },
    { tier: 5, name: 'Tier 5: Sovereign Diamond Treasury', title: 'Sovereign Diamond Treasury', minNetWorth: 10000000, minLevel: 8, mult: 2.0, limit: 3500, bonus: 1000, hz: 852, atmos: 'diamond_prism' },
    { tier: 6, name: 'Tier 6: Celestial Osmium Singularity', title: 'Celestial Osmium Singularity', minNetWorth: 100000000, minLevel: 10, mult: 3.0, limit: 5000, bonus: 2000, hz: 963, atmos: 'osmium_singularity' },
  ];

  const insertTier = db.prepare(`
    INSERT OR REPLACE INTO wealth_tiers (tier_number, name, title, min_net_worth_cents, min_level, multiplier, daily_limit_cents, prestige_bonus_cents, frequency_hz, atmosphere, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const t of tiers) {
    insertTier.run(t.tier, t.name, t.title, t.minNetWorth, t.minLevel, t.mult, t.limit, t.bonus, t.hz, t.atmos, now);
  }
}

export function seedAiOrchestrator(): void {
  const modules = [
    { id: 'mod_vision', name: 'VisionCore Engine', category: 'Visual / Video', tier: 'Pro', description: 'Generates composition blueprints, camera logic, and prompt sequencing for Runway/Midjourney.' },
    { id: 'mod_signal', name: 'SignalCore Directive', category: 'Reasoning', tier: 'Starter', description: 'Synthesizes high-level user directives into actionable task graphs and execution trees.' },
    { id: 'mod_pulse', name: 'PulseWave Telemetry', category: 'Monitoring', tier: 'Pro', description: 'Monitors viral velocity, latency, error rates, and real-time execution health.' },
    { id: 'mod_osmium', name: 'Osmium Ledger', category: 'Storage / State', tier: 'Starter', description: 'Durable ACID state preservation and immutable historical memory indexing.' },
    { id: 'mod_moneyplug', name: 'MoneyPlugHub Finance', category: 'Monetization', tier: 'Starter', description: 'Calculates referral attribution, commission ledgers, and automated payout checks.' },
    { id: 'mod_primordia', name: 'PrimordiaFlow Bus', category: 'Orchestration', tier: 'Starter', description: 'Binds all modular layers into unified artifacts with real-time feedback loops.' },
    { id: 'mod_vertex', name: 'Vertex Pattern Mapper', category: 'Intelligence', tier: 'Pro', description: 'Trend extraction, viral pattern recognition, and competitive intelligence.' },
    { id: 'mod_runway', name: 'Runway Cinematic Dispatcher', category: 'Creative', tier: 'Pro', description: 'Dispatches video generation payloads and first-frame animation loops.' },
    { id: 'mod_niagara', name: 'Niagara Cosmic VFX', category: 'Rendering', tier: 'Enterprise', description: 'Real-time 3D particle simulations and UI panel rendering parameters.' },
    { id: 'mod_insight', name: 'InsightCore Synthesizer', category: 'Analytics', tier: 'Starter', description: 'Transforms raw telemetry and transaction data into daily strategic insights.' },
    { id: 'mod_swarm', name: 'Swarm Distribution Hub', category: 'Distribution', tier: 'Enterprise', description: 'Multi-platform social publishing and affiliate lead funnel syndication.' },
    { id: 'mod_safeguard', name: 'Security & Access Guard', category: 'Security', tier: 'Enterprise', description: 'Enforces 11-section Plug In OS security policy, credential rotation, and TLS encryption.' },
  ];

  const models = [
    { id: 'model_gpt4o', provider: 'OpenAI', name: 'GPT-4o Omnimodal', contextWindow: '128k', avgLatencyMs: 420, costPer1kTokensCents: 0.5, status: 'Online', strength: 'Complex Logic & Coding' },
    { id: 'model_claude35', provider: 'Anthropic', name: 'Claude 3.5 Sonnet', contextWindow: '200k', avgLatencyMs: 460, costPer1kTokensCents: 0.6, status: 'Online', strength: 'Nuanced Reasoning & Nuance' },
    { id: 'model_gemini15', provider: 'Google', name: 'Gemini 1.5 Pro', contextWindow: '1M', avgLatencyMs: 380, costPer1kTokensCents: 0.35, status: 'Online', strength: 'Massive Context & Multimodal' },
    { id: 'model_perplexity', provider: 'Perplexity', name: 'Sonar Deep Research', contextWindow: '64k', avgLatencyMs: 510, costPer1kTokensCents: 0.7, status: 'Online', strength: 'Live Web Search & Citations' },
    { id: 'model_llama3', provider: 'Meta', name: 'Llama 3.3 70B (Groq)', contextWindow: '128k', avgLatencyMs: 140, costPer1kTokensCents: 0.15, status: 'Online', strength: 'Ultra Low Latency' },
    { id: 'model_mistral', provider: 'Mistral AI', name: 'Mistral Large 2', contextWindow: '128k', avgLatencyMs: 390, costPer1kTokensCents: 0.4, status: 'Online', strength: 'Concise Function Calling' },
  ];

  const insertMod = db.prepare('INSERT OR REPLACE INTO ai_modules (id, name, category, tier, description) VALUES (?, ?, ?, ?, ?)');
  modules.forEach(m => insertMod.run(m.id, m.name, m.category, m.tier, m.description));

  const insertModel = db.prepare('INSERT OR REPLACE INTO ai_models (id, provider, name, context_window, avg_latency_ms, cost_per_1k_tokens_cents, status, strength) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  models.forEach(m => insertModel.run(m.id, m.provider, m.name, m.contextWindow, m.avgLatencyMs, m.costPer1kTokensCents, m.status, m.strength));
}

export function seedAllReferralPrograms(): void {
  const allPrograms = [
    { name: 'Cash App', slug: 'cashapp', destination_url: 'https://cash.app/refer/4z6f32h', bonus_desc: '$5 – $15 Instant Send & Sign-up Bonus', payout_type: 'Instant P2P Balance', payout_amount: '$15.00', earnings_today_cents: 3500, earnings_month_cents: 24500, total_earnings_cents: 112500, category: 'finance', tags: 'banking,p2p,bonus,instant', notes: 'Active custom Cash App referral invite link (Code: 4z6f32h).' },
    { name: 'Upside', slug: 'upside', destination_url: 'https://www.upside.com/', bonus_desc: '$7.00 + 25¢/gal Gas Cash Back Bonus', payout_type: 'Bank / PayPal / Gift Card', payout_amount: '$7.00 + 25¢/gal', earnings_today_cents: 1400, earnings_month_cents: 9800, total_earnings_cents: 48700, category: 'cashback', tags: 'gas,cashback,commute,fuel', notes: 'Official Upside app portal.' },
    { name: 'Fetch', slug: 'fetch', destination_url: 'https://fetch.com/', bonus_desc: '1,000 Free Points on Any Grocery Receipt', payout_type: 'Gift Cards (Amazon/Visa)', payout_amount: '$5.00 Points Value', earnings_today_cents: 2000, earnings_month_cents: 15000, total_earnings_cents: 64000, category: 'cashback', tags: 'receipts,groceries,shopping,giftcards', notes: 'Official Fetch Rewards receipt portal.' },
    { name: 'Webull', slug: 'webull', destination_url: 'https://act.webull.com/invite/share.html?inviteCode=er_N8lhzuPz', bonus_desc: 'Up to 12 Free Fractional Shares on $1+ Deposit', payout_type: 'Brokerage Stock Assets', payout_amount: 'Up to $3,000.00', earnings_today_cents: 6000, earnings_month_cents: 42000, total_earnings_cents: 198000, category: 'finance', tags: 'stocks,investing,free-shares,brokerage', notes: 'Active custom Webull referral invite link (Webuller_N8lhzuPz).' },
    { name: 'Robinhood', slug: 'robinhood', destination_url: 'https://robinhood.com/', bonus_desc: 'Guaranteed Free Stock worth up to $200', payout_type: 'Free Stock Asset', payout_amount: 'Up to $200.00', earnings_today_cents: 4500, earnings_month_cents: 31500, total_earnings_cents: 154000, category: 'finance', tags: 'stocks,crypto,bonus,free-stock', notes: 'Official Robinhood investing portal.' },
    { name: 'Bitstamp', slug: 'bitstamp', destination_url: 'https://www.bitstamp.net/', bonus_desc: '$20 Trade Match Bonus', payout_type: 'Cash / Fiat Deposit', payout_amount: '$20.00', earnings_today_cents: 2000, earnings_month_cents: 12000, total_earnings_cents: 54000, category: 'crypto', tags: 'crypto,cash,fiat', notes: 'Official Bitstamp cryptocurrency exchange.' },
    { name: 'Coinbase', slug: 'coinbase', destination_url: 'https://coinbase.com/join/WN2WE2K?src=referral-link', bonus_desc: '$10 in Free Bitcoin on $100 Trade', payout_type: 'BTC Wallet Credit', payout_amount: '$10.00 in BTC', earnings_today_cents: 3000, earnings_month_cents: 18000, total_earnings_cents: 89000, category: 'crypto', tags: 'crypto,bitcoin,exchange', notes: 'Active custom Coinbase referral link.' },
    { name: 'Rakuten', slug: 'rakuten', destination_url: 'https://www.rakuten.com/r/CASHPL19', bonus_desc: '$30 Cash Back per Qualified Invite', payout_type: 'Direct Deposit / PayPal', payout_amount: '$30.00', earnings_today_cents: 3000, earnings_month_cents: 21000, total_earnings_cents: 124000, category: 'cashback', tags: 'cashback,shopping,instant', notes: 'Active custom Rakuten referral invite link.' },
    { name: 'Swagbucks', slug: 'swagbucks', destination_url: 'https://www.swagbucks.com/', bonus_desc: '300 SB ($3.00) Welcome Bonus + 10% Lifetime', payout_type: 'PayPal / Gift Cards', payout_amount: '$3.00 + 10%', earnings_today_cents: 1500, earnings_month_cents: 8500, total_earnings_cents: 42000, category: 'rewards', tags: 'rewards,points,passive', notes: 'Official Swagbucks rewards portal.' },
    { name: 'InboxDollars', slug: 'inboxdollars', destination_url: 'https://www.inboxdollars.com/?rb=YWqLoxt7Sd6Vvs1G&rp=1', bonus_desc: '$5.00 Instant Activation Bonus', payout_type: 'PayPal / Visa Debit', payout_amount: '$5.00', earnings_today_cents: 1000, earnings_month_cents: 6000, total_earnings_cents: 31000, category: 'rewards', tags: 'email,surveys,bonus', notes: 'Active custom InboxDollars referral link.' },
    { name: 'Gemini', slug: 'gemini', destination_url: 'https://www.gemini.com/', bonus_desc: '$15 in Free ETH on $100 Trade', payout_type: 'ETH Wallet Credit', payout_amount: '$15.00 in ETH', earnings_today_cents: 2500, earnings_month_cents: 14000, total_earnings_cents: 65000, category: 'crypto', tags: 'crypto,staking,exchange', notes: 'Official Gemini exchange.' },
    { name: 'Ledger', slug: 'ledger', destination_url: 'https://www.ledger.com/', bonus_desc: '$10 in Free Bitcoin per Hardware Purchase', payout_type: 'BTC Hardware Voucher', payout_amount: '$10.00 in BTC', earnings_today_cents: 4000, earnings_month_cents: 22000, total_earnings_cents: 95000, category: 'security', tags: 'hardware,security,vault', notes: 'Official Ledger hardware wallet store.' },
    { name: 'Binance', slug: 'binance', destination_url: 'https://www.binance.com/', bonus_desc: '100 USDT Trading Fee Rebate Voucher', payout_type: 'USDT Rebate Credit', payout_amount: '100 USDT', earnings_today_cents: 5000, earnings_month_cents: 28000, total_earnings_cents: 145000, category: 'crypto', tags: 'trading,global,rebate', notes: 'Official Binance global portal.' },
    { name: 'Kraken', slug: 'kraken', destination_url: 'https://www.kraken.com/', bonus_desc: '$10 in Free BTC per Qualified Trade', payout_type: 'BTC Balance Credit', payout_amount: '$10.00 in BTC', earnings_today_cents: 2000, earnings_month_cents: 11000, total_earnings_cents: 58000, category: 'crypto', tags: 'crypto,pro-trading,bonus', notes: 'Official Kraken exchange portal.' },
    { name: 'KuCoin', slug: 'kucoin', destination_url: 'https://www.kucoin.com/', bonus_desc: 'Up to 500 USDT Mystery Box Welcome Bonus', payout_type: 'USDT / Mystery Assets', payout_amount: 'Up to 500 USDT', earnings_today_cents: 3500, earnings_month_cents: 19500, total_earnings_cents: 82000, category: 'crypto', tags: 'mystery-box,altcoins,payout', notes: 'Official KuCoin portal.' },
    { name: 'Trezor', slug: 'trezor', destination_url: 'https://trezor.io/', bonus_desc: '12% Hardware Wallet Affiliate Commission', payout_type: 'BTC / EUR Commission', payout_amount: '12% Commission', earnings_today_cents: 3000, earnings_month_cents: 17000, total_earnings_cents: 74000, category: 'security', tags: 'cold-storage,hardware,discount', notes: 'Official Trezor cold-storage store.' },
    { name: 'OKX', slug: 'okx', destination_url: 'https://www.okx.com/', bonus_desc: 'Mystery Box containing up to $50 in Crypto', payout_type: 'Mystery Box Crypto', payout_amount: 'Up to $50.00', earnings_today_cents: 2500, earnings_month_cents: 13500, total_earnings_cents: 61000, category: 'crypto', tags: 'web3,mystery-box,dex', notes: 'Official OKX exchange.' },
    { name: 'Bitget', slug: 'bitget', destination_url: 'https://www.bitget.com/', bonus_desc: 'Up to $1,000 in Trading Bonus Coupons', payout_type: 'USDT Coupon Credit', payout_amount: 'Up to $1,000.00', earnings_today_cents: 3000, earnings_month_cents: 16000, total_earnings_cents: 69000, category: 'crypto', tags: 'copy-trading,welcome,bonus', notes: 'Official Bitget trading portal.' },
    { name: 'Ibotta', slug: 'ibotta', destination_url: 'https://ibotta.com/', bonus_desc: '$10.00 Welcome Bonus on 1st Grocery Rebate', payout_type: 'Direct Bank / PayPal', payout_amount: '$10.00', earnings_today_cents: 2000, earnings_month_cents: 12500, total_earnings_cents: 53000, category: 'cashback', tags: 'groceries,receipts,cash', notes: 'Official Ibotta cash back app.' },
    { name: 'Survey Junkie', slug: 'surveyjunkie', destination_url: 'https://www.surveyjunkie.com/?invite=euid0wUYDAdKd3QSCC4Tvevt7aDQ1mU0knE0e2uQbCSA6R8%3D&appv=3', bonus_desc: 'Instant Points on Profile Completion', payout_type: 'PayPal / Bank / e-Gift', payout_amount: '$5.00 – $20.00', earnings_today_cents: 1000, earnings_month_cents: 5500, total_earnings_cents: 27000, category: 'rewards', tags: 'surveys,quick-cash,daily', notes: 'Active custom Survey Junkie referral link.' },
    { name: 'Capital One Shopping', slug: 'capitaloneshopping', destination_url: 'https://capitaloneshopping.com/', bonus_desc: 'Up to $25 Shopping Rewards Credit', payout_type: 'Shopping Gift Card', payout_amount: '$25.00', earnings_today_cents: 2500, earnings_month_cents: 14000, total_earnings_cents: 62000, category: 'cashback', tags: 'shopping,coupons,rewards', notes: 'Official Capital One Shopping extension.' },
    { name: 'Crypto.com', slug: 'cryptocom', destination_url: 'https://crypto.com/app/nb6sspkwde', bonus_desc: '$25 – $50 in CRO on Metal Visa Card Reservation', payout_type: 'CRO Token Credit', payout_amount: '$25.00 in CRO', earnings_today_cents: 4000, earnings_month_cents: 23000, total_earnings_cents: 98000, category: 'crypto', tags: 'crypto,card,rewards', notes: 'Active custom Crypto.com referral link (Code: nb6sspkwde).' },
    { name: 'Bybit', slug: 'bybit', destination_url: 'https://www.bybit.com/', bonus_desc: 'Up to $30 USDT Welcome Gift + Mystery Box', payout_type: 'USDT Trading Reward', payout_amount: 'Up to $30.00', earnings_today_cents: 3500, earnings_month_cents: 19000, total_earnings_cents: 81000, category: 'crypto', tags: 'derivatives,high-roller,vip', notes: 'Official Bybit trading platform.' },
    { name: 'Plug-In OS', slug: 'plugin-os', destination_url: 'https://stan.store/', bonus_desc: '$25 – $50 Commission per Activation', payout_type: 'Stan Store Automatic Transfer', payout_amount: '$25.00', earnings_today_cents: 5000, earnings_month_cents: 35000, total_earnings_cents: 175000, category: 'software', tags: 'affiliate,stan,automation,plug-in', notes: 'Official Stan Store template activation portal.' },
    { name: 'Acorns', slug: 'acorns', destination_url: 'https://www.acorns.com/', bonus_desc: '$5 – $1,000 Referral Invest Bonus', payout_type: 'Invest Portfolio Credit', payout_amount: '$5.00 – $1,000.00', earnings_today_cents: 2500, earnings_month_cents: 14500, total_earnings_cents: 68500, category: 'finance', tags: 'investing,automated,bonus', notes: 'Official Acorns micro-investing portal.' },
    { name: 'Bolt.new', slug: 'bolt', destination_url: 'https://bolt.cello.so/uugCkUiwCIo', bonus_desc: 'AI Full-Stack Development Tokens & Pro Discount', payout_type: 'Recurring SaaS Commission', payout_amount: '20% – 30% Monthly', earnings_today_cents: 4500, earnings_month_cents: 32000, total_earnings_cents: 142000, category: 'software', tags: 'ai,coding,developer,software,bolt', notes: 'Active custom Bolt.new AI coding referral link.' },
    { name: 'MaxBounty CPA Network', slug: 'maxbounty', destination_url: 'https://affiliates.maxbounty.com/register?referrer=799713', bonus_desc: 'Top-Tier CPA Performance Network ($5 – $500+ Payouts + 5% Referral Bonus)', payout_type: 'Weekly Direct Deposit / ACH / Wire', payout_amount: 'CPA Rates up to $500+', earnings_today_cents: 6500, earnings_month_cents: 48000, total_earnings_cents: 235000, category: 'affiliate', tags: 'cpa,performance,affiliate-network,maxbounty,high-ticket', notes: 'Active custom MaxBounty VIP affiliate invite link (Referrer: 799713).' },
    { name: 'Blue Media Ventures', slug: 'bluemedia', destination_url: 'http://members.bluemediaventures.com/affiliate_signup.aspx?r=7913', bonus_desc: 'Exclusive Direct Affiliate Network with Top Global CPA/CPS Offers', payout_type: 'Weekly / Bi-Weekly Direct Payouts', payout_amount: 'Tier-1 Direct Rates', earnings_today_cents: 5500, earnings_month_cents: 38000, total_earnings_cents: 185000, category: 'affiliate', tags: 'cpa,network,affiliate,bluemedia,exclusive', notes: 'Active custom Blue Media Ventures affiliate invite link (Referrer: 7913).' },
    { name: 'Wish.com Shopping', slug: 'wish', destination_url: 'https://www.wish.com/', bonus_desc: 'Affordable Global E-Commerce (15% RevShare on All Purchases)', payout_type: '15% Lifetime RevShare on Orders', payout_amount: '15% RevShare', earnings_today_cents: 4200, earnings_month_cents: 29000, total_earnings_cents: 145000, category: 'cashback', tags: 'shopping,ecommerce,wish,deals,discounts', notes: 'Official Wish.com global retail affiliate partner.' },
    { name: 'Swooped AI Job Search', slug: 'swooped', destination_url: 'https://swooped.co/', bonus_desc: 'AI Resume & Auto-Apply Job Suite ($60.00 CPS Payout)', payout_type: '$60.00 per Qualified Sale', payout_amount: '$60.00', earnings_today_cents: 6000, earnings_month_cents: 42000, total_earnings_cents: 198000, category: 'software', tags: 'ai,jobs,resume,cps,swooped', notes: 'Active Swooped AI job search campaign.' },
    { name: 'Tax Expert Now', slug: 'tax-expert-now', destination_url: 'https://www.justanswer.com/', bonus_desc: 'On-Demand CPA & Tax Help Consultations ($22.50 – $31.50 CPL)', payout_type: 'Direct Lead / Consult Payout', payout_amount: '$22.50 – $31.50', earnings_today_cents: 5600, earnings_month_cents: 36000, total_earnings_cents: 165000, category: 'finance', tags: 'taxes,cpa,consult,cpl,justanswer', notes: 'Active Tax Expert Now on-demand CPA consultation portal.' },
  ];

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO crypto_referral_programs (
      id, name, slug, destination_url, bonus_desc, payout_type, payout_amount, notes,
      earnings_today_cents, earnings_month_cents, total_earnings_cents, total_clicks, status, tags, category, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT total_clicks FROM crypto_referral_programs WHERE slug = ?), 0), 'active', ?, ?, ?, ?
    )
  `);

  for (const p of allPrograms) {
    stmt.run(
      `prog_${p.slug}`,
      p.name,
      p.slug,
      p.destination_url,
      p.bonus_desc,
      p.payout_type,
      p.payout_amount,
      p.notes || '',
      p.earnings_today_cents,
      p.earnings_month_cents,
      p.total_earnings_cents,
      p.slug,
      p.tags || 'finance,referral',
      p.category,
      now,
      now
    );
  }
}

export function seedFunnelTemplates(): void {
  const templates = [
    {
      program: 'Swooped',
      steps: [
        '1. Connect your Swooped affiliate tracking link via /go/swooped',
        '2. Deploy the "Beating ATS Resume Filters" 30s video hook from 5-Pulse AI Studio',
        '3. Direct job seekers to your tailored resume scan bridge page',
        '4. Earn $60.00 CPS on every paid subscription upgrade',
      ],
    },
    {
      program: 'Tax Expert Now',
      steps: [
        '1. Route tax queries through /go/tax-expert-now',
        '2. Publish 1099 write-off & audit checklist advertorials',
        '3. Connect users with licensed online CPAs',
        '4. Earn $22.50 to $31.50 CPL per booked consultation',
      ],
    },
    {
      program: 'Blue Media Ventures',
      steps: [
        '1. Open VIP Partner Invite: http://members.bluemediaventures.com/affiliate_signup.aspx?r=7913',
        '2. Complete the streamlined affiliate publisher application',
        '3. Unlock direct Tier-1 CPA & CPS campaigns with top e-commerce and lead-gen brands',
        '4. Set up custom postback tracking and link to 5-Pulse AI Studio distribution',
      ],
    },
    {
      program: 'Wish.com',
      steps: [
        '1. Connect your Wish affiliate link or generate deep-links to trending items',
        '2. Produce short-form viral product reviews ("TikTok Made Me Buy It" / Weird Gadgets under $10)',
        '3. Route traffic to your Wish curated storefront or bridge collection page',
        '4. Earn 15% revenue share on every product purchase across 14 Tier-1 countries',
      ],
    },
    {
      program: 'MaxBounty',
      steps: [
        '1. Open VIP MaxBounty Portal: https://affiliates.maxbounty.com/register?referrer=799713',
        '2. Apply as an affiliate marketer with your social channels or audience niche',
        '3. Select top CPA/CPL campaigns in Finance, Software, E-commerce, or Gaming',
        '4. Generate high-converting tracking links and route through 5-Pulse AI Studio',
        '5. Receive weekly direct deposits + 5% lifetime referral override commissions',
      ],
    },
    {
      program: 'Rakuten',
      steps: [
        '1. Open Rakuten link: https://www.rakuten.com/r/CASHPL19',
        '2. Sign up and make any qualifying $30 purchase at Target, Nike, Walmart',
        '3. Receive guaranteed $30 welcome check or PayPal cash',
        '4. Share your custom Rakuten link to repeat $30 bonuses',
      ],
    },
    {
      program: 'Cash App',
      steps: [
        '1. Download Cash App using referral link: https://cash.app/refer/4z6f32h (Code: 4z6f32h)',
        '2. Link debit card and activate $Cashtag in profile',
        '3. Send $5 to a friend or family member',
        '4. Instantly receive your guaranteed $5-$15 sign-up bonus',
      ],
    },
    {
      program: 'Plug-In OS',
      steps: [
        '1. Share your Stan affiliate link in Bio or pinned comment',
        '2. Direct user to checkout with 1-click template access',
        '3. Stan triggers instant automatic $25-$50 commission payout',
        '4. User unlocks Plug-In OS multi-agent dashboard',
      ],
    },
  ];

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO funnel_templates (id, program, steps_json, updated_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const t of templates) {
    const slug = t.program.toLowerCase().replace(/\s+/g, '');
    stmt.run(`tmpl_${slug}`, t.program, JSON.stringify(t.steps), now, now);
  }
}

export function seedDefaultTasks(): void {
  const defaultTasks = [
    { id: 'task_budget_checkin', title: 'Daily Budget Check-in', description: 'Review your budget remaining and log any expenses for today.', category: 'budget', reward_cents: 50, reward_xp: 75, task_type: 'daily' },
    { id: 'task_debt_avalanche', title: 'Pay Down Debt Milestone', description: 'Make an extra payment toward your highest-interest debt.', category: 'debt', reward_cents: 150, reward_xp: 150, task_type: 'milestone' },
    { id: 'task_emergency_fund', title: 'Feed The Emergency Vault', description: 'Deposit at least $25 into your Emergency Fund goal.', category: 'savings', reward_cents: 100, reward_xp: 120, task_type: 'daily' },
    { id: 'task_crypto_stack', title: 'Stack Crypto Holdings', description: 'Review your multi-asset crypto ledger and verify wallet transactions.', category: 'crypto', reward_cents: 75, reward_xp: 100, task_type: 'daily' },
    { id: 'task_refer_friend', title: 'Invite A Financial Peer', description: 'Share your MoneyPlugHub link to earn real commissions and rank up.', category: 'referral', reward_cents: 1000, reward_xp: 350, task_type: 'milestone' },
    { id: 'task_networth_sync', title: 'Calculate Weekly Net Worth', description: 'Sync all connected bank, crypto, and liability accounts.', category: 'learning', reward_cents: 100, reward_xp: 110, task_type: 'daily' },
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tasks (id, title, description, category, reward_cents, reward_xp, task_type, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  for (const t of defaultTasks) {
    stmt.run(t.id, t.title, t.description, t.category, t.reward_cents, t.reward_xp, t.task_type);
  }
}

export function initializeUserFinancialProfile(userId: string, email: string): void {
  const now = new Date().toISOString();
  const currentMonth = now.substring(0, 7);
  const todayStr = now.substring(0, 10);

  // 1. User Profile OS (Adaptive & Behavior-Aware)
  db.prepare(`
    INSERT OR REPLACE INTO user_profile_os (
      user_id, behavior_type, energy_pattern, friction_points, strengths, current_focus, stress_level, notes, updated_at
    ) VALUES (?, 'Sprinter', 'Morning Peak / Evening Creative Flow', 'Manual data entry, over-complex spreadsheets', 'Short-form content, viral hooks, speed execution', 'Scale Rakuten + Plug-In OS referral funnels to $500/week', 2, 'Prefers automated micro-tasks under 5 minutes.', ?)
  `).run(userId, now);

  // 2. XP Actions DB (Micro-tasks)
  const defaultXpActions = [
    { action: 'Post 1 short-form video on TikTok promoting Rakuten $30 bonus', category: 'Content', difficulty: 'S', time: '5 min', xp: 100, automated: 0, status: 'To Do' },
    { action: 'Review Daily Budget Remaining & log yesterday expenses', category: 'Money', difficulty: 'XS', time: '2 min', xp: 50, automated: 1, status: 'To Do' },
    { action: 'DCA $25 into Emergency Vault goal', category: 'Money', difficulty: 'XS', time: '1 min', xp: 75, automated: 0, status: 'To Do' },
    { action: 'Verify Make.com Webhook trigger for referral lead routing', category: 'System', difficulty: 'M', time: '8 min', xp: 120, automated: 1, status: 'Doing' },
    { action: 'Morning Routine: Check Command Center & verify balances', category: 'Routine', difficulty: 'XS', time: '3 min', xp: 50, automated: 1, status: 'Done' },
  ];

  const insertXpAction = db.prepare(`
    INSERT OR REPLACE INTO xp_actions (id, user_id, action, category, difficulty, time_required, status, xp_value, is_automated, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultXpActions.forEach((act, idx) => {
    insertXpAction.run(`xp_act_${userId}_${idx}`, userId, act.action, act.category, act.difficulty, act.time, act.status, act.xp, act.automated, now, now);
  });

  // 3. Program Tracker DB
  const insertProgramTracker = db.prepare(`
    INSERT OR REPLACE INTO program_tracker (id, user_id, program, clicks, signups, conversions, earnings_cents, date, source_platform, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProgramTracker.run(`pt_${userId}_1`, userId, 'Rakuten', 42, 6, 4, 12000, todayStr, 'TikTok', now);
  insertProgramTracker.run(`pt_${userId}_2`, userId, 'Plug-In OS', 18, 3, 2, 5000, todayStr, 'IG Reels', now);
  insertProgramTracker.run(`pt_${userId}_3`, userId, 'Cash App', 29, 4, 3, 4500, todayStr, 'YouTube Shorts', now);

  // 4. Content Queue DB (Faceless Content Engine)
  const defaultContent = [
    {
      idea: 'If you’re broke, start here (Command Center walkthrough)',
      hook: 'Stop guessing your finances. This automated dashboard does the math for you.',
      script: 'If you have $0 in savings, you need a system, not motivation. Plug-In OS automatically tracks your cash back and debt payoff in one screen. Link in bio to copy this layout.',
      platform: 'TikTok',
      status: 'Ready to Post',
      views: 14500,
      ctr: 4.8,
      saves: 890,
    },
    {
      idea: '3 apps paying me cash back this week (Rakuten + Upside + Fetch)',
      hook: 'I made $65 this week just buying groceries and gas. Here is the stack.',
      script: 'App 1 is Rakuten for $30 welcome cash. App 2 is Upside for 25¢ off gas. App 3 is Fetch for receipt scans. All three links are in my bio.',
      platform: 'IG Reels',
      status: 'Scripted',
      views: 0,
      ctr: 0.0,
      saves: 0,
    },
    {
      idea: 'Budget hack that saved me $450 in 30 days',
      hook: 'Budgeting only works if you stop tracking every coffee and automate the big buckets.',
      script: 'Instead of complex budgeting apps, I use this one-screen control center. Plug in your income, lock in your fixed bills, and let the rest flow. Comment OS and I will DM you the template.',
      platform: 'YouTube Shorts',
      status: 'Idea',
      views: 0,
      ctr: 0.0,
      saves: 0,
    },
  ];

  // In case table exists with old constraint, recreate or insert
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS content_queue_temp (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        video_idea TEXT NOT NULL,
        script TEXT NOT NULL,
        hook TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Idea',
        platform TEXT NOT NULL DEFAULT 'TikTok',
        link TEXT DEFAULT '',
        views INTEGER NOT NULL DEFAULT 0,
        ctr REAL NOT NULL DEFAULT 0.0,
        saves INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      INSERT OR IGNORE INTO content_queue_temp SELECT * FROM content_queue;
      DROP TABLE content_queue;
      ALTER TABLE content_queue_temp RENAME TO content_queue;
    `);
  } catch (e) {}

  const insertContent = db.prepare(`
    INSERT OR REPLACE INTO content_queue (id, user_id, video_idea, script, hook, status, platform, link, views, ctr, saves, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultContent.forEach((c, idx) => {
    insertContent.run(`cq_${userId}_${idx}`, userId, c.idea, c.script, c.hook, c.status, c.platform, 'http://localhost:3000/go/rakuten', c.views, c.ctr, c.saves, now);
  });

  // 5. Automations Map DB (Make.com + Zapier)
  const defaultAutomations = [
    { name: 'Daily Balance Sync & Webhook', trigger: 'Scheduled: Daily 8:00 AM EST', action: 'Pull Plaid + Crypto API balances & write to snapshots', status: 'Active', notes: 'Runs on Make.com scenario #94821' },
    { name: 'Referral Lead Router to Notion', trigger: 'Instant Webhook on /go/:slug click', action: 'Log click, increment counter & notify Telegram bot', status: 'Active', notes: 'Zero latency click analytics' },
    { name: 'Daily Insight Synthesis Trigger', trigger: 'AutomationAgent on_schedule_tick', action: 'Synthesize balances + earnings into daily action suggestions', status: 'Active', notes: 'Autonomous Multi-Agent Mesh' },
    { name: 'Weekly Earnings Report Generator', trigger: 'Scheduled: Every Friday 5:00 PM', action: 'Calculate gross/net revenue & compile Friday Stan check log', status: 'Active', notes: 'Automates Section 4 Payout log' },
  ];

  const insertAutoMap = db.prepare(`
    INSERT OR REPLACE INTO automations_map (id, user_id, name, trigger_desc, action_desc, status, notes, last_run, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultAutomations.forEach((a, idx) => {
    insertAutoMap.run(`am_${userId}_${idx}`, userId, a.name, a.trigger, a.action, a.status, a.notes, now, now);
  });

  // 6. Self-Understanding DB (Adaptive Behavior Engine)
  const defaultPatterns = [
    { pattern: 'High Morning Momentum', insight: 'Completes 80% of XP tasks when logged in before 10:00 AM', trigger: 'Early morning session', adjustment: 'Deliver Top 3 Money micro-tasks at 8:00 AM prompt', confirmed: 1 },
    { pattern: 'Manual Entry Friction', insight: 'Avoids multi-field expense tracking forms on mobile', trigger: 'Expense logging prompt', adjustment: 'Prioritize automated Plaid sync over manual ledger typing', confirmed: 1 },
    { pattern: 'Short-Form Content Velocity', insight: 'Rakuten conversion rate spikes 3.4x when posting hook-first video scripts', trigger: 'TikTok post published', adjustment: 'Auto-queue top-performing video prompts in Content Queue', confirmed: 1 },
  ];

  const insertSelfUnd = db.prepare(`
    INSERT OR REPLACE INTO self_understanding_patterns (id, user_id, pattern, insight, trigger_event, suggested_adjustment, confirmed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultPatterns.forEach((p, idx) => {
    insertSelfUnd.run(`sup_${userId}_${idx}`, userId, p.pattern, p.insight, p.trigger, p.adjustment, p.confirmed, now);
  });

  // 7. Scratchpad
  db.prepare(`
    INSERT OR REPLACE INTO scratchpad_notes (user_id, content, updated_at)
    VALUES (?, '• Need to film 2 short-form videos for Rakuten $30 bonus\n• Test new Cashtag send prompt on IG Stories\n• Review Emergency Fund runway target before month end', ?)
  `).run(userId, now);

  // 8. Wallets, Accounts, Providers, Snapshots
  const currencies: Array<'USDC' | 'SOL' | 'BTC' | 'ETH' | 'MPH'> = ['USDC', 'SOL', 'BTC', 'ETH', 'MPH'];
  const insertWallet = db.prepare(`
    INSERT OR REPLACE INTO crypto_wallets (id, user_id, currency, balance, address, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const curr of currencies) {
    const address = `0x${crypto.randomBytes(20).toString('hex')}`;
    const initialBal = curr === 'USDC' ? 250.0 : curr === 'SOL' ? 4.5 : curr === 'BTC' ? 0.035 : curr === 'ETH' ? 0.45 : 1500.0;
    insertWallet.run(`w_${userId}_${curr}`, userId, curr, initialBal, address, now);
  }

  const insertAccount = db.prepare(`
    INSERT OR REPLACE INTO accounts (id, user_id, name, type, balance_cents, currency, institution, is_liability, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'USD', ?, ?, ?, ?)
  `);

  const checkingId = `acc_${userId}_checking`;
  const savingsId = `acc_${userId}_savings`;
  const cryptoAccId = `acc_${userId}_crypto`;
  const creditCardId = `acc_${userId}_cc`;

  insertAccount.run(checkingId, userId, 'Main Primary Checking', 'bank', 345000, 'Chase Bank', 0, now, now);
  insertAccount.run(savingsId, userId, 'High-Yield Savings (HYSA)', 'bank', 820000, 'Ally Bank', 0, now, now);
  insertAccount.run(cryptoAccId, userId, 'Cold Storage & Crypto Vault', 'crypto', 415000, 'MoneyPlugHub Ledger', 0, now, now);
  insertAccount.run(creditCardId, userId, 'Sapphire Reserve Credit Card', 'credit_card', 125000, 'Chase', 1, now, now);

  const insertProvider = db.prepare(`
    INSERT OR REPLACE INTO connected_providers (id, user_id, provider_name, provider_type, status, last_sync_at, created_at)
    VALUES (?, ?, ?, ?, 'connected', ?, ?)
  `);

  insertProvider.run(`cp_${userId}_1`, userId, 'Chase Online (Plaid)', 'bank', now, now);
  insertProvider.run(`cp_${userId}_2`, userId, 'Ally Bank Direct Connect', 'bank', now, now);
  insertProvider.run(`cp_${userId}_3`, userId, 'Coinbase & On-Chain RPC', 'crypto', now, now);
  insertProvider.run(`cp_${userId}_4`, userId, 'Chase Sapphire Card API', 'card', now, now);

  const insertSnapshot = db.prepare(`
    INSERT OR REPLACE INTO balance_snapshots (id, user_id, account_id, provider, balance_cents, currency, as_of, created_at)
    VALUES (?, ?, ?, ?, ?, 'USD', ?, ?)
  `);

  insertSnapshot.run(`snap_${userId}_1`, userId, checkingId, 'Chase Online (Plaid)', 345000, now, now);
  insertSnapshot.run(`snap_${userId}_2`, userId, savingsId, 'Ally Bank Direct Connect', 820000, now, now);
  insertSnapshot.run(`snap_${userId}_3`, userId, cryptoAccId, 'Coinbase & On-Chain RPC', 415000, now, now);
  insertSnapshot.run(`snap_${userId}_4`, userId, creditCardId, 'Chase Sapphire Card API', 125000, now, now);

  const insertEarnings = db.prepare(`
    INSERT OR REPLACE INTO earnings_snapshots (id, user_id, window, start_date, end_date, gross_cents, net_cents, currency, computed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?)
  `);

  insertEarnings.run(`earn_${userId}_daily`, userId, 'daily', now.substring(0, 10) + 'T00:00:00.000Z', now.substring(0, 10) + 'T23:59:59.999Z', 21500, 21500, now, now);
  insertEarnings.run(`earn_${userId}_weekly`, userId, 'weekly', '2026-08-14T00:00:00.000Z', '2026-08-20T23:59:59.999Z', 58000, 58000, now, now);
  insertEarnings.run(`earn_${userId}_monthly`, userId, 'monthly', '2026-08-01T00:00:00.000Z', '2026-08-31T23:59:59.999Z', 245000, 245000, now, now);

  const starterAutomations = [
    { id: 'auto_daily_balance_check', name: 'Daily Balance Check', schedule: 'daily', enabled: 1 },
    { id: 'auto_daily_earnings_summary', name: 'Daily Earnings Summary', schedule: 'daily', enabled: 1 },
    { id: 'auto_daily_referral_push', name: 'Daily Referral Push', schedule: 'daily', enabled: 1 },
    { id: 'auto_weekly_insights', name: 'Weekly Financial Insights', schedule: 'weekly', enabled: 1 },
    { id: 'auto_monthly_report', name: 'Monthly Ledger & Balance Report', schedule: 'monthly', enabled: 1 },
  ];

  const insertAutoToggle = db.prepare(`
    INSERT OR REPLACE INTO automation_toggles (id, user_id, automation_id, name, schedule, enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const auto of starterAutomations) {
    insertAutoToggle.run(`tog_${userId}_${auto.id}`, userId, auto.id, auto.name, auto.schedule, auto.enabled, now);
  }

  const initialSuggestions = [
    'Deploy high-converting short-form video for Rakuten $30 instant shopping bonus.',
    'DCA $50 into Emergency Vault to maintain 6-month runway trajectory.',
    'Execute credit card debt paydown using Avalanche strategy at 19.99% APR.',
  ];

  db.prepare(`
    INSERT OR REPLACE INTO daily_insights (id, user_id, date, summary, suggestions_json, timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `ins_${userId}_${todayStr}`,
    userId,
    todayStr,
    'Your net worth sits strong at $14,550.00 with $215.00 earned today. All 4 Make.com workflows are running smoothly.',
    JSON.stringify(initialSuggestions),
    now,
    now
  );

  db.prepare(`
    INSERT OR REPLACE INTO orchestrator_state (user_id, status, consecutive_failures, last_run_at, degraded_reason, updated_at)
    VALUES (?, 'operational', 0, NULL, NULL, ?)
  `).run(userId, now);

  db.prepare(`
    INSERT OR REPLACE INTO affiliate_settings (user_id, stan_affiliate_link, weekly_tiktok_target, weekly_tiktok_completed, weekly_ig_target, weekly_ig_completed, weekly_yt_target, weekly_yt_completed, updated_at)
    VALUES (?, 'https://stan.store/moneyplughub/p/plugin-os?aff=PLUG-ALEX', 5, 2, 3, 1, 2, 1, ?)
  `).run(userId, now);

  db.prepare(`
    INSERT OR REPLACE INTO affiliate_payout_logs (id, user_id, week_label, clicks, activations, earnings_cents, status, payout_date, created_at)
    VALUES (?, ?, 'This week', 14, 2, 5000, 'Pending', '-', ?)
  `).run(`payout_${userId}_current`, userId, now);

  db.prepare(`
    INSERT OR REPLACE INTO debts (id, user_id, name, total_balance_cents, minimum_payment_cents, interest_rate, due_date, strategy, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'avalanche', ?, ?)
  `).run(`debt_${userId}_1`, userId, 'Credit Card Debt', 125000, 15000, 19.99, '2026-09-01', now, now);

  db.prepare(`
    INSERT OR REPLACE INTO financial_goals (id, user_id, title, category, target_cents, current_cents, target_date, icon, created_at, updated_at)
    VALUES (?, ?, ?, 'emergency_fund', 1500000, 820000, '2026-12-31', 'Shield', ?, ?)
  `).run(`goal_${userId}_ef`, userId, '6-Month Emergency Runway', now, now);

  const categories = [
    { cat: 'Housing & Utilities', limit: 140000 },
    { cat: 'Food & Groceries', limit: 50000 },
    { cat: 'Crypto & Investments', limit: 40000 },
    { cat: 'Transportation', limit: 30000 },
    { cat: 'Lifestyle & Entertainment', limit: 25000 },
  ];

  const insertBudget = db.prepare(`
    INSERT OR REPLACE INTO budgets (id, user_id, category, monthly_limit_cents, month, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  categories.forEach((c, idx) => {
    insertBudget.run(`b_${userId}_${idx}`, userId, c.cat, c.limit, currentMonth, now);
  });
}

export function recordAuditLog(
  actorUserId: string | null,
  action: string,
  targetEntity: string,
  targetId: string | null,
  details: Record<string, any> | null
): void {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, target_entity, target_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  stmt.run(
    id,
    actorUserId,
    action,
    targetEntity,
    targetId,
    details ? JSON.stringify(details) : null,
    new Date().toISOString()
  );
}

initDb();
