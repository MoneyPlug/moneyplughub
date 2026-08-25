import { db, runInTransaction } from '../db';
import { 
  CanonicalDailySuggestion, 
  CanonicalReferralProgram, 
  ContentEngineItem 
} from '../../types';

export type ReferralAgentTrigger = 'scheduled: daily_referral_suggestion' | 'manual: user_command';

export class ReferralAgent {
  public static readonly agentName = 'ReferralAgent';
  public static readonly capabilities = ['ReadContext', 'WriteContext (world.referrals only)'];

  /**
   * Main Execution Contract for ReferralAgent
   * Creates daily referral suggestions and triggers event bridge to Content Engine.
   */
  public static async runDailySuggestion(
    userId: string, 
    trigger: ReferralAgentTrigger, 
    preferredSlug?: string
  ): Promise<{
    success: boolean;
    suggestion: CanonicalDailySuggestion | null;
    script: ContentEngineItem | null;
    event: 'referral.suggestion_created' | 'referral.error';
    message: string;
  }> {
    const timestamp = new Date().toISOString();

    try {
      // 1. Read Context (Inputs): Active Referral Programs & Clicks
      const programs = db.prepare(`
        SELECT * FROM crypto_referral_programs 
        WHERE status = 'active'
        ORDER BY total_clicks DESC, total_earnings_cents DESC
      `).all() as any[];

      if (programs.length === 0) {
        const errorMsg = 'Invariant Error: No active referral programs found in context.world.referrals.';
        this.recordEvent(userId, 'referral.error', { reason: errorMsg, trigger, timestamp });
        return {
          success: false,
          suggestion: null,
          script: null,
          event: 'referral.error',
          message: errorMsg,
        };
      }

      // INVARIANT 2: Links must be valid URLs
      for (const p of programs) {
        try {
          new URL(p.destination_url);
        } catch {
          const errorMsg = `Invariant Violation: Invalid URL format for program ${p.name}: ${p.destination_url}`;
          this.recordEvent(userId, 'referral.error', { reason: errorMsg, trigger, timestamp });
          return {
            success: false,
            suggestion: null,
            script: null,
            event: 'referral.error',
            message: errorMsg,
          };
        }
      }

      // Select top active program or requested slug
      const selected = preferredSlug 
        ? programs.find(p => p.slug === preferredSlug) || programs[0]
        : programs[0];

      // 2. Formulate Canonical Daily Suggestion
      const suggestionId = `sug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      
      let suggestedAction = `Deploy high-converting short-form video reviewing the ${selected.bonus_desc} welcome offer for ${selected.name}.`;
      let reason = `Top performing program with high conversion velocity (${selected.total_clicks} total clicks tracked).`;

      if (selected.slug === 'rakuten') {
        suggestedAction = `Show your live $30 Rakuten cash back receipt on grocery/delivery orders and explain how viewers get $30 on their first order.`;
        reason = `Instant $30 bonus has the highest cold-traffic conversion rate across TikTok and Reels.`;
      } else if (selected.slug === 'acorns') {
        suggestedAction = `Show how spare change roundups grow passively into investment portfolios with a $5-$1,000 match.`;
        reason = `Passive finance angles trigger high bookmark and share velocity.`;
      } else if (selected.slug === 'upside') {
        suggestedAction = `Film a quick 10-second gas station screen showing real-time 25¢/gal cash back cashouts.`;
        reason = `Gas and commute inflation content drives high link-in-bio clicks.`;
      } else if (selected.category === 'crypto') {
        suggestedAction = `Demonstrate claiming $10 in free Bitcoin upon trading $100 using your /go/${selected.slug} link.`;
        reason = `Free Bitcoin incentives appeal strongly to crypto beginners.`;
      }

      const suggestion: CanonicalDailySuggestion = {
        suggestionId,
        program: selected.name,
        suggestedAction,
        reason,
        timestamp,
      };

      // 3. Write Context (Outputs): Append to referral_suggestions
      runInTransaction(() => {
        db.prepare(`
          INSERT INTO referral_suggestions (id, user_id, program, suggested_action, reason, timestamp, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(suggestionId, userId, suggestion.program, suggestion.suggestedAction, suggestion.reason, suggestion.timestamp, timestamp);
      });

      // Emit Event: referral.suggestion_created
      this.recordEvent(userId, 'referral.suggestion_created', {
        agent: this.agentName,
        trigger,
        suggestionId,
        program: selected.name,
        timestamp,
      });

      // 4. Event Bridge ➔ Content Engine Flow
      // referral.suggestion_created ➔ content.idea_created ➔ content.script_ready
      this.recordEvent(userId, 'content.idea_created', {
        sourceSuggestionId: suggestionId,
        program: selected.name,
        timestamp,
      });

      const scriptId = `script_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const routingLink = `http://localhost:3000/go/${selected.slug}`;
      
      const hookAngle = `Hook: "${reason.replace(' has the highest cold-traffic conversion rate', '')}"`;
      const scriptBody = `POV: You stopped paying full price for daily essentials. ${selected.name} literally gives you ${selected.bonus_desc}. All you do is tap the link in bio, activate in 30 seconds, and claim your sign-up payout.`;
      const ctaCopy = `👉 Tap the link in bio to claim your ${selected.bonus_desc} before the promo resets!`;

      const contentItem: ContentEngineItem = {
        id: scriptId,
        suggestionId,
        program: selected.name,
        hook: hookAngle,
        script: scriptBody,
        cta: ctaCopy,
        ctaLink: routingLink,
        platform: 'TikTok, IG Reels, YT Shorts',
        status: 'Script Ready',
        createdAt: timestamp,
        postedAt: null,
      };

      runInTransaction(() => {
        db.prepare(`
          INSERT INTO content_engine_scripts (id, user_id, suggestion_id, program, hook, script, cta, cta_link, platform, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Script Ready', ?)
        `).run(
          contentItem.id,
          userId,
          contentItem.suggestionId,
          contentItem.program,
          contentItem.hook,
          contentItem.script,
          contentItem.cta,
          contentItem.ctaLink,
          contentItem.platform,
          timestamp
        );
      });

      // Emit Event: content.script_ready
      this.recordEvent(userId, 'content.script_ready', {
        scriptId,
        program: selected.name,
        platform: contentItem.platform,
        timestamp,
      });

      return {
        success: true,
        suggestion,
        script: contentItem,
        event: 'referral.suggestion_created',
        message: `Referral suggestion created and transformed into Content Engine Script Ready format!`,
      };
    } catch (err: any) {
      console.error('ReferralAgent error:', err);
      this.recordEvent(userId, 'referral.error', { error: err.message, trigger, timestamp });
      return {
        success: false,
        suggestion: null,
        script: null,
        event: 'referral.error',
        message: err.message || 'ReferralAgent failed.',
      };
    }
  }

  /**
   * Updates referral program link with URL validation and emits referral.link_updated
   */
  public static updateLink(userId: string, slug: string, newUrl: string): { success: boolean; error?: string } {
    try {
      new URL(newUrl); // Invariant: Link must be valid URL
    } catch {
      const errorMsg = `Invalid URL: ${newUrl}`;
      this.recordEvent(userId, 'referral.error', { error: errorMsg, slug });
      return { success: false, error: errorMsg };
    }

    db.prepare(`
      UPDATE crypto_referral_programs 
      SET destination_url = ? 
      WHERE slug = ?
    `).run(newUrl, slug);

    this.recordEvent(userId, 'referral.link_updated', {
      slug,
      newUrl,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  /**
   * Advances script status to Posted and emits referral.content_posted
   */
  public static markContentPosted(userId: string, scriptId: string): { success: boolean; error?: string } {
    const now = new Date().toISOString();

    const script = db.prepare(`
      SELECT * FROM content_engine_scripts WHERE id = ? AND user_id = ?
    `).get(scriptId, userId) as any;

    if (!script) {
      return { success: false, error: 'Script not found' };
    }

    db.prepare(`
      UPDATE content_engine_scripts 
      SET status = 'Posted', posted_at = ? 
      WHERE id = ?
    `).run(now, scriptId);

    this.recordEvent(userId, 'referral.content_posted', {
      scriptId,
      program: script.program,
      platform: script.platform,
      postedAt: now,
    });

    return { success: true };
  }

  private static recordEvent(
    userId: string,
    eventType: 
      | 'referral.suggestion_created'
      | 'referral.link_updated'
      | 'referral.error'
      | 'content.idea_created'
      | 'content.script_ready'
      | 'referral.content_posted',
    payload: Record<string, any>
  ): void {
    const id = `evt_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      db.prepare(`
        INSERT INTO referral_agent_events (id, user_id, event_type, payload, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, userId, eventType, JSON.stringify(payload), new Date().toISOString());
    } catch (e) {
      console.error('Failed to log ReferralAgent event:', e);
    }
  }
}
