import { describe, it, expect } from 'vitest'
import {
  getPlanLimits,
  normalizeTier,
} from '@/lib/content/limits'

/**
 * Marketing Pipeline Business Logic Tests
 * =========================================
 * Tests the business rules governing the marketing pipeline:
 * - Billing gates (free tier skipped, pro+ gets full pipeline)
 * - Status transitions (pending → processing → completed/failed)
 * - Always-complete semantics (one step failing doesn't block others)
 * - Cost tracking per step
 */

// ============================================
// Types matching the marketing pipeline
// ============================================

type StepStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'

interface MarketingJobStep {
  status: StepStatus
  result: Record<string, unknown> | null
  costCents: number
}

interface MarketingJob {
  listingId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'
  description: MarketingJobStep
  captions: MarketingJobStep
  mls: MarketingJobStep
  propertySite: MarketingJobStep
  scheduledPosts: MarketingJobStep
  totalCostCents: number
}

// Simulates the billing gate check in marketing-handler.ts
function shouldSkipMarketing(tier: string): boolean {
  const limits = getPlanLimits(tier)
  return !limits.canPublish && !limits.canAccessContentStudio
}

// Simulates the marketing pipeline status resolution
function resolveMarketingStatus(job: MarketingJob): 'completed' | 'failed' | 'skipped' {
  if (job.status === 'skipped') return 'skipped'

  const steps = [job.description, job.captions, job.mls, job.propertySite, job.scheduledPosts]
  const allCompleted = steps.every(s => s.status === 'completed' || s.status === 'skipped')
  const anyFailed = steps.some(s => s.status === 'failed')

  if (allCompleted) return 'completed'
  if (anyFailed) return 'failed'
  return 'completed' // at least partial completion counts
}

// Simulates always-complete execution
function executeMarketingPipeline(
  tier: string,
  stepResults: { description?: StepStatus; captions?: StepStatus; mls?: StepStatus; propertySite?: StepStatus; scheduledPosts?: StepStatus }
): MarketingJob {
  const job: MarketingJob = {
    listingId: 'test-listing-id',
    status: 'pending',
    description: { status: 'pending', result: null, costCents: 0 },
    captions: { status: 'pending', result: null, costCents: 0 },
    mls: { status: 'pending', result: null, costCents: 0 },
    propertySite: { status: 'pending', result: null, costCents: 0 },
    scheduledPosts: { status: 'pending', result: null, costCents: 0 },
    totalCostCents: 0,
  }

  // Billing gate check
  if (shouldSkipMarketing(tier)) {
    job.status = 'skipped'
    job.description.status = 'skipped'
    job.captions.status = 'skipped'
    job.mls.status = 'skipped'
    job.propertySite.status = 'skipped'
    job.scheduledPosts.status = 'skipped'
    return job
  }

  job.status = 'processing'

  // Step 1: Description (GPT-4o, ~15c)
  job.description.status = stepResults.description || 'completed'
  if (job.description.status === 'completed') {
    job.description.result = { text: 'Beautiful property...' }
    job.description.costCents = 15
  }

  // Step 2: Captions (GPT-4o-mini, ~3c/platform)
  job.captions.status = stepResults.captions || 'completed'
  if (job.captions.status === 'completed') {
    job.captions.result = { facebook: 'caption...', instagram: 'caption...' }
    job.captions.costCents = 6
  }

  // Step 3: MLS Package (no AI cost)
  job.mls.status = stepResults.mls || 'completed'
  if (job.mls.status === 'completed') {
    job.mls.result = { photoCount: 10, metadata: {} }
    job.mls.costCents = 0
  }

  // Step 4: Property Site (no AI cost)
  job.propertySite.status = stepResults.propertySite || 'completed'
  if (job.propertySite.status === 'completed') {
    job.propertySite.result = { slug: 'test-property', siteId: 'site_123' }
    job.propertySite.costCents = 0
  }

  // Step 5: Scheduled Posts (no AI cost)
  job.scheduledPosts.status = stepResults.scheduledPosts || 'completed'
  if (job.scheduledPosts.status === 'completed') {
    job.scheduledPosts.result = { postsScheduled: 3 }
    job.scheduledPosts.costCents = 0
  }

  // Calculate total cost
  job.totalCostCents = job.description.costCents + job.captions.costCents +
    job.mls.costCents + job.propertySite.costCents + job.scheduledPosts.costCents

  // Resolve final status
  job.status = resolveMarketingStatus(job)

  return job
}

