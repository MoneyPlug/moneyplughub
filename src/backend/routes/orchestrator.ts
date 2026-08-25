import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { StarterOrchestrator } from '../orchestrator/starterOrchestrator';
import { OrchestratorTask } from '../../types';

const router = Router();

/**
 * Handle User Command Task Routing (user commands / triggers)
 */
router.post('/command', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { task, payload } = req.body as { task: OrchestratorTask; payload?: any };

  if (!task) {
    res.status(400).json({ success: false, error: 'task name is required' });
    return;
  }

  const result = await StarterOrchestrator.executeCommand(userId, task, 'user_command', payload);

  if (result.success) {
    db.prepare('UPDATE users SET xp = xp + 50, updated_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      userId
    );
  }

  res.json({
    success: result.success,
    data: result.data,
    status: result.status,
    error: result.error,
    reward_xp: result.success ? 50 : 0,
  });
});

/**
 * Trigger Complete Daily Loop Sequence
 */
router.post('/daily-loop', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const result = await StarterOrchestrator.executeCommand(userId, 'daily_loop', 'daily_loop_start');

  if (result.success) {
    // Award +150 XP for daily loop completion!
    db.prepare('UPDATE users SET xp = xp + 150, updated_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      userId
    );
  }

  res.json({
    success: result.success,
    data: result.data,
    status: result.status,
    error: result.error,
    message: result.success ? 'Daily Loop Completed: Balances, Earnings, Referral Script, and Daily Insights Synced! (+150 XP)' : result.error,
    reward_xp: result.success ? 150 : 0,
  });
});

/**
 * Recover from Degraded State
 */
router.post('/recover', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const state = StarterOrchestrator.recover(userId);

  res.json({
    success: true,
    data: state,
    message: 'Orchestrator recovered to Operational state.',
  });
});

/**
 * Get Orchestrator State
 */
router.get('/state', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const state = StarterOrchestrator.getState(userId);

  res.json({
    success: true,
    data: state,
  });
});

/**
 * Get Orchestrator Events Stream
 */
router.get('/events', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const events = db.prepare(`
    SELECT * FROM orchestrator_events 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 25
  `).all(userId) as any[];

  res.json({
    success: true,
    data: events,
  });
});

export default router;
