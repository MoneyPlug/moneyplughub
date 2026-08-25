import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { config } from '../config';

const router = Router();

function getRequestUserId(req: Request): string | null {
  if ((req as any).user?.id) return (req as any).user.id;
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null)
    || req.cookies?.token;
  if (token) {
    try {
      const decoded: any = jwt.verify(token, config.jwtSecret);
      return decoded?.userId || decoded?.id || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * GET /api/paywall/check
 * Verifies if the authenticated user has an active CREATOR subscription tier.
 */
router.get('/check', (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);

    if (!userId) {
      res.status(200).json({ status: 'unauthenticated' });
      return;
    }

    const user: any = db.prepare('SELECT id, subscriptionTier, subscriptionActive, tier_title, level, role FROM users WHERE id = ?').get(userId);

    if (!user) {
      res.status(200).json({ status: 'unauthenticated' });
      return;
    }

    const subTier = (user.subscriptionTier || 'FREE').toUpperCase();
    const isActive = Number(user.subscriptionActive || 0) === 1 || user.role === 'admin';

    if (subTier === 'CREATOR' || subTier === 'PRO' || subTier === 'ENTERPRISE' || isActive) {
      res.status(200).json({
        status: 'allowed',
        tier: subTier === 'FREE' ? 'CREATOR' : subTier,
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
});

export default router;
