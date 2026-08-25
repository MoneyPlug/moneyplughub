import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db, runInTransaction, recordAuditLog, initializeUserFinancialProfile } from '../db';
import { config } from '../config';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { User, AuthResponse, ApiResponse } from '../../types';
import { attributeReferralConversion } from './referrals';
import { processReferralEvent } from './growth';

const router = Router();

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  referral_code: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function generateReferralCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'PLUG-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Public: Validate referral code before registration
 */
router.get('/validate-ref/:code', (req: Request, res: Response) => {
  const code = req.params.code.trim();
  const referrer = db.prepare(`
    SELECT id, display_name, referral_code 
    FROM users 
    WHERE referral_code = ? COLLATE NOCASE
  `).get(code) as unknown as { id: string; display_name: string; referral_code: string } | undefined;

  if (!referrer) {
    res.status(404).json({ success: false, error: 'Referral code not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      referrer_name: referrer.display_name,
      referral_code: referrer.referral_code,
      bonus_amount_usd: config.commissionAmountUsd,
    }
  });
});

/**
 * Register a new user with optional referral code
 */
router.post('/register', (req: Request, res: Response) => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ 
      success: false, 
      error: parseResult.error.errors.map(e => e.message).join(', ') 
    });
    return;
  }

  const { email, password, display_name, referral_code } = parseResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already registered
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existingUser) {
    res.status(409).json({ success: false, error: 'Email is already registered. Please log in.' });
    return;
  }

  // Find referrer if code was provided
  let referrer: User | undefined;
  if (referral_code && referral_code.trim()) {
    referrer = db.prepare(`
      SELECT id, email, display_name, referral_code, referral_count 
      FROM users 
      WHERE referral_code = ? COLLATE NOCASE
    `).get(referral_code.trim()) as unknown as User | undefined;
  }

  let newUserCode = generateReferralCode();
  while (db.prepare('SELECT id FROM users WHERE referral_code = ?').get(newUserCode)) {
    newUserCode = generateReferralCode();
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  try {
    runInTransaction(() => {
      // 1. Insert User with initial starter XP
      db.prepare(`
        INSERT INTO users (
          id, email, password_hash, display_name, role, referral_code, 
          referrer_user_id, referral_count, xp, level, streak_days, tier_title, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'user', ?, ?, 0, 100, 1, 1, 'Novice Plug', ?, ?)
      `).run(
        userId,
        normalizedEmail,
        passwordHash,
        display_name.trim(),
        newUserCode,
        referrer ? referrer.id : null,
        now,
        now
      );

      // 2. If valid referrer exists, record referral and create real commission entry + XP bonus for referrer
      if (referrer) {
        db.prepare(`
          UPDATE users 
          SET referral_count = referral_count + 1, xp = xp + 350, updated_at = ? 
          WHERE id = ?
        `).run(now, referrer.id);

        const commissionId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        db.prepare(`
          INSERT INTO commission_ledger (
            id, referrer_user_id, referred_user_id, amount_cents, 
            currency, status, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'USD', 'pending', ?, ?, ?)
        `).run(
          commissionId,
          referrer.id,
          userId,
          config.commissionAmountCents,
          `Commission earned from referral: ${display_name.trim()} (${normalizedEmail})`,
          now,
          now
        );

        recordAuditLog(
          userId,
          'REFERRAL_COMMISSION_CREATED',
          'commission_ledger',
          commissionId,
          {
            referrer_id: referrer.id,
            referred_id: userId,
            amount_cents: config.commissionAmountCents,
            status: 'pending'
          }
        );
      }

      // Initialize rich financial profile (bank accounts, crypto wallets, debts, budget categories, goals)
      initializeUserFinancialProfile(userId, normalizedEmail);

      recordAuditLog(
        userId,
        'USER_SIGNUP',
        'users',
        userId,
        { email: normalizedEmail, referred_by: referrer ? referrer.id : null }
      );
    });

    // ── Referral Attribution: Track conversion + fraud check + viral growth mechanics ──
    if (referrer) {
      const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
      attributeReferralConversion(userId, referrer.id, ip);
      try {
        processReferralEvent(referrer.id);
      } catch (growthErr) {
        console.error('Growth event processing error:', growthErr);
      }
    }

    const token = jwt.sign(
      { userId, email: normalizedEmail, role: 'user' },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const user: User = {
      id: userId,
      email: normalizedEmail,
      display_name: display_name.trim(),
      role: 'user',
      referral_code: newUserCode,
      referrer_user_id: referrer ? referrer.id : null,
      referral_count: 0,
      xp: 100,
      level: 1,
      streak_days: 1,
      tier_title: 'Novice Plug',
      created_at: now,
      updated_at: now,
    };

    const responseData: ApiResponse<AuthResponse> = {
      success: true,
      data: { token, user },
      message: referrer 
        ? `Account created! Referral bonus of $${config.commissionAmountUsd.toFixed(2)} + 350 XP recorded for ${referrer.display_name}.`
        : 'Account created with initial starter budget and crypto ledger initialized!'
    };

    res.status(201).json(responseData);
  } catch (err: any) {
    console.error('Registration failed:', err);
    res.status(500).json({ success: false, error: 'Registration failed due to a database error.' });
  }
});

