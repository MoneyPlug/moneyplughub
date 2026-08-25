import { Request, Response } from 'express';
import { db, runInTransaction } from '../../src/backend/db.js';
import crypto from 'crypto';

export interface SubscribeRequestBody {
  planId: string;
  promoCode?: string;
}

/**
 * POST /api/billing/subscribe
 * Upgrades user to CREATOR subscription tier with promo code validation and SQLite audit logging.
 */
export async function subscribe(req: Request, res: Response): Promise<void> {
  try {
    const { planId = 'creator-monthly', promoCode = '' } = req.body as SubscribeRequestBody;
    const cleanPromo = (promoCode || '').trim().toUpperCase();

    // Resolve user ID
    let userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      const firstUser: any = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get();
      userId = firstUser?.id;
    }

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }

    // Determine price based on plan & promo code
    let basePrice = 29.00;
    if (planId === 'pro-monthly') basePrice = 149.00;
    if (planId === 'enterprise-monthly') basePrice = 499.00;

    let finalPrice = basePrice;
    if (cleanPromo === 'FOUNDING50') {
      finalPrice = 0.00; // 100% Free VIP Founding Access
    } else if (cleanPromo === 'VIPCREATOR') {
      finalPrice = basePrice * 0.5; // 50% off
    } else if (cleanPromo === 'EARLYBIRD') {
      finalPrice = basePrice * 0.8; // 20% off
    }

    const now = new Date().toISOString();
    const subscriptionId = `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const transactionId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Execute SQLite ACID Transaction
    runInTransaction(() => {
      // 1. Upgrade User
      db.prepare(`
        UPDATE users 
        SET subscriptionTier = 'CREATOR', 
            subscriptionActive = 1,
            tier_title = CASE WHEN tier_title = 'Novice Plug' THEN 'Creator Plug' ELSE tier_title END,
            updated_at = ?
        WHERE id = ?
      `).run(now, userId);

      // 2. Log in subscriptions table
      db.prepare(`
        INSERT INTO subscriptions (id, userId, planId, price, promoCode, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(subscriptionId, userId, planId, finalPrice, cleanPromo || null, now);

      // 3. Log in transactions table
      db.prepare(`
        INSERT INTO transactions (id, userId, type, amount, description, createdAt)
        VALUES (?, ?, 'subscription_activation', ?, ?, ?)
      `).run(
        transactionId,
        userId,
        finalPrice,
        `Creator Money OS Subscription (${planId}) — Promo: ${cleanPromo || 'NONE'}`,
        now
      );
    });

    res.status(200).json({
      status: 'SUCCESS',
      tier: 'CREATOR',
      subscriptionActive: true,
      pricePaid: finalPrice,
      subscriptionId,
    });
  } catch (error: any) {
    console.error('Error in subscribe API:', error);
    res.status(500).json({ error: 'INTERNAL_BILLING_ERROR', message: error.message });
  }
}

export default subscribe;
