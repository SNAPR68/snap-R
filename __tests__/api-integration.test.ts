/**
 * API Route Integration Tests
 * ===========================
 * Tests route handlers with mocked Supabase/dependencies.
 * Invokes actual handler functions with NextRequest objects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ──────────────────────────────────────────────
// Mock builders
// ──────────────────────────────────────────────

const TEST_USER = { id: 'user-001', email: 'test@snap-r.com' }
const TEST_LISTING_ID = '00000000-1111-2222-3333-444444444444'
const TEST_LEAD_ID = '55555555-6666-7777-8888-999999999999'

/** Creates a chainable Supabase query mock */
function createQueryMock(result: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, unknown> = {}
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'lt', 'gt', 'gte', 'lte',
    'order', 'limit', 'range', 'filter', 'match',
  ]
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  // For count queries with head: true
  if (result.count !== undefined) {
    chain.select = vi.fn(() => ({ ...chain, count: result.count }))
  }
  return chain
}

/** Creates a mock Supabase client with auth */
function createMockSupabase(overrides: {
  user?: typeof TEST_USER | null
  queryResult?: { data: unknown; error: unknown; count?: number }
  fromOverrides?: Record<string, ReturnType<typeof createQueryMock>>
} = {}) {
  const {
    user = TEST_USER,
    queryResult = { data: null, error: null },
  } = overrides

  const defaultQuery = createQueryMock(queryResult)
  const fromOverrides = overrides.fromOverrides ?? {}

  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user },
        error: user ? null : { message: 'Not authenticated' },
      })),
    },
    from: vi.fn((table: string) => fromOverrides[table] ?? defaultQuery),
    storage: {
      from: vi.fn(() => ({
        list: vi.fn(() => Promise.resolve({ data: [], error: null })),
        createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'https://signed.url' }, error: null })),
      })),
    },
  }
}

/** Creates a NextRequest with query params */
function makeRequest(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init)
}

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

let mockSupabase = createMockSupabase()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/social/auto-post-evaluator', () => ({
  evaluateAutoPostRules: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/campaigns/status-hook', () => ({
  onListingStatusChange: vi.fn(() => Promise.resolve({ triggered: false })),
  toCampaignStatus: vi.fn((s: string) => s.toLowerCase().replace(/ /g, '_')),
}))

vi.mock('@/lib/webhooks/dispatch', () => ({
  dispatchWebhookEvent: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/monitoring/cron-heartbeat', () => ({
  startCronHeartbeat: vi.fn(() => ({
    succeed: vi.fn(() => Promise.resolve()),
    fail: vi.fn(() => Promise.resolve()),
  })),
  checkCronHealth: vi.fn(() => Promise.resolve([])),
}))

vi.mock('@/lib/error-logger', () => ({
  logCritical: vi.fn(() => Promise.resolve()),
}))

vi.mock('@sentry/nextjs', () => ({
  captureCheckIn: vi.fn(() => 'check-in-id'),
  captureException: vi.fn(),
}))

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('API Integration: /api/listing/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns 400 when listingId is missing', async () => {
    mockSupabase = createMockSupabase()
    const { GET } = await import('@/app/api/listing/status/route')
    const res = await GET(makeRequest('/api/listing/status'))
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toContain('listingId')
  })

  it('GET returns 401 when user is not authenticated', async () => {
    mockSupabase = createMockSupabase({ user: null })
    const { GET } = await import('@/app/api/listing/status/route')
    const res = await GET(makeRequest('/api/listing/status?listingId=' + TEST_LISTING_ID))
    expect(res.status).toBe(401)
  })

  it('GET returns 404 when listing not found', async () => {
    mockSupabase = createMockSupabase({
      queryResult: { data: null, error: { message: 'Not found', code: 'PGRST116' } },
    })
    const { GET } = await import('@/app/api/listing/status/route')
    const res = await GET(makeRequest('/api/listing/status?listingId=' + TEST_LISTING_ID))
    expect(res.status).toBe(404)
  })

  it('GET returns listing status with marketing job', async () => {
    const listingQuery = createQueryMock({
      data: {
        id: TEST_LISTING_ID,
        preparation_status: 'prepared',
        marketing_status: 'Active',
        hero_photo_id: null,
        prepared_at: '2026-01-01T00:00:00Z',
        preparation_metadata: { confidence: 92 },
      },
      error: null,
    })
    const jobQuery = createQueryMock({ data: null, error: null })
    const photosQuery = createQueryMock({ data: null, error: null, count: 5 })
    const flaggedQuery = createQueryMock({ data: [], error: null })
    const logsQuery = createQueryMock({ data: [], error: null })
    const marketingQuery = createQueryMock({
      data: {
        id: 'mj-1',
        status: 'completed',
        description_status: 'completed',
        captions_status: 'completed',
        mls_status: 'completed',
        property_site_status: 'completed',
        scheduled_posts_status: 'completed',
        completed_at: '2026-01-01T01:00:00Z',
      },
      error: null,
    })

    mockSupabase = createMockSupabase()
    // Override from() to return different mocks per table
    let callIdx = 0
    const tableSequence = [listingQuery, jobQuery, photosQuery, photosQuery, flaggedQuery, logsQuery, marketingQuery]
    mockSupabase.from = vi.fn(() => tableSequence[callIdx++] ?? createQueryMock({ data: null, error: null })) as typeof mockSupabase.from

    const { GET } = await import('@/app/api/listing/status/route')
    const res = await GET(makeRequest('/api/listing/status?listingId=' + TEST_LISTING_ID))
    expect(res.status).toBe(200)
    const json = await res.json() as { status: string; marketingJob: { status: string } }
    expect(json.status).toBe('prepared')
    expect(json.marketingJob).toBeTruthy()
    expect(json.marketingJob.status).toBe('completed')
  })
})

