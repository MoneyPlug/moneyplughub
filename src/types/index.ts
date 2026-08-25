export type UserRole = 'user' | 'admin';
export type CommissionStatus = 'pending' | 'approved' | 'paid';

export type AccountType = 'bank' | 'crypto' | 'investment' | 'cash' | 'credit_card' | 'loan';
export type TransactionType = 'expense' | 'income' | 'transfer' | 'debt_payment' | 'crypto_buy' | 'reward';
export type GoalCategory = 'emergency_fund' | 'crypto' | 'savings' | 'purchase' | 'investment';
export type TaskCategory = 'budget' | 'crypto' | 'referral' | 'learning' | 'debt' | 'savings';
export type TaskStatus = 'available' | 'completed' | 'claimed';
export type CryptoCurrency = 'USDC' | 'SOL' | 'BTC' | 'ETH' | 'MPH';
export type EarningsWindow = 'daily' | 'weekly' | 'monthly';

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  referral_code: string;
  referrer_user_id: string | null;
  referral_count: number;
  xp: number;
  level: number;
  streak_days: number;
  tier_title: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithStats extends User {
  stats: {
    referral_count: number;
    pending_amount_cents: number;
    approved_amount_cents: number;
    paid_amount_cents: number;
    total_earned_cents: number;
  };
}

export interface CommissionEntry {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  amount_cents: number;
  currency: string;
  status: CommissionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  referrer_name?: string;
  referrer_email?: string;
  referred_name?: string;
  referred_email?: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance_cents: number;
  currency: string;
  institution: string;
  is_liability: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  account_name?: string;
  category: string;
  type: TransactionType;
  amount_cents: number;
  description: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
}

export interface BudgetCategory {
  id: string;
  user_id: string;
  category: string;
  monthly_limit_cents: number;
  spent_cents?: number;
  month: string;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  total_balance_cents: number;
  minimum_payment_cents: number;
  interest_rate: number;
  due_date: string;
  strategy: 'snowball' | 'avalanche';
  created_at: string;
  updated_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  category: GoalCategory;
  target_cents: number;
  current_cents: number;
  target_date: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringBill {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount_cents: number;
  frequency: 'monthly' | 'annual' | 'weekly';
  next_due_date: string;
  created_at: string;
}

export interface QuestTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  reward_cents: number;
  reward_xp: number;
  task_type: 'daily' | 'one_time' | 'milestone';
  is_active: boolean;
  user_status?: TaskStatus;
}

export interface CryptoWallet {
  id: string;
  user_id: string;
  currency: CryptoCurrency;
  balance: number;
  usd_value_cents: number;
  address: string;
  created_at: string;
}

export interface CryptoLedgerTx {
  id: string;
  user_id: string;
  tx_hash: string;
  tx_type: 'reward' | 'deposit' | 'transfer' | 'referral_payout' | 'budget_bonus';
  currency: CryptoCurrency;
  amount: number;
  usd_value_cents: number;
  from_address: string;
  to_address: string;
  status: 'confirmed' | 'pending';
  notes: string;
  created_at: string;
}

export interface ReferralHubApp {
  id: string;
  name: string;
  slug: string;
  referral_url: string;
  earnings_today_cents: number;
  earnings_month_cents: number;
  total_earnings_cents: number;
  bonus_desc: string;
  total_clicks: number;
  status: 'active' | 'paused';
  tags: string[];
  category: string;
  created_at: string;
  updated_at?: string;
}

export interface CryptoReferralProgram {
  id: string;
  name: string;
  slug: string;
  destination_url: string;
  bonus_desc: string;
  total_clicks: number;
  status: 'active' | 'paused';
  tags: string[];
  category: string;
  created_at: string;
  updated_at?: string;
}

export interface ProgramClick {
  id: string;
  program_id: string;
  slug: string;
  source: 'app' | 'web' | 'unknown' | string;
  campaign: string | null;
  ip_address: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  xp: number;
  level: number;
  tier_title: string;
  streak_days: number;
  net_worth_cents: number;
  referral_count: number;
  is_current_user?: boolean;
}

export interface NetWorthSummary {
  total_assets_cents: number;
  total_liabilities_cents: number;
  net_worth_cents: number;
  budget_limit_cents: number;
  budget_spent_cents: number;
  budget_remaining_cents: number;
  emergency_fund_target_cents: number;
  emergency_fund_current_cents: number;
  total_debt_cents: number;
  xp: number;
  level: number;
  streak_days: number;
  tier_title: string;
}

