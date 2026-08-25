import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ReferralAgent } from '../agents/referralAgent';
import { CanonicalDailySuggestion, ContentEngineItem, ReferralAgentEvent } from '../../types';

const router = Router();

/**
 * Trigger Daily Referral Suggestion & Content Bridge (manual: user_command)
 */
router.post('/suggest', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { preferredSlug } = req.body;

  const result = await ReferralAgent.runDailySuggestion(userId, 'manual: user_command', preferredSlug);

  if (result.success) {
    db.prepare('UPDATE users SET xp = xp + 50, updated_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      userId
    );
  }

  res.json({
    success: result.success,
    data: {
      suggestion: result.suggestion,
      script: result.script,
    },
    event: result.event,
    message: result.message,
    reward_xp: result.success ? 50 : 0,
  });
});

/**
 * Get Canonical Referral Suggestions (context.world.referralSuggestions)
 */
router.get('/suggestions', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const suggestions = db.prepare(`
    SELECT 
      id as suggestionId,
      program,
      suggested_action as suggestedAction,
      reason,
      timestamp
    FROM referral_suggestions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(userId) as unknown as CanonicalDailySuggestion[];

  res.json({
    success: true,
    data: suggestions,
  });
});

/**
 * Get Content Engine Scripts Database
 */
router.get('/content-engine', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const scripts = db.prepare(`
    SELECT 
      id,
      suggestion_id as suggestionId,
      program,
      hook,
      script,
      cta,
      cta_link as ctaLink,
      platform,
      status,
      created_at as createdAt,
      posted_at as postedAt
    FROM content_engine_scripts 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(userId) as unknown as ContentEngineItem[];

  res.json({
    success: true,
    data: scripts,
  });
});

/**
 * Mark Script as Posted (Event: referral.content_posted)
 */
router.post('/content-engine/:id/post', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const scriptId = req.params.id;

  const result = ReferralAgent.markContentPosted(userId, scriptId);
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  // Award +100 XP for posting referral content!
  db.prepare('UPDATE users SET xp = xp + 100, updated_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    userId
  );

  res.json({
    success: true,
    message: 'Content marked as Posted! Emitted referral.content_posted (+100 XP)',
    reward_xp: 100,
  });
});

/**
 * Update Referral Program Link with Invariant URL Check
 */
router.patch('/programs/:slug', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const slug = req.params.slug;
  const { link } = req.body;

  if (!link) {
    res.status(400).json({ success: false, error: 'Link is required' });
    return;
  }

  const result = ReferralAgent.updateLink(userId, slug, link);
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    message: `Updated link for ${slug} and emitted referral.link_updated`,
  });
});

/**
 * Get Referral Agent Events Stream
 */
router.get('/events', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const events = db.prepare(`
    SELECT * FROM referral_agent_events 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 25
  `).all(userId) as unknown as ReferralAgentEvent[];

  res.json({
    success: true,
    data: events,
  });
});

export default router;
