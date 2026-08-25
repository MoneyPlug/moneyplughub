import { Router, Request, Response } from 'express';
import { db, runInTransaction } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { 
  CanonicalReferralProgram, 
  CanonicalClickEvent, 
  CanonicalFunnelTemplate, 
  CanonicalDailySuggestion 
} from '../../types';

const router = Router();

/**
 * Get Canonical Referral Programs (Canonical Referral Program Schema)
 */
router.get('/programs', (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT 
      name as program,
      destination_url as link,
      status,
      tags,
      created_at as createdAt,
      updated_at as updatedAt
    FROM crypto_referral_programs 
    ORDER BY 
      CASE name 
        WHEN 'Cash App' THEN 1 
        WHEN 'Upside' THEN 2 
        WHEN 'Fetch' THEN 3 
        WHEN 'Webull' THEN 4 
        WHEN 'Robinhood' THEN 5 
        ELSE 6 
      END ASC, 
      total_clicks DESC
  `).all() as any[];

  const programs: CanonicalReferralProgram[] = rows.map(r => ({
    program: r.program,
    link: r.link,
    status: r.status,
    tags: (r.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt || r.createdAt,
  }));

  res.json({
    success: true,
    data: programs,
  });
});

/**
 * Add / Update Referral Program (Invariant 1: Unique name, Invariant 2: Valid URL)
 */
router.post('/programs', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { program, link, status = 'active', tags = [], bonus_desc = '' } = req.body;

  if (!program || !link) {
    res.status(400).json({ success: false, error: 'program name and link are required' });
    return;
  }

  // INVARIANT 2: Links must be valid URLs
  try {
    new URL(link);
  } catch {
    res.status(400).json({ success: false, error: `Invariant Violation: Invalid URL format (${link})` });
    return;
  }

  const slug = program.toLowerCase().replace(/[^a-z0-9]/g, '');
  const now = new Date().toISOString();
  const tagsStr = Array.isArray(tags) ? tags.join(',') : tags;

  try {
    runInTransaction(() => {
      db.prepare(`
        INSERT INTO crypto_referral_programs (
          id, name, slug, destination_url, bonus_desc, status, tags, category, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, 'finance', ?, ?
        )
        ON CONFLICT(name) DO UPDATE SET
          destination_url = excluded.destination_url,
          bonus_desc = COALESCE(NULLIF(excluded.bonus_desc, ''), crypto_referral_programs.bonus_desc),
          status = excluded.status,
          tags = excluded.tags,
          updated_at = excluded.updated_at
      `).run(`prog_${slug}`, program, slug, link, bonus_desc, status, tagsStr, now, now);
    });

    res.json({
      success: true,
      message: `Program ${program} saved successfully.`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * Update Program Link / Status / Tags
 */
router.patch('/programs/:slug', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { slug } = req.params;
  const { referral_url, status, tags } = req.body;

  if (referral_url) {
    try {
      new URL(referral_url);
    } catch {
      res.status(400).json({ success: false, error: `Invariant Violation: Invalid URL format (${referral_url})` });
      return;
    }
  }

  const prog = db.prepare('SELECT * FROM crypto_referral_programs WHERE slug = ?').get(slug) as any;
  if (!prog) {
    res.status(404).json({ success: false, error: 'Program not found' });
    return;
  }

  const newUrl = referral_url || prog.destination_url;
  const newStatus = status || prog.status;
  const newTags = tags ? (Array.isArray(tags) ? tags.join(',') : tags) : prog.tags;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE crypto_referral_programs 
    SET destination_url = ?, status = ?, tags = ?, updated_at = ?
    WHERE slug = ?
  `).run(newUrl, newStatus, newTags, now, slug);

  res.json({
    success: true,
    message: `Updated program ${prog.name}`,
  });
});

/**
 * Get Canonical Funnel Templates
 */
