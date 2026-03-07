/**
 * Auto-Post Rules Evaluator
 * ==========================
 * Evaluates auto-post rules when listing events occur (e.g., status change).
 * For each matching rule × platform, inserts a scheduled_posts row with status 'pending'.
 * The existing cron publisher (publish-scheduled) picks these up automatically.
 */

import { adminSupabase } from '@/lib/supabase/admin';

import { logger } from '@/lib/logger';
interface EvaluateParams {
  listingId: string;
  userId: string;
  triggerEvent: string;
  triggerValue?: string;
}

interface AutoPostRule {
  id: string;
  user_id: string;
  name: string;
  trigger_event: string;
  trigger_value: string | null;
  platforms: string[];
  post_type: string | null;
  template_id: string | null;
  include_caption: boolean;
  include_hashtags: boolean;
  is_active: boolean;
}

export async function evaluateAutoPostRules({
  listingId,
  userId,
  triggerEvent,
  triggerValue,
}: EvaluateParams): Promise<{ scheduled: number; errors: number }> {
  const supabase = adminSupabase();
  const result = { scheduled: 0, errors: 0 };

  // Fetch active rules matching the trigger event
  let query = supabase
    .from('auto_post_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('trigger_event', triggerEvent);

  // If the rule has a specific trigger_value, match it; also match rules with null trigger_value (any value)
  if (triggerValue) {
    query = query.or(`trigger_value.eq.${triggerValue},trigger_value.is.null`);
  }

  const { data: rules, error: fetchError } = await query;

  if (fetchError || !rules || rules.length === 0) {
    if (fetchError) {
      logger.error('[AutoPost] Error fetching rules:', fetchError.message);
    }
    return result;
  }

  // Fetch listing info for caption generation
  const { data: listing } = await supabase
    .from('listings')
    .select('title, address, marketing_status')
    .eq('id', listingId)
    .single();

  const listingLabel = listing?.title || listing?.address || 'Property';

  // Fetch the latest marketing captions if available
  const { data: marketingJob } = await supabase
    .from('marketing_jobs')
    .select('captions_result')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const captions = marketingJob?.captions_result as Record<string, { caption?: string; hashtags?: string }> | null;

  // Schedule a post for each rule × platform combination
  const scheduledFor = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now

  for (const rule of rules as AutoPostRule[]) {
    for (const platform of rule.platforms) {
      try {
        // Build content from marketing captions or fallback
        const platformCaptions = captions?.[platform];
        let content = '';

        if (rule.include_caption && platformCaptions?.caption) {
          content = platformCaptions.caption;
        } else {
          content = `${listingLabel} — ${triggerValue || triggerEvent}`;
        }

        if (rule.include_hashtags && platformCaptions?.hashtags) {
          content += `\n\n${platformCaptions.hashtags}`;
        }

        const { error: insertError } = await supabase
          .from('scheduled_posts')
          .insert({
            user_id: userId,
            listing_id: listingId,
            platform,
            post_type: rule.post_type || 'auto',
            content,
            scheduled_for: scheduledFor,
            status: 'pending',
          });

        if (insertError) {
          logger.error(`[AutoPost] Failed to schedule ${platform} post for rule ${rule.id}:`, insertError.message);
          result.errors++;
        } else {
          result.scheduled++;
          logger.info(`[AutoPost] Scheduled ${platform} post for listing ${listingId} (rule: ${rule.name})`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error(`[AutoPost] Error scheduling ${platform} post:`, message);
        result.errors++;
      }
    }
  }

  logger.info(`[AutoPost] Evaluation complete: ${result.scheduled} scheduled, ${result.errors} errors`);
  return result;
}