/**
 * Login existing user
 */
router.post('/login', (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ 
      success: false, 
      error: parseResult.error.errors.map(e => e.message).join(', ') 
    });
    return;
  }

  const { email, password } = parseResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = db.prepare(`
    SELECT id, email, password_hash, display_name, role, referral_code, referrer_user_id, referral_count, xp, level, streak_days, tier_title, created_at, updated_at
    FROM users
    WHERE email = ?
  `).get(normalizedEmail) as unknown as (User & { password_hash: string }) | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ success: false, error: 'Invalid email or password.' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { password_hash, ...safeUser } = user;

  recordAuditLog(user.id, 'USER_LOGIN', 'users', user.id, { role: user.role });

  res.json({
    success: true,
    data: {
      token,
      user: safeUser
    }
  });
});

/**
 * Get current session profile with live financial aggregates & XP
 */
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_commissions,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0) as pending_amount_cents,
      COALESCE(SUM(CASE WHEN status = 'approved' THEN amount_cents ELSE 0 END), 0) as approved_amount_cents,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0) as paid_amount_cents,
      COALESCE(SUM(amount_cents), 0) as total_earned_cents
    FROM commission_ledger
    WHERE referrer_user_id = ?
  `).get(user.id) as any;

  res.json({
    success: true,
    data: {
      ...user,
      stats: {
        referral_count: user.referral_count,
        pending_amount_cents: Number(stats?.pending_amount_cents || 0),
        approved_amount_cents: Number(stats?.approved_amount_cents || 0),
        paid_amount_cents: Number(stats?.paid_amount_cents || 0),
        total_earned_cents: Number(stats?.total_earned_cents || 0),
      }
    }
  });
});

/**
 * Clerk Authentication Sync Endpoint
 * Syncs Clerk session data with internal SQLite ACID ledger & deterministic Sigils
 */
router.post('/clerk-sync', (req: Request, res: Response) => {
  try {
    const { clerkId, email, displayName, referralCode } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Email is required for Clerk sync' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    let user = db.prepare(`
      SELECT id, email, display_name, role, referral_code, referrer_user_id, referral_count, xp, level, streak_days, tier_title, created_at, updated_at
      FROM users
      WHERE email = ?
    `).get(normalizedEmail) as any;

    if (!user) {
      // New user from Clerk
      const effectiveId = clerkId ? `usr_clerk_${clerkId.replace(/[^a-zA-Z0-9_]/g, '')}` : `usr_${Date.now()}`;
      
      let referrer: User | undefined;
      const refCode = (referralCode || req.cookies?.mph_ref || '').trim();
      if (refCode) {
        referrer = db.prepare(`
          SELECT id, email, display_name, referral_code, referral_count 
          FROM users 
          WHERE referral_code = ? COLLATE NOCASE
        `).get(refCode) as unknown as User | undefined;
      }

      let newUserCode = generateReferralCode();
      while (db.prepare('SELECT id FROM users WHERE referral_code = ?').get(newUserCode)) {
        newUserCode = generateReferralCode();
      }

      const insertUser = db.prepare(`
        INSERT INTO users (
          id, email, password_hash, display_name, role, referral_code, 
          referrer_user_id, referral_count, xp, level, streak_days, tier_title, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      runInTransaction(() => {
        insertUser.run(
          effectiveId,
          normalizedEmail,
          'CLERK_MANAGED_AUTH',
          displayName?.trim() || normalizedEmail.split('@')[0],
          'user',
          newUserCode,
          referrer ? referrer.id : null,
          0,
          100, // starter XP
          1,
          1,
          'Novice Plug',
          now,
          now
        );

        initializeUserFinancialProfile(effectiveId, normalizedEmail);

        if (referrer) {
          const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
          attributeReferralConversion(effectiveId, referrer.id, ip);
          try {
            processReferralEvent(referrer.id);
          } catch {}
        }
      });

      recordAuditLog(effectiveId, 'CLERK_USER_REGISTERED', 'users', effectiveId, { clerkId, referrer: referrer?.referral_code });

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(effectiveId) as any;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, isClerk: true },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        token,
        user
      }
    });
  } catch (err: any) {
    console.error('Clerk sync error:', err);
    res.status(500).json({ success: false, error: 'Failed to sync Clerk profile with database' });
  }
});

/**
 * Logout
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
