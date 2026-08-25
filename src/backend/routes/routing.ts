import { Router, Request, Response } from 'express';
import { db, runInTransaction } from '../db';
import { CryptoReferralProgram } from '../../types';

const router = Router();

/**
 * Public Click Redirect Engine: /go/:slug
 * Looks up slug, logs click analytics, and redirects to referral destination.
 */
router.get('/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug.trim().toLowerCase();
  const source = (req.query.src as string) || (req.query.source as string) || 'direct';
  const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = new Date().toISOString();

  const program = db.prepare(`
    SELECT * FROM crypto_referral_programs 
    WHERE slug = ? COLLATE NOCASE
  `).get(slug) as unknown as CryptoReferralProgram | undefined;

  if (!program) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Program Not Found | MoneyPlugHub</title></head>
        <body style="background:#0a0d14;color:#f87171;font-family:sans-serif;padding:40px;text-align:center;">
          <h2>Referral Program Not Found</h2>
          <p>The slug <code>${slug}</code> does not exist.</p>
          <a href="/" style="color:#00ff88;">Return to MoneyPlugHub</a>
        </body>
      </html>
    `);
    return;
  }

  // Record Click & Increment Total Analytics in SQLite
  try {
    runInTransaction(() => {
      // 1. Increment program total clicks
      db.prepare(`
        UPDATE crypto_referral_programs 
        SET total_clicks = total_clicks + 1 
        WHERE id = ?
      `).run(program.id);

      // 2. Log click entry
      const clickId = `clk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO program_clicks (id, program_id, slug, source, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(clickId, program.id, slug, source, ipAddress, now);
    });
  } catch (err) {
    console.error('Failed to log click event:', err);
  }

  // 302 Redirect to destination affiliate program URL
  res.redirect(302, program.destination_url);
});

export default router;
