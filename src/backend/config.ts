import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'moneyplughub-cosmic-secure-jwt-2026-secret-key',
  jwtExpiresIn: '7d',
  
  // Real money commission configuration: $10.00 = 1000 cents per referral
  commissionAmountUsd: parseFloat(process.env.COMMISSION_AMOUNT_USD || '10.00'),
  get commissionAmountCents(): number {
    return Math.round(this.commissionAmountUsd * 100);
  },
  
  // Durable database persistence path
  dbPath: process.env.DB_PATH 
    ? path.resolve(process.env.DB_PATH) 
    : path.resolve(process.cwd(), 'data', 'moneyplughub.db'),

  // Initial Admin Seeder
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@moneyplughub.local',
    password: process.env.ADMIN_PASSWORD || 'AdminSecret2026!',
    displayName: process.env.ADMIN_DISPLAY_NAME || 'Primary Auditor',
  },

  // Clerk Authentication Configuration
  clerk: {
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY || 'pk_test_moneyplughub_clerk_2026',
    secretKey: process.env.CLERK_SECRET_KEY || 'sk_test_moneyplughub_clerk_secret_2026',
    jwtKey: process.env.CLERK_JWT_KEY || '',
  },

  // Stripe Billing & Webhook Sentinel
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_stripe_moneyplughub_2026',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_stripe_moneyplughub_2026',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_moneyplughub_webhook_2026',
  },

  // Payout Processor & Automated ACH/Crypto rails
  payouts: {
    processorKey: process.env.PAYOUT_PROCESSOR_KEY || 'pay_proc_test_moneyplughub_2026',
    provider: process.env.PAYOUT_PROVIDER || 'stripe_connect',
  },

  // Database Connection URL (Postgres/Planetscale/Supabase adapter fallback or local WAL SQLite)
  databaseUrl: process.env.DATABASE_URL || '',

  // ElevenLabs AI Voice Synthesis
  elevenLabs: {
    get apiKey(): string {
      return process.env.ELEVENLABS_API_KEY || '';
    },
    get voiceId(): string {
      return process.env.ELEVENLABS_VOICE_ID || 'm6Q2NTc6q5ldaHnwzSDp';
    },
    get modelId(): string {
      return process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5';
    },
    get isEnabled(): boolean {
      const key = process.env.ELEVENLABS_API_KEY || '';
      return key.length > 10;
    },
  },
};