router.get('/funnels', (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT 
      id as templateId,
      program,
      steps_json,
      updated_at as updatedAt
    FROM funnel_templates 
    ORDER BY 
      CASE program 
        WHEN 'Cash App' THEN 1 
        WHEN 'Upside' THEN 2 
        WHEN 'Fetch' THEN 3 
        WHEN 'Webull' THEN 4 
        WHEN 'Robinhood' THEN 5 
        ELSE 6 
      END ASC
  `).all() as any[];

  const funnels: CanonicalFunnelTemplate[] = rows.map(r => ({
    templateId: r.templateId,
    program: r.program,
    steps: JSON.parse(r.steps_json || '[]'),
    updatedAt: r.updatedAt,
  }));

  res.json({
    success: true,
    data: funnels,
  });
});

/**
 * Add / Update Funnel Template
 */
router.post('/funnels', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { program, steps } = req.body;

  if (!program || !Array.isArray(steps) || steps.length === 0) {
    res.status(400).json({ success: false, error: 'program and steps array required' });
    return;
  }

  const slug = program.toLowerCase().replace(/\s+/g, '');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO funnel_templates (id, program, steps_json, updated_at, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(program) DO UPDATE SET
      steps_json = excluded.steps_json,
      updated_at = excluded.updated_at
  `).run(`tmpl_${slug}`, program, JSON.stringify(steps), now, now);

  res.json({
    success: true,
    message: `Funnel template for ${program} saved.`,
  });
});

/**
 * Track Click Event (Canonical Click Event Schema)
 */
router.post('/track-click', (req: Request, res: Response) => {
  const { slug, source = 'unknown', campaign = null } = req.body;

  const validSource = ['app', 'web', 'unknown'].includes(source) ? source : 'unknown';
  const prog = db.prepare('SELECT * FROM crypto_referral_programs WHERE slug = ?').get(slug) as any;

  if (!prog) {
    res.status(404).json({ success: false, error: 'Program slug not found' });
    return;
  }

  const clickId = `clk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  runInTransaction(() => {
    db.prepare(`
      INSERT INTO program_clicks (id, program_id, slug, source, campaign, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(clickId, prog.id, slug, validSource, campaign, req.ip || '127.0.0.1', now);

    db.prepare(`
      UPDATE crypto_referral_programs SET total_clicks = total_clicks + 1 WHERE id = ?
    `).run(prog.id);
  });

  const clickEvent: CanonicalClickEvent = {
    clickId,
    program: prog.name,
    timestamp: now,
    source: validSource as 'app' | 'web' | 'unknown',
    campaign,
  };

  res.json({
    success: true,
    data: clickEvent,
  });
});

/**
 * Get Click Events Log
 */
router.get('/clicks', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const rows = db.prepare(`
    SELECT 
      c.id as clickId,
      p.name as program,
      c.created_at as timestamp,
      c.source,
      c.campaign
    FROM program_clicks c
    JOIN crypto_referral_programs p ON p.id = c.program_id
    ORDER BY c.created_at DESC 
    LIMIT 50
  `).all() as unknown as CanonicalClickEvent[];

  res.json({
    success: true,
    data: rows,
  });
});

/**
 * Get Append-Only Daily Referral Suggestions (Invariant 3: Append-Only)
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
    LIMIT 30
  `).all(userId) as unknown as CanonicalDailySuggestion[];

  res.json({
    success: true,
    data: suggestions,
  });
});

/**
 * Standard Referral Apps Matrix (for legacy views)
 */
