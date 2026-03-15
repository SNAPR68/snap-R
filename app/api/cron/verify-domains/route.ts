/**
 * SnapR Cron — Verify Custom Domains
 * Runs every 6 hours. Checks DNS TXT records for pending domains.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import dns from 'dns/promises'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = adminSupabase()
  const results = { checked: 0, verified: 0, failed: 0 }

  const { data: domains, error } = await supabase
    .from('custom_domains')
    .select('id, domain, verification_token, verification_status')
    .eq('verification_status', 'pending')

  if (error) {
    logger.error('[DomainVerify] Failed to fetch domains:', error)
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })
  }

  if (!domains || domains.length === 0) {
    return NextResponse.json({ message: 'No domains to verify', ...results })
  }

  for (const domain of domains) {
    results.checked++
    try {
      const txtRecords = await dns.resolveTxt(`_snapr-verify.${domain.domain}`)
      const flatRecords = txtRecords.map(r => r.join(''))
      const expectedValue = `snapr-verify=${domain.verification_token}`

      if (flatRecords.includes(expectedValue)) {
        const { error: updateError } = await supabase
          .from('custom_domains')
          .update({
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', domain.id)

        if (updateError) {
          results.failed++
          logger.error(`[DomainVerify] Failed to update ${domain.domain}:`, updateError.message)
        } else {
          results.verified++
          logger.info(`[DomainVerify] Verified: ${domain.domain}`)
        }
      } else {
        results.failed++
        logger.info(`[DomainVerify] TXT record not found for ${domain.domain}`)
      }
    } catch (error: unknown) {
      results.failed++
      const msg = error instanceof Error ? error.message : 'Unknown error'
      // ENOTFOUND/ENODATA are expected when DNS isn't set up yet
      if (!msg.includes('ENOTFOUND') && !msg.includes('ENODATA')) {
        logger.error(`[DomainVerify] Error checking ${domain.domain}:`, msg)
      }
    }
  }

  logger.info('[DomainVerify] Complete:', results)
  return NextResponse.json({ success: true, ...results })
}