// Canonical Referral Hub (v1.0) Schemas
export interface CanonicalReferralProgram {
  program: string;
  link: string;
  status: 'active' | 'paused';
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CanonicalClickEvent {
  clickId: string;
  program: string;
  timestamp: string; // ISO
  source: 'app' | 'web' | 'unknown';
  campaign: string | null;
}

export interface CanonicalFunnelTemplate {
  templateId: string;
  program: string;
  steps: string[];
  updatedAt: string; // ISO
}

export interface CanonicalDailySuggestion {
  suggestionId: string;
  program: string;
  suggestedAction: string;
  reason: string;
  timestamp: string; // ISO
}

// Content Engine Connected Schema
export interface ContentEngineItem {
  id: string;
  suggestionId: string;
  program: string;
  hook: string;
  script: string;
  cta: string;
  ctaLink: string;
  platform: string;
  status: 'Idea' | 'Script Ready' | 'Posted';
  createdAt: string;
  postedAt?: string | null;
}

export interface ReferralAgentEvent {
  id: string;
  user_id: string;
  event_type: 
    | 'referral.suggestion_created'
    | 'referral.link_updated'
    | 'referral.error'
    | 'content.idea_created'
    | 'content.script_ready'
    | 'referral.content_posted';
  payload: string;
  created_at: string;
}

// Canonical Automation Schemas (AutomationAgent)
export interface CanonicalAutomationToggle {
  automationId: string;
  name: string;
  schedule: string;
  enabled: boolean;
}

export interface CanonicalRunLog {
  runId: string;
  automationId: string;
  status: 'success' | 'failure';
  startedAt: string;
  endedAt: string;
  error: string | null;
}

export interface AutomationEvent {
  id: string;
  user_id: string;
  event_type: 'automation.run_started' | 'automation.run_completed' | 'automation.run_failed';
  payload: string;
  created_at: string;
}

// Canonical Insight Schema (InsightAgent)
export interface CanonicalInsight {
  insightId: string;
  date: string;
  summary: string;
  suggestions: string[];
  timestamp: string;
}

export interface InsightEvent {
  id: string;
  user_id: string;
  event_type: 'insight.generated' | 'insight.failed';
  payload: string;
  created_at: string;
}

// Canonical Orchestrator Schemas (StarterOrchestrator v1.0)
export type OrchestratorStatus = 'operational' | 'degraded' | 'cooldown' | 'busy';
export type OrchestratorTask = 
  | 'balance_pull' 
  | 'earnings_calc' 
  | 'referral_suggest' 
  | 'automation_tick' 
  | 'insight_generate' 
  | 'daily_loop';

export interface OrchestratorState {
  status: OrchestratorStatus;
  activeRuns: number;
  consecutiveFailures: number;
  lastRunAt: string | null;
  maxConcurrent: number;
  cooldownSeconds: number;
  degradedReason: string | null;
}

export interface OrchestratorEvent {
  id: string;
  user_id: string;
  event_type: 
    | 'orchestrator.task_routed'
    | 'orchestrator.command_received'
    | 'orchestrator.degraded'
    | 'orchestrator.recovered';
  payload: string;
  created_at: string;
}

export interface BalanceEvent {
  id: string;
  user_id: string;
  event_type: 'balance.pull_started' | 'balance.pull_completed' | 'balance.pull_failed';
  payload: string;
  created_at: string;
}

export interface CanonicalBalance {
  accountId: string;
  provider: string;
  balance: number;
  currency: string;
  asOf: string;
}

export interface ConnectedProvider {
  id: string;
  user_id: string;
  provider_name: string;
  provider_type: 'bank' | 'crypto' | 'brokerage' | 'card';
  status: 'connected' | 'disconnected' | 'error';
  last_sync_at: string | null;
  created_at: string;
}

export interface CanonicalEarnings {
  window: EarningsWindow;
  start: string;
  end: string;
  gross: number;
  net: number;
  currency: string;
  computedAt: string;
}

export interface EarningsEvent {
  id: string;
  user_id: string;
  event_type: 'earnings.compute_started' | 'earnings.compute_completed' | 'earnings.compute_failed';
  payload: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  actor_email?: string;
  action: string;
  target_entity: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_referrals: number;
  total_commissions_count: number;
  pending_commissions_count: number;
  approved_commissions_count: number;
  paid_commissions_count: number;
  total_pending_cents: number;
  total_approved_cents: number;
  total_paid_cents: number;
  total_volume_cents: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── Creator Syndicates & Guild Wars System Schemas ──
export interface Syndicate {
  id: string;
  name: string;
  tag: string;
  emblem_sigil: string;
  description: string;
  creator_id: string;
  total_net_worth_cents: number;
  total_referrals: number;
  weekly_score: number;
  streak_days: number;
  member_count: number;
  created_at: string;
  rank?: number;
  creator_name?: string;
  is_user_syndicate?: boolean;
}

export interface SyndicateMember {
  id: string;
  syndicate_id: string;
  user_id: string;
  role: 'founder' | 'officer' | 'member';
  contributed_xp: number;
  joined_at: string;
  display_name?: string;
  email?: string;
  tier_title?: string;
  level?: number;
}

export interface CommunalBuff {
  active: boolean;
  name: string;
  multiplier: number;
  badge: string;
  description: string;
  expires_in_hours: number;
  perks: string[];
}

export interface GuildWarStatus {
  season: string;
  round: number;
  ends_in_days: number;
  rank: number | null;
  weekly_target_score: number;
  prize_pool_cents: number;
  leaderboard_summary: {
    first_place_tag: string;
    first_place_name: string;
    first_place_score: number;
    user_syndicate_gap: number;
  };
}

export interface MySyndicateResponse {
  syndicate: Syndicate | null;
  membership: SyndicateMember | null;
  communal_buff: CommunalBuff;
  war_status: GuildWarStatus;
}


export type AchievementTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond Apex';
export type AchievementCategory = 'Voice AI' | 'Viral Growth' | 'Wealth Vault' | 'Sigil Mastery' | 'Syndicates';

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  reward_xp: number;
  reward_cents: number;
  target_value: number;
  current_value?: number;
  progress_pct?: number;
  is_unlocked?: boolean;
  unlocked_at?: string | null;
  is_claimed?: boolean;
}

export interface AchievementsSummary {
  total_unlocked: number;
  total_achievements: number;
  total_claimed: number;
  prestige_score: number;
  max_prestige_score: number;
  next_milestone: Achievement | null;
}

export interface AchievementsResponseData {
  achievements: Achievement[];
  summary: AchievementsSummary;
}

