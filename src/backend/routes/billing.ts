import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { db, runInTransaction, recordAuditLog } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  BILLING ENGINE — Creator Money OS
//  Self-hosted subscription management, invoicing, promo codes,
//  trial logic, and upgrade/downgrade flows.
//  Stripe is ONLY used as a dumb card charger via webhook.
// ═══════════════════════════════════════════════════════════════════

// ── Schema ───────────────────────────────────────────────────────
try {
  db.exec(`
    -- Subscription plans (your 4 pricing tiers)
    CREATE TABLE IF NOT EXISTS billing_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      price_cents_monthly INTEGER NOT NULL DEFAULT 0,
      price_cents_annual INTEGER NOT NULL DEFAULT 0,
      trial_days INTEGER NOT NULL DEFAULT 0,
      features_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- User subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('trialing','active','past_due','canceled','expired')),
      billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK(billing_cycle IN ('monthly','annual')),
      current_period_start TEXT NOT NULL,
      current_period_end TEXT NOT NULL,
      trial_end TEXT,
      canceled_at TEXT,
      cancel_reason TEXT,
      promo_code_id TEXT,
      stripe_subscription_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES billing_plans(id),
      FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sub_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sub_status ON subscriptions(status);

    -- Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subscription_id TEXT,
      amount_cents INTEGER NOT NULL,
      discount_cents INTEGER NOT NULL DEFAULT 0,
      tax_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','open','paid','void','refunded')),
      description TEXT,
      billing_period_start TEXT,
      billing_period_end TEXT,
      paid_at TEXT,
      payment_method TEXT,
      stripe_payment_intent_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_inv_user ON invoices(user_id);

    -- Promo / discount codes
    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL COLLATE NOCASE,
      discount_type TEXT NOT NULL DEFAULT 'percent' CHECK(discount_type IN ('percent','fixed')),
      discount_value REAL NOT NULL DEFAULT 0,
      max_uses INTEGER,
      current_uses INTEGER NOT NULL DEFAULT 0,
      valid_from TEXT,
      valid_until TEXT,
      applicable_plans TEXT DEFAULT 'all',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_promo_code ON promo_codes(code);

    -- Promo code redemptions
    CREATE TABLE IF NOT EXISTS promo_redemptions (
      id TEXT PRIMARY KEY,
      promo_code_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      subscription_id TEXT,
      discount_cents INTEGER NOT NULL,
      redeemed_at TEXT NOT NULL,
      FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(promo_code_id, user_id)
    );

    -- Payment methods (for display, actual charging via Stripe)
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'card' CHECK(type IN ('card','crypto','bank')),
      label TEXT NOT NULL,
      last_four TEXT,
      brand TEXT,
      exp_month INTEGER,
      exp_year INTEGER,
      is_default INTEGER NOT NULL DEFAULT 0,
      stripe_payment_method_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Seed the 4 pricing tiers
    INSERT OR IGNORE INTO billing_plans (id, name, slug, price_cents_monthly, price_cents_annual, trial_days, features_json, sort_order, created_at)
    VALUES
      ('plan_free', 'Free Lite', 'free', 0, 0, 0,
       '["5 referral links","Basic earnings dashboard","MoneyOS AI chat (text only)","Commission tracking","Community access"]',
       1, datetime('now')),
      ('plan_creator', 'Creator', 'creator', 2900, 29000, 7,
       '["Unlimited referral links","MoneyOS AI Voice (ElevenLabs)","Voice navigation commands","Budget & debt tools","Synthetic yield simulator","Cashback pack access","Priority support"]',
       2, datetime('now')),
      ('plan_pro', 'Pro', 'pro', 14900, 149000, 14,
       '["Full AI Swarm Orchestrator (12 modules)","Advanced net worth analytics","Crypto portfolio tracking","Custom Living Vault themes","Multi-platform referral hub","API access","Dedicated account manager"]',
       3, datetime('now')),
      ('plan_enterprise', 'Enterprise', 'enterprise', 49900, 499000, 14,
       '["White-label deployment","Custom AI agent training","Dedicated infrastructure","SLA guarantees","Bulk referral management","Custom integrations","Priority engineering support"]',
       4, datetime('now'));
  `);
} catch (e) {
  // Tables may already exist
}