describe('API Integration: /api/marketing/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns 400 when listingId is missing', async () => {
    mockSupabase = createMockSupabase()
    const { GET } = await import('@/app/api/marketing/status/route')
    const res = await GET(makeRequest('/api/marketing/status'))
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toContain('listingId')
  })

  it('GET returns 401 when unauthenticated', async () => {
    mockSupabase = createMockSupabase({ user: null })
    const { GET } = await import('@/app/api/marketing/status/route')
    const res = await GET(makeRequest('/api/marketing/status?listingId=' + TEST_LISTING_ID))
    expect(res.status).toBe(401)
  })

  it('GET returns 404 when listing not found', async () => {
    mockSupabase = createMockSupabase({
      queryResult: { data: null, error: { message: 'Not found' } },
    })
    const { GET } = await import('@/app/api/marketing/status/route')
    const res = await GET(makeRequest('/api/marketing/status?listingId=' + TEST_LISTING_ID))
    expect(res.status).toBe(404)
  })

  it('GET returns null marketingJob when no job exists', async () => {
    const listingQuery = createQueryMock({
      data: { id: TEST_LISTING_ID, marketing_status: null },
      error: null,
    })
    const jobQuery = createQueryMock({ data: null, error: null })

    mockSupabase = createMockSupabase()
    let callIdx = 0
    const seq = [listingQuery, jobQuery]
    mockSupabase.from = vi.fn(() => seq[callIdx++] ?? createQueryMock({ data: null, error: null })) as typeof mockSupabase.from

    const { GET } = await import('@/app/api/marketing/status/route')
    const res = await GET(makeRequest('/api/marketing/status?listingId=' + TEST_LISTING_ID))
    expect(res.status).toBe(200)
    const json = await res.json() as { marketingJob: unknown }
    expect(json.marketingJob).toBeNull()
  })

  it('GET returns full marketing job with all steps', async () => {
    const listingQuery = createQueryMock({
      data: { id: TEST_LISTING_ID, marketing_status: 'Active' },
      error: null,
    })
    const jobQuery = createQueryMock({
      data: {
        id: 'mj-2',
        status: 'completed',
        description_status: 'completed',
        description_result: 'Beautiful home...',
        captions_status: 'completed',
        captions_result: { facebook: 'Check out...', instagram: '#realestate' },
        mls_status: 'completed',
        mls_result: { photos: 5 },
        property_site_status: 'completed',
        property_site_result: { slug: 'test-property' },
        scheduled_posts_status: 'completed',
        scheduled_posts_result: { count: 4 },
        video_status: 'completed',
        video_result: null,
        total_cost_cents: 1800,
        cost_breakdown: { description: 1500, captions: 300 },
        started_at: '2026-01-01T00:00:00Z',
        completed_at: '2026-01-01T00:01:00Z',
        error: null,
      },
      error: null,
    })

    mockSupabase = createMockSupabase()
    let callIdx = 0
    const seq = [listingQuery, jobQuery]
    mockSupabase.from = vi.fn(() => seq[callIdx++] ?? createQueryMock({ data: null, error: null })) as typeof mockSupabase.from

    const { GET } = await import('@/app/api/marketing/status/route')
    const res = await GET(makeRequest('/api/marketing/status?listingId=' + TEST_LISTING_ID))
    expect(res.status).toBe(200)
    const json = await res.json() as {
      marketingJob: {
        description: { status: string; result: string }
        captions: { status: string }
        totalCostCents: number
      }
    }
    expect(json.marketingJob.description.status).toBe('completed')
    expect(json.marketingJob.captions.status).toBe('completed')
    expect(json.marketingJob.totalCostCents).toBe(1800)
  })
})

