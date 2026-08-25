import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { EarningsAgent } from '../agents/earningsAgent';
import { CanonicalEarnings, EarningsEvent } from '../../types';

const router = Router();

/**
 * Trigger EarningsAgent Computation (manual: user_command)
 */
router.post('/compute', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const result = await EarningsAgent.run(userId, 'manual: user_command');

  if (result.success) {
    // Award +50 XP for daily earnings calculation habit
    db.prepare('UPDATE users SET xp = xp + 50, updated_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      userId
    );
  }

  res.json({
    success: result.success,
    data: result.earnings,
    event: result.event,
    message: result.message,
    reward_xp: result.success ? 50 : 0,
  });
});

/**
 * Get Canonical Earnings Snapshots (context.world.earnings)
 */
router.get('/snapshots', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const rows = db.prepare(`
    SELECT 
      window,
      start_date as start,
      end_date as end,
      ROUND(gross_cents / 100.0, 2) as gross,
      ROUND(net_cents / 100.0, 2) as net,
      currency,
      computed_at as computedAt
    FROM earnings_snapshots 
    WHERE user_id = ?
    ORDER BY 
      CASE window 
        WHEN 'daily' THEN 1 
        WHEN 'weekly' THEN 2 
        WHEN 'monthly' THEN 3 
      END ASC
  `).all(userId) as unknown as CanonicalEarnings[];

  res.json({
    success: true,
    data: rows,
  });
});

/**
 * Get Earnings Events Stream
 */
router.get('/events', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const events = db.prepare(`
    SELECT * FROM earnings_events 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(userId) as unknown as EarningsEvent[];

  res.json({
    success: true,
    data: events,
  });
});

export default router;