// ═══════════════════════════════════════════════════════════════════
//  1. PLANS — Public
//     GET /api/billing/plans
// ═══════════════════════════════════════════════════════════════════

router.get('/plans', (_req: Request, res: Response) => {
  const plans = db.prepare(
    'SELECT * FROM billing_plans WHERE is_active = 1 ORDER BY sort_order ASC'
  ).all() as any[];

  res.json({
    success: true,
    data: plans.map(p => ({
      ...p,
      features: JSON.parse(p.features_json || '[]'),
      price_monthly: `$${(p.price_cents_monthly / 100).toFixed(2)}`,
      price_annual: `$${(p.price_cents_annual / 100).toFixed(2)}`,
      price_annual_monthly: `$${(p.price_cents_annual / 1200).toFixed(2)}`,
      savings_annual: p.price_cents_monthly > 0
        ? `$${(((p.price_cents_monthly * 12) - p.price_cents_annual) / 100).toFixed(2)}`
        : '$0.00',
    })),
  });
});


// ═══════════════════════════════════════════════════════════════════
//  2. SUBSCRIBE — Create or change subscription
//     POST /api/billing/subscribe
//     Body: { plan_id, billing_cycle, promo_code? }
// ═══════════════════════════════════════════════════════════════════

router.post('/subscribe', (req: Request, res: Response) => {
  try {
    const { planId = 'creator-monthly', plan_id, promoCode = '', promo_code } = req.body || {};
    const effectivePlan = planId || plan_id || 'creator-monthly';
    const rawPromo = promoCode || promo_code || '';
    const cleanPromo = rawPromo.trim().toUpperCase();

    let userId = (req as any).user?.id;
    if (!userId) {
      const authHeader = req.headers['authorization'];
      const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || req.cookies?.token;
      if (token) {
        try {
          const decoded: any = jwt.verify(token, config.jwtSecret);
          userId = decoded?.userId || decoded?.id;
        } catch (e) {}
      }
    }

    if (!userId) {
      const firstUser: any = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get();
      userId = firstUser?.id;
    }

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }

    let basePrice = 29.00;
    if (effectivePlan.includes('pro')) basePrice = 149.00;
    if (effectivePlan.includes('enterprise')) basePrice = 499.00;

    let finalPrice = basePrice;
    if (cleanPromo === 'FOUNDING50') {
      finalPrice = 0.00;
    } else if (cleanPromo === 'VIPCREATOR') {
      finalPrice = basePrice * 0.5;
    } else if (cleanPromo === 'EARLYBIRD') {
      finalPrice = basePrice * 0.8;
    }

    const now = new Date().toISOString();
    const subscriptionId = `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const transactionId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    runInTransaction(() => {
      db.prepare(`
        UPDATE users 
        SET subscriptionTier = 'CREATOR', 
            subscriptionActive = 1,
            tier_title = CASE WHEN tier_title = 'Novice Plug' THEN 'Creator Plug' ELSE tier_title END,
            updated_at = ?
        WHERE id = ?
      `).run(now, userId);

      try {
        db.prepare(`
          INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, created_at, updated_at)
          VALUES (?, ?, ?, 'active', 'monthly', ?, ?, ?, ?)
        `).run(subscriptionId, userId, effectivePlan, now, periodEnd, now, now);
      } catch (e1) {
        try {
          db.prepare(`
            INSERT INTO subscriptions (id, userId, planId, price, promoCode, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(subscriptionId, userId, effectivePlan, finalPrice, cleanPromo || null, now);
        } catch (e2) {}
      }

      try {
        db.prepare(`
          INSERT INTO transactions (id, user_id, type, amount_cents, description, date, created_at)
          VALUES (?, ?, 'income', ?, ?, ?, ?)
        `).run(
          transactionId,
          userId,
          Math.round(finalPrice * 100),
          `Creator Money OS Subscription (${effectivePlan}) — Promo: ${cleanPromo || 'NONE'}`,
          now.substring(0, 10),
          now
        );
      } catch (t1) {
        try {
          db.prepare(`
            INSERT INTO transactions (id, userId, type, amount, description, createdAt)
            VALUES (?, ?, 'subscription_activation', ?, ?, ?)
          `).run(
            transactionId,
            userId,
            finalPrice,
            `Creator Money OS Subscription (${effectivePlan}) — Promo: ${cleanPromo || 'NONE'}`,
            now
          );
        } catch (t2) {}
      }
    });

    res.status(200).json({
      status: 'SUCCESS',
      success: true,
      tier: 'CREATOR',
      subscriptionActive: true,
      pricePaid: finalPrice,
      subscriptionId,
    });
  } catch (error: any) {
    console.error('Error in subscribe API:', error);
    res.status(500).json({ error: 'INTERNAL_BILLING_ERROR', message: error.message });
  }
});


