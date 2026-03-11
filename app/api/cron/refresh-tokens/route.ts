/**
 * SnapR API - Refresh Social Tokens Cron
 * ========================================
 * Runs every 4 hours via Vercel Cron.
 * Proactively refreshes OAuth tokens approaching expiry.
 * Critical for TikTok (24h tokens) and LinkedIn (60-day tokens).
 * Facebook/Instagram use fb_exchange_token grant (pass access_token, not refresh_token).
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { refreshAccessToken, type SocialPlatform } from '@/lib/social/oauth-config';

import { logger } from '@/lib/logger';
import { startCronHeartbeat } from '@/lib/monitoring/cron-heartbeat';
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[TokenRefresh] Starting proactive token refresh...');
  const heartbeat = startCronHeartbeat('refresh-tokens');
  const supabase = adminSupabase();
  const results = { refreshed: 0, failed: 0, skipped: 0 };

  try {
    // Fetch all active connections with a known expiry
    const { data: connections, error: fetchError } = await supabase
      .from('social_connections')
      .select('id, user_id, platform, access_token, refresh_token, token_expires_at')
      .eq('is_active', true)
      .not('token_expires_at', 'is', null);

    if (fetchError) {
      logger.error('[TokenRefresh] Failed to fetch connections:', fetchError.message);
      await heartbeat.fail(new Error(fetchError.message));
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!connections || connections.length === 0) {
      logger.info('[TokenRefresh] No connections with token expiry found');
      await heartbeat.succeed(results as unknown as Record<string, unknown>);
      return NextResponse.json({ success: true, ...results });
    }

    logger.info(`[TokenRefresh] Checking ${connections.length} connections...`);

    const buffer48h = Date.now() + 48 * 60 * 60 * 1000;

    for (const conn of connections) {
      const expiresAt = new Date(conn.token_expires_at).getTime();

      // Skip if token is still fresh (more than 48h until expiry)
      if (expiresAt > buffer48h) {
        continue;
      }

      const platform = conn.platform as SocialPlatform;

      // Facebook/Instagram: pass access_token (fb_exchange_token grant)
      // Others: pass refresh_token (standard refresh_token grant)
      const isFacebookFamily = platform === 'facebook' || platform === 'instagram';
      const tokenToRefresh = isFacebookFamily
        ? conn.access_token
        : conn.refresh_token;

      if (!tokenToRefresh) {
        logger.warn(`[TokenRefresh] No ${isFacebookFamily ? 'access' : 'refresh'} token for ${platform} (user: ${conn.user_id})`);
        results.skipped++;
        continue;
      }

      try {
        logger.info(`[TokenRefresh] Refreshing ${platform} token for user ${conn.user_id}...`);
        const refreshed = await refreshAccessToken(platform, tokenToRefresh);

        const newExpiresAt = refreshed.expiresIn
          ? new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()
          : null;

        await supabase
          .from('social_connections')
          .update({
            access_token: refreshed.accessToken,
            ...(newExpiresAt ? { token_expires_at: newExpiresAt } : {}),
            last_error: null,
          })
          .eq('id', conn.id);

        logger.info(`[TokenRefresh] Refreshed ${platform} token for user ${conn.user_id}`);
        results.refreshed++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown refresh error';
        logger.error(`[TokenRefresh] Failed to refresh ${platform} for user ${conn.user_id}:`, message);

        // Record the error on the connection for visibility
        await supabase
          .from('social_connections')
          .update({ last_error: `Token refresh failed: ${message}` })
          .eq('id', conn.id);

        results.failed++;
      }
    }

    logger.info('[TokenRefresh] Done:', results);
    await heartbeat.succeed(results as unknown as Record<string, unknown>);
    return NextResponse.json({ success: true, ...results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[TokenRefresh] Fatal error:', message);
    await heartbeat.fail(err);
    return NextResponse.json({ error: message, ...results }, { status: 500 });
  }
}