router.get('/', (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT 
      id, name, slug, destination_url as referral_url,
      bonus_desc, earnings_today_cents, earnings_month_cents, total_earnings_cents,
      total_clicks, status, tags, category, created_at, updated_at
    FROM crypto_referral_programs 
    ORDER BY 
      CASE name 
        WHEN 'Cash App' THEN 1 
        WHEN 'Upside' THEN 2 
        WHEN 'Fetch' THEN 3 
        WHEN 'Webull' THEN 4 
        WHEN 'Robinhood' THEN 5 
        ELSE 6 
      END ASC, 
      total_clicks DESC
  `).all() as any[];

  res.json({
    success: true,
    data: rows.map(r => ({
      ...r,
      tags: (r.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
    })),
  });
});

/**
 * Verify / Health Check Live URL
 */
router.post('/verify-url', async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ success: false, error: 'URL is required' });
    return;
  }

  try {
    new URL(url);
  } catch {
    res.status(400).json({ success: false, error: 'Invalid URL format' });
    return;
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        url,
        status: response.status,
        statusText: response.statusText,
        finalUrl: response.url,
        isLive: response.status >= 200 && response.status < 400,
        latencyMs,
      },
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    res.json({
      success: true,
      data: {
        url,
        status: 0,
        statusText: err.name === 'AbortError' ? 'Timeout (6s)' : err.message,
        finalUrl: url,
        isLive: false,
        latencyMs,
      },
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  2026 CONTEXTUAL TRUST & DUAL-ENGINE MATRIX
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/referral-hub/trust-engine/models
 * Returns the 2026 Dual-Engine comparison model (High-Ticket vs High-Volume)
 */
router.get('/trust-engine/models', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      highTicketEngine: {
        name: 'High-Ticket Engine',
        tagline: 'Authority Deep-Dives & Educational Solution Stacks',
        idealNiche: 'SaaS, Finance, Ed-Tech, AI Infrastructure',
        commissionRange: '$200 – $1,500+ per sale',
        conversionRate: '0.5% – 2.0%',
        salesCycle: '7 – 30 days',
        primaryChannels: ['Newsletters (Substack/Beehiiv)', 'Webinars & Live Demos', 'In-Depth Case Studies', 'Workflow Teardowns'],
        strategyPillars: [
          'Solve expensive bottlenecks with verified software tools',
          'Publish transparent ROI calculations and case studies',
          'Niche authority determines conversion velocity',
          'Zero hype, 100% technical and operational credibility'
        ],
        badgeColor: '#a855f7',
      },
      highVolumeEngine: {
        name: 'High-Volume Engine',
        tagline: 'Psychological Hooks & Rapid-Fire Lifestyle Integrations',
        idealNiche: 'Cashback Packs, Gas Rewards, Lifestyle Apps, Creator Tools',
        commissionRange: '$1 – $20 per conversion',
        conversionRate: '5.0% – 15.0%',
        salesCycle: '< 24 hours (Instant Impulse)',
        primaryChannels: ['TikTok Shop & Viral UGC', 'Instagram Reels', 'YouTube Shorts', 'Live Streams'],
        strategyPillars: [
          'Pattern-interrupt psychological hooks in first 3 seconds',
          'Seamless daily habit integration (gas, groceries, cashbacks)',
          'Clear FOMO + starter cash incentives',
          'Automated Disclosure AI compliance stamps'
        ],
        badgeColor: '#00ff88',
      },
    }
  });
});

/**
 * GET /api/referral-hub/trust-engine/pain-points
 * Returns the Contextual Problem-Solver Matrix mapping financial pain points to trusted recommendations
 */
router.get('/trust-engine/pain-points', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'pp_spreadsheets',
        category: 'Financial Architecture',
        painPoint: 'Tired of manual, outdated budgeting spreadsheets in 2026',
        targetAudience: 'Creators, Freelancers & Solopreneurs',
        recommendedSolution: 'MoneyPlugHub / Creator Money OS',
        solutionType: 'High-Ticket / Operating System',
        commissionPotential: '$10 – $149/mo recurring (20-40%)',
        contextualHook: 'Stop tracking your wealth in static spreadsheets. Upgrade to a living, autonomous financial OS that executes commands by voice and visualizes net worth compounding in real-time.',
        problemSolvingScript: `Are you still spending hours every Sunday updating messy Excel or Google sheets that don't even link to your cashflow?

In 2026, spreadsheets have 0% intelligence. With Creator Money OS, your vault breathes with your actual ARR, your debts are eliminated mathematically with the Avalanche engine, and ElevenLabs voice AI executes transfers hands-free.

Try the free starter tier or explore the Living Vault with code [YOUR_CODE].`,
        disclosureWatermark: '#ad #affiliate Tested & powered by MoneyPlugHub OS. Commission may be earned.',
      },
      {
        id: 'pp_debt_interest',
        category: 'Liability Elimination',
        painPoint: 'High credit card interest (24%+ APR) eating cashflow',
        targetAudience: 'Debt-burdened Creators & Consumers',
        recommendedSolution: 'Debt Avalanche Eliminator + 0% Balance Transfer Card',
        solutionType: 'High-Volume & High-Ticket Hybrid',
        commissionPotential: '$50 – $200 per card activation',
        contextualHook: 'Paying minimum payments is a mathematical trap designed to keep you broke for 14 years. Here is the exact zero-sum formula to crush debt in 11 months.',
        problemSolvingScript: `Credit card companies make billions when you pay interest. The Avalanche Method targets your highest APR card first while maintaining minimums on the rest, mathematically saving thousands in interest charges.

Plug your balances into our free Debt Eliminator simulator to get your exact debt-free date.`,
        disclosureWatermark: '#ad Financial tool recommendation. Not financial advice. FTC compliant.',
      },
      {
        id: 'pp_gas_inflation',
        category: 'Daily Living Expenses',
        painPoint: 'Full price on gas, dining, and daily creator travel',
        targetAudience: 'Everyday Drivers, Delivery & Commuters',
        recommendedSolution: 'Upside Cashback App + Rakuten',
        solutionType: 'High-Volume Engine',
        commissionPotential: '$5 – $30 instant per invite',
        contextualHook: 'Never pay full retail price at the gas pump or grocery store again. Turn routine fuel expenses into automated cashback loops.',
        problemSolvingScript: `Gas prices fluctuate daily, but paying full price at the pump is completely optional. Upside gives you up to $0.25/gallon cash back directly to your bank or PayPal at thousands of stations nationwide.

I use this on every road trip and tank fill-up. Claim a starter bonus on your first fill-up using my link.`,
        disclosureWatermark: '#ad #affiliate Partner sponsored link. Cashback rates subject to location.',
      },
      {
        id: 'pp_idle_cash',
        category: 'Wealth Compounding',
        painPoint: 'Cash sitting in 0.01% checking accounts losing 3% to inflation',
        targetAudience: 'Savers, Creators with business reserves',
        recommendedSolution: 'High-Yield Savings (HYSA) / Treasury Vault',
        solutionType: 'High-Ticket Engine',
        commissionPotential: '$50 – $150 per verified account',
        contextualHook: 'If your emergency fund or tax reserve is sitting in a traditional checking account, you are literally giving away hundreds in free annual interest.',
        problemSolvingScript: `Traditional banks pay you 0.01% on your deposits while lending your money at 7%. A High-Yield Cash Account compounds at 4.5% to 5.0%+ APY with FDIC insurance.

On a $10,000 reserve, that is an extra $500/year in pure passive compounding with zero market risk.`,
        disclosureWatermark: '#ad #sponsored FDIC insured partner institution. Terms apply.',
      }
    ]
  });
});

/**
 * POST /api/referral-hub/trust-engine/disclosure-stamp
 * Generates FTC 16 CFR Part 255 compliant watermarks & Disclosure AI tags
 */
router.post('/trust-engine/disclosure-stamp', (req: Request, res: Response) => {
  const { platform = 'tiktok', programName = 'MoneyPlugHub', link = '' } = req.body;

  const platformSpecs: Record<string, { tag: string; statement: string; placement: string }> = {
    tiktok: {
      tag: '#ad #affiliate #sponsored',
      statement: `[Paid Ad / Affiliate Partner: ${programName}] I earn a commission if you sign up using this link at no extra cost to you.`,
      placement: 'Must appear in the first 2 lines of video caption and on-screen text overlay during mention.',
    },
    youtube: {
      tag: '#ad #affiliate',
      statement: `Disclosure: This video/description contains affiliate links for ${programName}. If you make a purchase, I may receive a commission without any additional cost to you.`,
      placement: 'Check the "Paid Promotion" toggle in YouTube Studio + place disclosure in top 3 lines of description.',
    },
    twitter: {
      tag: '#ad #affiliate',
      statement: `Ad: Using code [REF_CODE] for ${programName} supports my independent creator research at no extra cost.`,
      placement: 'Include #ad directly in the initial tweet containing the link.',
    },
    newsletter: {
      tag: '[Partner Disclosure]',
      statement: `Transparency Notice: Some links in this issue are affiliate partnerships for ${programName}. We only recommend tools we have tested and verified.`,
      placement: 'Place directly above the recommendation block or in the newsletter header.',
    }
  };

  const spec = platformSpecs[platform.toLowerCase()] || platformSpecs.tiktok;

  res.json({
    success: true,
    data: {
      platform,
      programName,
      disclosureTag: spec.tag,
      formalStatement: spec.statement,
      complianceRule: spec.placement,
      ftcStandard: 'FTC 16 CFR Part 255 (Guides Concerning Use of Endorsements and Testimonials)',
      formattedCopy: `${spec.statement}\nLink: ${link || 'https://moneyplughub.com'}\n${spec.tag}`,
    }
  });
});

export default router;