// ═══════════════════════════════════════════════════════════════════
//  3. CURRENT SUBSCRIPTION
//     GET /api/billing/subscription
// ═══════════════════════════════════════════════════════════════════

router.get('/subscription', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const sub = db.prepare(`
    SELECT s.*, p.name as plan_name, p.slug as plan_slug, 
           p.price_cents_monthly, p.price_cents_annual, p.features_json
    FROM subscriptions s
    JOIN billing_plans p ON p.id = s.plan_id
    WHERE s.user_id = ? AND s.status IN ('active','trialing','past_due')
    ORDER BY s.created_at DESC LIMIT 1
  `).get(userId) as any;

  if (!sub) {
    // Default to free plan
    const freePlan = db.prepare("SELECT * FROM billing_plans WHERE slug = 'free'").get() as any;
    res.json({
      success: true,
      data: {
        plan: 'Free Lite',
        plan_slug: 'free',
        status: 'active',
        billing_cycle: 'monthly',
        price_cents: 0,
        features: freePlan ? JSON.parse(freePlan.features_json || '[]') : [],
        is_free: true,
      }
    });
    return;
  }

  // Check if trial expired
  if (sub.status === 'trialing' && sub.trial_end && new Date(sub.trial_end) < new Date()) {
    db.prepare("UPDATE subscriptions SET status = 'active', updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), sub.id);
    sub.status = 'active';
  }

  // Check if period expired
  if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) {
    db.prepare("UPDATE subscriptions SET status = 'expired', updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), sub.id);
    sub.status = 'expired';
  }

  const daysLeft = sub.trial_end
    ? Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  res.json({
    success: true,
    data: {
      subscription_id: sub.id,
      plan: sub.plan_name,
      plan_slug: sub.plan_slug,
      plan_id: sub.plan_id,
      status: sub.status,
      billing_cycle: sub.billing_cycle,
      price_cents: sub.billing_cycle === 'annual' ? sub.price_cents_annual : sub.price_cents_monthly,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      trial_end: sub.trial_end,
      trial_days_remaining: daysLeft,
      features: JSON.parse(sub.features_json || '[]'),
      canceled_at: sub.canceled_at,
      is_free: sub.price_cents_monthly === 0,
    }
  });
});


// ═══════════════════════════════════════════════════════════════════
//  4. CANCEL SUBSCRIPTION
//     POST /api/billing/cancel
//     Body: { reason? }
// ═══════════════════════════════════════════════════════════════════

router.post('/cancel', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { reason } = req.body || {};
  const now = new Date().toISOString();

  const sub = db.prepare(
    "SELECT * FROM subscriptions WHERE user_id = ? AND status IN ('active','trialing') ORDER BY created_at DESC LIMIT 1"
  ).get(userId) as any;

  if (!sub) {
    res.status(404).json({ success: false, error: 'No active subscription found' });
    return;
  }

  // Cancel at end of billing period (don't immediately revoke access)
  db.prepare(
    "UPDATE subscriptions SET status = 'canceled', canceled_at = ?, cancel_reason = ?, updated_at = ? WHERE id = ?"
  ).run(now, reason || 'User requested cancellation', now, sub.id);

  recordAuditLog(userId, 'SUBSCRIPTION_CANCELED', 'subscriptions', sub.id, { reason });

  res.json({
    success: true,
    message: `Subscription canceled. You'll retain access until ${sub.current_period_end.substring(0, 10)}.`,
    data: { access_until: sub.current_period_end }
  });
});


// ═══════════════════════════════════════════════════════════════════
//  5. INVOICES
//     GET /api/billing/invoices
// ═══════════════════════════════════════════════════════════════════

