/**
 * SnapR API - Data Retention Cleanup Cron
 * ========================================
 * Runs weekly (Sunday 3am UTC) via Vercel Cron.
 *
 * Cleans up old data to prevent database bloat:
 * - webhook_deliveries older than 90 days
 * - api_usage older than 90 days
 * - jobs with status 'completed' or 'failed' older than 30 days
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { startCronHeartbeat } from '@/lib/monitoring/cron-heartbeat'

const CRON_SECRET = process.env.CRON_SECRET

interface CleanupResult {
  table: string
  deleted: number
  error?: string
}

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('[CleanupCron] Starting data retention cleanup...')
  const heartbeat = startCronHeartbeat('cleanup')
  const supabase = adminSupabase()
  const results: CleanupResult[] = []

  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Delete webhook_deliveries older than 90 days
  try {
    const { count, error } = await supabase
      .from('webhook_deliveries')
      .delete({ count: 'exact' })
      .lt('created_at', ninetyDaysAgo)

    if (error) {
      logger.error('[CleanupCron] webhook_deliveries cleanup error:', error.message)
      results.push({ table: 'webhook_deliveries', deleted: 0, error: error.message })
    } else {
      const deleted = count ?? 0
      logger.info(`[CleanupCron] Deleted ${deleted} webhook_deliveries older than 90 days`)
      results.push({ table: 'webhook_deliveries', deleted })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[CleanupCron] webhook_deliveries cleanup exception:', message)
    results.push({ table: 'webhook_deliveries', deleted: 0, error: message })
  }

  // 2. Delete api_usage older than 90 days
  try {
    const { count, error } = await supabase
      .from('api_usage')
      .delete({ count: 'exact' })
      .lt('created_at', ninetyDaysAgo)

    if (error) {
      // Table may not exist — log and continue
      logger.warn('[CleanupCron] api_usage cleanup error (table may not exist):', error.message)
      results.push({ table: 'api_usage', deleted: 0, error: error.message })
    } else {
      const deleted = count ?? 0
      logger.info(`[CleanupCron] Deleted ${deleted} api_usage records older than 90 days`)
      results.push({ table: 'api_usage', deleted })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.warn('[CleanupCron] api_usage cleanup exception:', message)
    results.push({ table: 'api_usage', deleted: 0, error: message })
  }

  // 3. Delete jobs with status 'completed' or 'failed' older than 30 days
  try {
    const { count, error } = await supabase
      .from('jobs')
      .delete({ count: 'exact' })
      .in('status', ['completed', 'failed'])
      .lt('created_at', thirtyDaysAgo)

    if (error) {
      logger.error('[CleanupCron] jobs cleanup error:', error.message)
      results.push({ table: 'jobs', deleted: 0, error: error.message })
    } else {
      const deleted = count ?? 0
      logger.info(`[CleanupCron] Deleted ${deleted} completed/failed jobs older than 30 days`)
      results.push({ table: 'jobs', deleted })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[CleanupCron] jobs cleanup exception:', message)
    results.push({ table: 'jobs', deleted: 0, error: message })
  }

  // Summary
  const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0)
  const hasErrors = results.some(r => r.error)

  logger.info(`[CleanupCron] Complete: ${totalDeleted} total records deleted`, { results })

  const summary = {
    totalDeleted,
    tables: results,
    hasErrors,
  }

  if (hasErrors) {
    await heartbeat.fail(new Error(`Cleanup completed with errors: ${results.filter(r => r.error).map(r => `${r.table}: ${r.error}`).join(', ')}`))
  } else {
    await heartbeat.succeed(summary as unknown as Record<string, unknown>)
  }

  return NextResponse.json({ success: true, ...summary })
}