describe('API Integration: /api/cron/health-check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  it('GET returns 401 without auth', async () => {
    const { GET } = await import('@/app/api/cron/health-check/route')
    const res = await GET(makeRequest('/api/cron/health-check'))
    expect(res.status).toBe(401)
  })

  it('GET returns 401 with wrong token', async () => {
    const { GET } = await import('@/app/api/cron/health-check/route')
    const res = await GET(makeRequest('/api/cron/health-check', {
      headers: { authorization: 'Bearer wrong-secret' },
    }))
    expect(res.status).toBe(401)
  })

  it('GET returns healthy status with correct auth', async () => {
    mockSupabase = createMockSupabase({
      queryResult: { data: { id: 'profile-1' }, error: null },
    })

    const { GET } = await import('@/app/api/cron/health-check/route')
    const res = await GET(makeRequest('/api/cron/health-check', {
      headers: { authorization: 'Bearer test-cron-secret' },
    }))
    expect(res.status).toBe(200)
    const json = await res.json() as { success: boolean; healthy: boolean }
    expect(json.success).toBe(true)
    expect(json.healthy).toBe(true)
  })
})

describe('API Integration: /api/leads/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns 401 when unauthenticated', async () => {
    mockSupabase = createMockSupabase({ user: null })
    const { GET } = await import('@/app/api/leads/activity/route')
    const res = await GET(makeRequest('/api/leads/activity?leadId=' + TEST_LEAD_ID))
    expect(res.status).toBe(401)
  })

  it('GET returns 400 when leadId is missing', async () => {
    mockSupabase = createMockSupabase()
    const { GET } = await import('@/app/api/leads/activity/route')
    const res = await GET(makeRequest('/api/leads/activity'))
    expect(res.status).toBe(400)
  })

  it('GET returns 404 when lead not found', async () => {
    const leadQuery = createQueryMock({ data: null, error: null })
    mockSupabase = createMockSupabase()
    mockSupabase.from = vi.fn(() => leadQuery) as typeof mockSupabase.from

    const { GET } = await import('@/app/api/leads/activity/route')
    const res = await GET(makeRequest('/api/leads/activity?leadId=' + TEST_LEAD_ID))
    expect(res.status).toBe(404)
  })

  it('GET returns activities for valid lead', async () => {
    const mockActivities = [{ id: 'act-1', activity_type: 'call', body: 'Called client', metadata: null, created_at: '2026-01-01T00:00:00Z' }]
    const mockLead = { id: TEST_LEAD_ID, score: 45, notes: null, status: 'new', last_activity_at: null }

    mockSupabase = createMockSupabase()
    // The route calls from('property_leads') then from('lead_activities')
    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'property_leads') {
        return createQueryMock({ data: mockLead, error: null })
      }
      if (table === 'lead_activities') {
        // Activities query doesn't use .single() — override the chain
        const chain = createQueryMock({ data: mockActivities, error: null })
        // The route doesn't call .single() for activities — it just awaits the chain after .limit()
        // Override limit to resolve with data array directly
        chain.limit = vi.fn(() => Promise.resolve({ data: mockActivities, error: null }))
        return chain
      }
      return createQueryMock({ data: null, error: null })
    }) as typeof mockSupabase.from

    const { GET } = await import('@/app/api/leads/activity/route')
    const res = await GET(makeRequest('/api/leads/activity?leadId=' + TEST_LEAD_ID))
    expect(res.status).toBe(200)
    const json = await res.json() as { activities: Array<{ activity_type: string }>; lead: { score: number } }
    expect(json.activities).toHaveLength(1)
    expect(json.lead.score).toBe(45)
  })

  it('POST returns 401 when unauthenticated', async () => {
    mockSupabase = createMockSupabase({ user: null })
    const { POST } = await import('@/app/api/leads/activity/route')
    const res = await POST(makeRequest('/api/leads/activity', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leadId: TEST_LEAD_ID, activityType: 'call' }),
    }))
    expect(res.status).toBe(401)
  })

  it('POST returns 400 for invalid activity type', async () => {
    mockSupabase = createMockSupabase()
    const { POST } = await import('@/app/api/leads/activity/route')
    const res = await POST(makeRequest('/api/leads/activity', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leadId: TEST_LEAD_ID, activityType: 'invalid_type' }),
    }))
    expect(res.status).toBe(400)
  })

  it('POST creates activity and auto-scores lead', async () => {
    const leadQuery = createQueryMock({
      data: { id: TEST_LEAD_ID, score: 30 },
      error: null,
    })
    const insertQuery = createQueryMock({
      data: { id: 'act-new', activity_type: 'call', body: null, metadata: null, created_at: '2026-01-01' },
      error: null,
    })
    const updateQuery = createQueryMock({ data: null, error: null })

    mockSupabase = createMockSupabase()
    let callIdx = 0
    const seq = [leadQuery, insertQuery, updateQuery]
    mockSupabase.from = vi.fn(() => seq[callIdx++] ?? createQueryMock({ data: null, error: null })) as typeof mockSupabase.from

    const { POST } = await import('@/app/api/leads/activity/route')
    const res = await POST(makeRequest('/api/leads/activity', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leadId: TEST_LEAD_ID, activityType: 'call' }),
    }))
    expect(res.status).toBe(200)
    const json = await res.json() as { activity: { activity_type: string } }
    expect(json.activity.activity_type).toBe('call')
  })

  it('PATCH returns 401 when unauthenticated', async () => {
    mockSupabase = createMockSupabase({ user: null })
    const { PATCH } = await import('@/app/api/leads/activity/route')
    const res = await PATCH(makeRequest('/api/leads/activity', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leadId: TEST_LEAD_ID, score: 50 }),
    }))
    expect(res.status).toBe(401)
  })

  it('PATCH returns 400 when no fields provided', async () => {
    mockSupabase = createMockSupabase()
    const { PATCH } = await import('@/app/api/leads/activity/route')
    const res = await PATCH(makeRequest('/api/leads/activity', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leadId: TEST_LEAD_ID }),
    }))
    expect(res.status).toBe(400)
  })

  it('PATCH updates lead score', async () => {
    const updateQuery = createQueryMock({
      data: { id: TEST_LEAD_ID, score: 75, notes: null, status: 'qualified' },
      error: null,
    })

    mockSupabase = createMockSupabase()
    mockSupabase.from = vi.fn(() => updateQuery) as typeof mockSupabase.from

    const { PATCH } = await import('@/app/api/leads/activity/route')
    const res = await PATCH(makeRequest('/api/leads/activity', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leadId: TEST_LEAD_ID, score: 75, status: 'qualified' }),
    }))
    expect(res.status).toBe(200)
    const json = await res.json() as { lead: { score: number } }
    expect(json.lead.score).toBe(75)
  })
})