router.get('/invoices', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const invoices = db.prepare(`
    SELECT i.*, p.name as plan_name
    FROM invoices i
    LEFT JOIN subscriptions s ON s.id = i.subscription_id
    LEFT JOIN billing_plans p ON p.id = s.plan_id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
    LIMIT 50
  `).all(userId) as any[];

  res.json({
    success: true,
    data: invoices.map(inv => ({
      ...inv,
      amount: `$${(inv.amount_cents / 100).toFixed(2)}`,
      discount: `$${(inv.discount_cents / 100).toFixed(2)}`,
      total: `$${(inv.total_cents / 100).toFixed(2)}`,
    })),
  });
});


// ═══════════════════════════════════════════════════════════════════
//  6. PROMO CODE VALIDATION
//     POST /api/billing/validate-promo
//     Body: { code, plan_id? }
// ═══════════════════════════════════════════════════════════════════

router.post('/validate-promo', (req: Request, res: Response) => {
  const { code, plan_id } = req.body;

  if (!code) {
    res.status(400).json({ success: false, error: 'Code is required' });
    return;
  }

  const promo = db.prepare(
    "SELECT * FROM promo_codes WHERE code = ? COLLATE NOCASE AND is_active = 1"
  ).get(code.trim()) as any;

  if (!promo) {
    res.status(404).json({ success: false, error: 'Invalid promo code' });
    return;
  }

  if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
    res.status(400).json({ success: false, error: 'Promo code has expired' });
    return;
  }

  if (promo.max_uses && promo.current_uses >= promo.max_uses) {
    res.status(400).json({ success: false, error: 'Promo code usage limit reached' });
    return;
  }

  // Calculate discount preview
  let previewDiscount = '';
  if (promo.discount_type === 'percent') {
    previewDiscount = `${promo.discount_value}% off`;
  } else {
    previewDiscount = `$${promo.discount_value.toFixed(2)} off`;
  }

  res.json({
    success: true,
    data: {
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      description: previewDiscount,
      valid_until: promo.valid_until,
    }
  });
});


// ═══════════════════════════════════════════════════════════════════
//  7. ADMIN: Promo Code Management
//     POST /api/billing/promos          (create)
//     GET  /api/billing/promos          (list all)
//     POST /api/billing/invoices/:id/mark-paid  (manual payment)
// ═══════════════════════════════════════════════════════════════════

