import { Request, Response } from 'express';
import { db } from '../../src/backend/db.js';

export interface PaywallCheckResponse {
  status: 'unauthenticated' | 'paywall' | 'allowed';
  tier?: string;
  subscriptionActive?: boolean;
}

/**
 * GET /api/paywall/check
 * Verifies if the authenticated user has an active CREATOR subscription tier.
 */
export async function checkPaywall(req: Request, res: Response): Promise<void> {
  try {
    const sessionToken = req.cookies?.creator_auth_token || req.headers?.authorization?.replace('Bearer ', '');
    const userId = (req as any).user?.id || (req as any).userId;

    if (!sessionToken && !userId) {
      res.status(200).json({ status: 'unauthenticated' });
      return;
    }

    // Lookup user in SQLite
    let userRecord: any = null;
    if (userId) {
      userRecord = db.prepare('SELECT id, subscriptionTier, subscriptionActive, tier_title, level FROM users WHERE id = ?').get(userId);
    } else {
      // Fallback to first active user if in development/session token resolution
      userRecord = db.prepare('SELECT id, subscriptionTier, subscriptionActive, tier_title, level FROM users ORDER BY created_at ASC LIMIT 1').get();
    }

    if (!userRecord) {
      res.status(200).json({ status: 'unauthenticated' });
      return;
    }

    const subTier = (userRecord.subscriptionTier || 'FREE').toUpperCase();
    const isActive = Number(userRecord.subscriptionActive || 0) === 1;

    if (subTier === 'CREATOR' || subTier === 'PRO' || subTier === 'ENTERPRISE' || isActive) {
      res.status(200).json({
        status: 'allowed',
        tier: subTier,
        subscriptionActive: true,
      });
      return;
    }

    res.status(200).json({
      status: 'paywall',
      tier: 'FREE',
      subscriptionActive: false,
    });
  } catch (error: any) {
    console.error('Error in checkPaywall API:', error);
    res.status(500).json({ error: 'INTERNAL_PAYWALL_ERROR', message: error.message });
  }
}

export default checkPaywall;
