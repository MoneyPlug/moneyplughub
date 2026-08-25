import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { AutomationAgent } from '../agents/automationAgent';
import { CanonicalAutomationToggle, CanonicalRunLog, AutomationEvent } from '../../types';

const router = Router();

/**
 * Trigger Orchestrator Schedule Tick (orchestrator: on_schedule_tick)
 */
router.post('/tick', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { schedule } = req.body; // 'all' | 'daily' | 'weekly' | 'monthly'

  const runLogs = await AutomationAgent.onScheduleTick(userId, schedule || 'all');

  // Award +100 XP for orchestrating automations
  db.prepare('UPDATE users SET xp = xp + 100, updated_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    userId
  );

  res.json({
    success: true,
    data: runLogs,
    message: `Orchestrator executed ${runLogs.length} automations! (+100 XP)`,
    reward_xp: 100,
  });
});

/**
 * Run Individual Automation (manual: user_command)
 */
router.post('/run/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const automationId = req.params.id;

  const runLog = await AutomationAgent.runAutomation(userId, automationId, 'manual: user_command');

  res.json({
    success: runLog.status === 'success',
    data: runLog,
    message: runLog.status === 'success' ? `Automation ${automationId} completed successfully.` : runLog.error,
  });
});

/**
 * Get Canonical Automation Toggles (context.settings.automations)
 */
router.get('/toggles', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const toggles = db.prepare(`
    SELECT 
      automation_id as automationId,
      name,
      schedule,
      CASE WHEN enabled = 1 THEN 1 ELSE 0 END as enabled
    FROM automation_toggles 
    WHERE user_id = ?
    ORDER BY 
      CASE schedule 
        WHEN 'daily' THEN 1 
        WHEN 'weekly' THEN 2 
        WHEN 'monthly' THEN 3 
      END ASC
  `).all(userId) as unknown as CanonicalAutomationToggle[];

  res.json({
    success: true,
    data: toggles.map(t => ({ ...t, enabled: Boolean(t.enabled) })),
  });
});

/**
 * Update Automation Toggle Status
 */
router.patch('/toggles/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const automationId = req.params.id;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    res.status(400).json({ success: false, error: 'enabled boolean required' });
    return;
  }

  AutomationAgent.setToggle(userId, automationId, enabled);

  res.json({
    success: true,
    message: `Automation ${automationId} is now ${enabled ? 'enabled' : 'disabled'}.`,
  });
});

/**
 * Get Canonical Run Logs (context.world.automationRuns)
 */
router.get('/runs', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const runs = db.prepare(`
    SELECT 
      id as runId,
      automation_id as automationId,
      status,
      started_at as startedAt,
      ended_at as endedAt,
      error
    FROM automation_runs 
    WHERE user_id = ? 
    ORDER BY started_at DESC 
    LIMIT 25
  `).all(userId) as unknown as CanonicalRunLog[];

  res.json({
    success: true,
    data: runs,
  });
});

/**
 * Get Automation Agent Events Stream
 */
router.get('/events', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const events = db.prepare(`
    SELECT * FROM automation_events 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 25
  `).all(userId) as unknown as AutomationEvent[];

  res.json({
    success: true,
    data: events,
  });
});

export default router;