describe('API Integration: /api/share', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST returns 401 when unauthenticated', async () => {
    mockSupabase = createMockSupabase({ user: null })
    const { POST } = await import('@/app/api/share/route')
    const res = await POST(makeRequest('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listingId: TEST_LISTING_ID }),
    }))
    expect(res.status).toBe(401)
  })

  it('POST returns 400 for invalid UUID', async () => {
    mockSupabase = createMockSupabase()
    const { POST } = await import('@/app/api/share/route')
    const res = await POST(makeRequest('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listingId: 'not-a-uuid' }),
    }))
    expect(res.status).toBe(400)
  })

  it('POST returns 404 when listing not found', async () => {
    const listingQuery = createQueryMock({ data: null, error: null })
    const sharesQuery = createQueryMock({
      data: { token: 'abc123' },
      error: null,
    })

    mockSupabase = createMockSupabase()
    let callIdx = 0
    const seq = [listingQuery, sharesQuery]
    mockSupabase.from = vi.fn(() => seq[callIdx++] ?? createQueryMock({ data: null, error: null })) as typeof mockSupabase.from

    const { POST } = await import('@/app/api/share/route')
    const res = await POST(makeRequest('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listingId: TEST_LISTING_ID }),
    }))
    expect(res.status).toBe(404)
  })

  it('POST creates share link successfully', async () => {
    const listingQuery = createQueryMock({
      data: { id: TEST_LISTING_ID, title: 'Test Property' },
      error: null,
    })
    const sharesQuery = createQueryMock({
      data: { token: 'generated-token-123' },
      error: null,
    })

    mockSupabase = createMockSupabase()
    let callIdx = 0
    const seq = [listingQuery, sharesQuery]
    mockSupabase.from = vi.fn(() => seq[callIdx++] ?? createQueryMock({ data: null, error: null })) as typeof mockSupabase.from

    const { POST } = await import('@/app/api/share/route')
    const res = await POST(makeRequest('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listingId: TEST_LISTING_ID }),
    }))
    expect(res.status).toBe(200)
    const json = await res.json() as { success: boolean; shareUrl: string; token: string }
    expect(json.success).toBe(true)
    expect(json.shareUrl).toContain('/share/')
    expect(json.token).toBeTruthy()
  })
})
