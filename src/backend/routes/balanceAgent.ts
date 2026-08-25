import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { BalanceAgent } from '../agents/balanceAgent';
import { CanonicalBalance, ConnectedProvider, BalanceEvent } from '../../types';

const router = Router();

/**
 * Trigger BalanceAgent Sync (manual: user_command)
 */
router.post('/sync', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const result = await BalanceAgent.run(userId, 'manual: user_command');

  if (result.success) {
    // Award +50 XP for sync habit
    db.prepare('UPDATE users SET xp = xp + 50, updated_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      userId
    );
  }

  res.json({
    success: result.success,
    data: result.balances,
    event: result.event,
    message: result.message,
    reward_xp: result.success ? 50 : 0,
  });
});

/**
 * Get Canonical Balance Snapshots (context.world.balances)
 */
router.get('/snapshots', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const rows = db.prepare(`
    SELECT 
      bs.account_id as accountId,
      bs.provider,
      ROUND(bs.balance_cents / 100.0, 2) as balance,
      bs.currency,
      bs.as_of as asOf,
      a.name as account_name,
      a.type as account_type,
      a.is_liability
    FROM balance_snapshots bs
    JOIN accounts a ON a.id = bs.account_id
    WHERE bs.user_id = ?
    ORDER BY a.is_liability ASC, bs.balance_cents DESC
  `).all(userId);

  res.json({
    success: true,
    data: rows,
  });
});

/**
 * Get Connected Providers (context.settings.connections)
 */
router.get('/connections', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const connections = db.prepare(`
    SELECT * FROM connected_providers 
    WHERE user_id = ? 
    ORDER BY created_at ASC
  `).all(userId) as unknown as ConnectedProvider[];

  res.json({
    success: true,
    data: connections,
  });
});

/**
 * Toggle or Connect a Provider
 */
router.post('/connections', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { provider_name, provider_type, status } = req.body;

  if (!provider_name) {
    res.status(400).json({ success: false, error: 'provider_name is required' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO connected_providers (id, user_id, provider_name, provider_type, status, last_sync_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, provider_name) DO UPDATE SET
      status = excluded.status,
      last_sync_at = excluded.last_sync_at
  `).run(
    `cp_${userId}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    provider_name,
    provider_type || 'bank',
    status || 'connected',
    now,
    now
  );

  res.json({
    success: true,
    message: `Provider ${provider_name} status updated to ${status || 'connected'}`,
  });
});

/**
 * Get Balance Events Stream
 */
router.get('/events', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const events = db.prepare(`
    SELECT * FROM balance_events 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(userId) as unknown as BalanceEvent[];

  res.json({
    success: true,
    data: events,
  });
});

export default router;