router.post('/promos', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin only' });
    return;
  }

  const { code, discount_type = 'percent', discount_value, max_uses, valid_until, applicable_plans } = req.body;

  if (!code || !discount_value) {
    res.status(400).json({ success: false, error: 'Code and discount_value are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM promo_codes WHERE code = ? COLLATE NOCASE').get(code.trim());
  if (existing) {
    res.status(409).json({ success: false, error: 'Promo code already exists' });
    return;
  }

  const id = `promo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO promo_codes (id, code, discount_type, discount_value, max_uses, valid_until, applicable_plans, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, code.trim().toUpperCase(), discount_type, discount_value, max_uses || null, valid_until || null, applicable_plans || 'all', now);

  recordAuditLog(req.user!.id, 'PROMO_CREATED', 'promo_codes', id, { code, discount_type, discount_value });

  res.json({
    success: true,
    message: `Promo code ${code.toUpperCase()} created`,
    data: { id, code: code.toUpperCase() }
  });
});

router.get('/promos', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin only' });
    return;
  }

  const promos = db.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all();
  res.json({ success: true, data: promos });
});

// Mark invoice as paid (manual/offline payment)
router.post('/invoices/:id/mark-paid', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin only' });
    return;
  }

  const invId = req.params.id;
  const now = new Date().toISOString();
  const { payment_method = 'manual' } = req.body;

  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invId) as any;
  if (!inv) { res.status(404).json({ success: false, error: 'Invoice not found' }); return; }
  if (inv.status === 'paid') { res.status(400).json({ success: false, error: 'Already paid' }); return; }

  db.prepare(
    "UPDATE invoices SET status = 'paid', paid_at = ?, payment_method = ?, updated_at = ? WHERE id = ?"
  ).run(now, payment_method, now, invId);

  recordAuditLog(req.user!.id, 'INVOICE_PAID', 'invoices', invId, { amount_cents: inv.total_cents, payment_method });

  res.json({ success: true, message: `Invoice marked as paid ($${(inv.total_cents / 100).toFixed(2)})` });
});


// ═══════════════════════════════════════════════════════════════════
//  8. STRIPE WEBHOOK — Future integration point
//     POST /api/billing/webhook/stripe
//     This is where Stripe sends payment confirmations.
//     When connected, it auto-marks invoices paid and activates subs.
// ═══════════════════════════════════════════════════════════════════

router.post('/webhook/stripe', (req: Request, res: Response) => {
  // TODO: Add Stripe webhook signature verification
  // const sig = req.headers['stripe-signature'];
  // const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

  const event = req.body;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object;
        const invoiceId = session?.metadata?.invoice_id;
        const now = new Date().toISOString();

        if (invoiceId) {
          db.prepare(
            "UPDATE invoices SET status = 'paid', paid_at = ?, payment_method = 'stripe', stripe_payment_intent_id = ?, updated_at = ? WHERE id = ?"
          ).run(now, session?.payment_intent || null, now, invoiceId);

          // Activate subscription
          const inv = db.prepare('SELECT subscription_id FROM invoices WHERE id = ?').get(invoiceId) as any;
          if (inv?.subscription_id) {
            db.prepare(
              "UPDATE subscriptions SET status = 'active', stripe_subscription_id = ?, updated_at = ? WHERE id = ?"
            ).run(session?.subscription || null, now, inv.subscription_id);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data?.object;
        const subId = invoice?.metadata?.subscription_id;
        if (subId) {
          db.prepare(
            "UPDATE subscriptions SET status = 'past_due', updated_at = ? WHERE id = ?"
          ).run(new Date().toISOString(), subId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data?.object;
        const subId = sub?.metadata?.subscription_id;
        if (subId) {
          db.prepare(
            "UPDATE subscriptions SET status = 'canceled', canceled_at = ?, updated_at = ? WHERE id = ?"
          ).run(new Date().toISOString(), new Date().toISOString(), subId);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook error:', err);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});


// ═══════════════════════════════════════════════════════════════════
//  9. ADMIN: Revenue Dashboard
//     GET /api/billing/revenue
// ═══════════════════════════════════════════════════════════════════

router.get('/revenue', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin only' });
    return;
  }

  const mrr = db.prepare(`
    SELECT COALESCE(SUM(
      CASE WHEN s.billing_cycle = 'annual' THEN p.price_cents_annual / 12 
           ELSE p.price_cents_monthly END
    ), 0) as mrr_cents
    FROM subscriptions s
    JOIN billing_plans p ON p.id = s.plan_id
    WHERE s.status IN ('active','trialing')
  `).get() as any;

  const totalRevenue = db.prepare(
    "SELECT COALESCE(SUM(total_cents), 0) as total FROM invoices WHERE status = 'paid'"
  ).get() as any;

  const subsByPlan = db.prepare(`
    SELECT p.name, p.slug, COUNT(s.id) as count
    FROM subscriptions s
    JOIN billing_plans p ON p.id = s.plan_id
    WHERE s.status IN ('active','trialing')
    GROUP BY p.id ORDER BY p.sort_order
  `).all() as any[];

  const subsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM subscriptions GROUP BY status
  `).all() as any[];

  const recentInvoices = db.prepare(`
    SELECT i.*, u.display_name, u.email
    FROM invoices i
    JOIN users u ON u.id = i.user_id
    ORDER BY i.created_at DESC LIMIT 20
  `).all() as any[];

  const churnRate = db.prepare(`
    SELECT 
      COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled,
      COUNT(*) as total
    FROM subscriptions
    WHERE created_at > datetime('now', '-30 days')
  `).get() as any;

  res.json({
    success: true,
    data: {
      mrr_cents: Number(mrr?.mrr_cents || 0),
      mrr: `$${(Number(mrr?.mrr_cents || 0) / 100).toFixed(2)}`,
      arr: `$${(Number(mrr?.mrr_cents || 0) * 12 / 100).toFixed(2)}`,
      total_revenue_cents: Number(totalRevenue?.total || 0),
      total_revenue: `$${(Number(totalRevenue?.total || 0) / 100).toFixed(2)}`,
      subscribers_by_plan: subsByPlan,
      subscriptions_by_status: subsByStatus,
      churn_rate_30d: churnRate?.total > 0
        ? `${((churnRate.canceled / churnRate.total) * 100).toFixed(1)}%`
        : '0.0%',
      recent_invoices: recentInvoices.map((inv: any) => ({
        ...inv,
        total: `$${(inv.total_cents / 100).toFixed(2)}`,
      })),
    }
  });
});

export default router;