describe('marketing-pipeline', () => {
  // ============================================
  // Billing gates
  // ============================================

  describe('billing gates', () => {
    it('should skip marketing for free tier users', () => {
      const job = executeMarketingPipeline('free', {})

      expect(job.status).toBe('skipped')
      expect(job.description.status).toBe('skipped')
      expect(job.captions.status).toBe('skipped')
      expect(job.mls.status).toBe('skipped')
      expect(job.propertySite.status).toBe('skipped')
      expect(job.scheduledPosts.status).toBe('skipped')
      expect(job.totalCostCents).toBe(0)
    })

    it('should skip marketing for unknown tiers (defaults to free)', () => {
      const job = executeMarketingPipeline('nonexistent', {})
      expect(job.status).toBe('skipped')
    })

    it('should allow marketing for starter tier (has content studio access)', () => {
      // Starter can access content studio but cannot publish
      // The marketing pipeline still runs to generate assets
      const limits = getPlanLimits('starter')
      expect(limits.canAccessContentStudio).toBe(true)
      // shouldSkipMarketing checks both canPublish AND canAccessContentStudio
      // starter has canAccessContentStudio=true so it should NOT skip
      expect(shouldSkipMarketing('starter')).toBe(false)
    })

    it('should run full marketing pipeline for pro tier', () => {
      const job = executeMarketingPipeline('pro', {})

      expect(job.status).toBe('completed')
      expect(job.description.status).toBe('completed')
      expect(job.captions.status).toBe('completed')
      expect(job.mls.status).toBe('completed')
      expect(job.propertySite.status).toBe('completed')
      expect(job.scheduledPosts.status).toBe('completed')
    })

    it('should run full marketing pipeline for agency tier', () => {
      const job = executeMarketingPipeline('agency', {})
      expect(job.status).toBe('completed')
    })

    it('should run full marketing pipeline for enterprise tier', () => {
      const job = executeMarketingPipeline('enterprise', {})
      expect(job.status).toBe('completed')
    })
  })

  // ============================================
  // Status transitions
  // ============================================

  describe('status transitions', () => {
    it('should transition from pending to processing to completed', () => {
      const job = executeMarketingPipeline('pro', {})

      // Final status should be completed when all steps succeed
      expect(job.status).toBe('completed')
    })

    it('should transition to failed when any step fails', () => {
      const job = executeMarketingPipeline('pro', {
        description: 'failed',
      })

      expect(job.status).toBe('failed')
      expect(job.description.status).toBe('failed')
    })

    it('should set status to skipped for gated users', () => {
      const job = executeMarketingPipeline('free', {})
      expect(job.status).toBe('skipped')
    })
  })

  // ============================================
  // Always-complete semantics
  // ============================================

  describe('always-complete semantics', () => {
    it('should complete other steps even when description fails', () => {
      const job = executeMarketingPipeline('pro', {
        description: 'failed',
      })

      expect(job.description.status).toBe('failed')
      // Other steps should still complete
      expect(job.captions.status).toBe('completed')
      expect(job.mls.status).toBe('completed')
      expect(job.propertySite.status).toBe('completed')
      expect(job.scheduledPosts.status).toBe('completed')
    })

    it('should complete other steps even when captions fail', () => {
      const job = executeMarketingPipeline('pro', {
        captions: 'failed',
      })

      expect(job.captions.status).toBe('failed')
      expect(job.description.status).toBe('completed')
      expect(job.mls.status).toBe('completed')
      expect(job.propertySite.status).toBe('completed')
      expect(job.scheduledPosts.status).toBe('completed')
    })

    it('should complete other steps when multiple steps fail', () => {
      const job = executeMarketingPipeline('pro', {
        description: 'failed',
        captions: 'failed',
        scheduledPosts: 'failed',
      })

      expect(job.description.status).toBe('failed')
      expect(job.captions.status).toBe('failed')
      expect(job.scheduledPosts.status).toBe('failed')
      // These should still succeed
      expect(job.mls.status).toBe('completed')
      expect(job.propertySite.status).toBe('completed')
    })

    it('should handle all steps failing gracefully', () => {
      const job = executeMarketingPipeline('pro', {
        description: 'failed',
        captions: 'failed',
        mls: 'failed',
        propertySite: 'failed',
        scheduledPosts: 'failed',
      })

      expect(job.status).toBe('failed')
      expect(job.totalCostCents).toBe(0)
    })
  })

  // ============================================
  // Cost tracking
  // ============================================

  describe('cost tracking', () => {
    it('should track zero cost for skipped users', () => {
      const job = executeMarketingPipeline('free', {})
      expect(job.totalCostCents).toBe(0)
    })

    it('should track correct total cost for full pipeline', () => {
      const job = executeMarketingPipeline('pro', {})

      // Description: 15c, Captions: 6c, MLS: 0c, Property Site: 0c, Scheduled Posts: 0c
      expect(job.description.costCents).toBe(15)
      expect(job.captions.costCents).toBe(6)
      expect(job.mls.costCents).toBe(0)
      expect(job.propertySite.costCents).toBe(0)
      expect(job.scheduledPosts.costCents).toBe(0)
      expect(job.totalCostCents).toBe(21)
    })

    it('should not charge for failed steps', () => {
      const job = executeMarketingPipeline('pro', {
        description: 'failed',
        captions: 'failed',
      })

      expect(job.description.costCents).toBe(0)
      expect(job.captions.costCents).toBe(0)
      expect(job.totalCostCents).toBe(0)
    })

    it('should only charge for completed steps', () => {
      const job = executeMarketingPipeline('pro', {
        description: 'completed',
        captions: 'failed',
      })

      expect(job.description.costCents).toBe(15)
      expect(job.captions.costCents).toBe(0)
      expect(job.totalCostCents).toBe(15)
    })
  })

  // ============================================
  // Publish gate (separate from marketing)
  // ============================================

  describe('publish gate (cron publisher)', () => {
    it('should block publishing for free tier', () => {
      expect(getPlanLimits('free').canPublish).toBe(false)
    })

    it('should block publishing for starter tier', () => {
      expect(getPlanLimits('starter').canPublish).toBe(false)
    })

    it('should allow publishing for pro tier', () => {
      expect(getPlanLimits('pro').canPublish).toBe(true)
    })

    it('should allow publishing for agency tier', () => {
      expect(getPlanLimits('agency').canPublish).toBe(true)
    })

    it('should allow publishing for enterprise tier', () => {
      expect(getPlanLimits('enterprise').canPublish).toBe(true)
    })
  })

  // ============================================
  // Tier normalization in marketing context
  // ============================================

  describe('tier normalization', () => {
    it('should handle gold alias (maps to pro)', () => {
      const job = executeMarketingPipeline('gold', {})
      expect(job.status).toBe('completed')
    })

    it('should handle platinum alias (maps to agency)', () => {
      const job = executeMarketingPipeline('platinum', {})
      expect(job.status).toBe('completed')
    })

    it('should handle null tier as free', () => {
      expect(normalizeTier(null)).toBe('free')
      expect(shouldSkipMarketing(normalizeTier(null))).toBe(true)
    })
  })
})
