// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MarketingBanner, type MarketingJobData } from '@/components/marketing-banner'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

function makeJob(overrides: Partial<MarketingJobData> = {}): MarketingJobData {
  return {
    id: 'job-1',
    status: 'completed',
    description: { status: 'completed', result: 'A beautiful property...' },
    captions: { status: 'completed', result: { instagram: 'post' } },
    mls: { status: 'completed', result: { photos: [] } },
    propertySite: { status: 'completed', result: { slug: 'test' } },
    scheduledPosts: { status: 'completed', result: { count: 3 } },
    video: { status: 'pending', result: null },
    totalCostCents: 25,
    costBreakdown: null,
    startedAt: '2026-03-16T00:00:00Z',
    completedAt: '2026-03-16T00:01:00Z',
    error: null,
    ...overrides,
  }
}

describe('MarketingBanner', () => {
  it('returns null when no marketing activity', () => {
    const { container } = render(
      <MarketingBanner marketingStatus={null} marketingJob={null} onViewResults={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows upgrade prompt for skipped (free-tier) users', () => {
    render(
      <MarketingBanner marketingStatus="skipped" marketingJob={null} onViewResults={vi.fn()} />
    )
    expect(screen.getByText('Marketing Automation')).toBeInTheDocument()
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Upgrade to Pro/i })).toHaveAttribute('href', '/dashboard/billing')
  })

  it('shows processing state with step count', () => {
    const job = makeJob({
      status: 'processing',
      description: { status: 'completed', result: 'done' },
      captions: { status: 'processing', result: null },
      mls: { status: 'pending', result: null },
      propertySite: { status: 'pending', result: null },
      scheduledPosts: { status: 'pending', result: null },
      video: { status: 'pending', result: null },
    })
    render(
      <MarketingBanner marketingStatus="processing" marketingJob={job} onViewResults={vi.fn()} />
    )
    expect(screen.getByText('Marketing Pipeline')).toBeInTheDocument()
    expect(screen.getByText('1/6 steps')).toBeInTheDocument()
    expect(screen.getByText('Captions...')).toBeInTheDocument()
  })

  it('shows completed state with artifact summary', () => {
    const job = makeJob()
    render(
      <MarketingBanner marketingStatus="completed" marketingJob={job} onViewResults={vi.fn()} />
    )
    expect(screen.getByText('Marketing Complete')).toBeInTheDocument()
    expect(screen.getByText('5 artifacts generated')).toBeInTheDocument()
    expect(screen.getByText('Property site live')).toBeInTheDocument()
    expect(screen.getByText('Posts scheduled')).toBeInTheDocument()
  })

  it('shows video ready when video step is completed', () => {
    const job = makeJob({ video: { status: 'completed', result: { url: 'https://...' } } })
    render(
      <MarketingBanner marketingStatus="completed" marketingJob={job} onViewResults={vi.fn()} />
    )
    expect(screen.getByText('Video ready')).toBeInTheDocument()
  })

  it('calls onViewResults when View Results button clicked', () => {
    const onViewResults = vi.fn()
    const job = makeJob()
    render(
      <MarketingBanner marketingStatus="completed" marketingJob={job} onViewResults={onViewResults} />
    )
    fireEvent.click(screen.getByText('View Results'))
    expect(onViewResults).toHaveBeenCalledOnce()
  })

  it('shows failed state with error message', () => {
    const job = makeJob({ status: 'failed', error: 'OpenAI rate limited' })
    render(
      <MarketingBanner marketingStatus="failed" marketingJob={job} onViewResults={vi.fn()} />
    )
    expect(screen.getByText('Marketing Failed')).toBeInTheDocument()
    expect(screen.getByText('OpenAI rate limited')).toBeInTheDocument()
  })

  it('shows View Details button in failed state', () => {
    const onViewResults = vi.fn()
    const job = makeJob({ status: 'failed', error: 'error' })
    render(
      <MarketingBanner marketingStatus="failed" marketingJob={job} onViewResults={onViewResults} />
    )
    fireEvent.click(screen.getByText('View Details'))
    expect(onViewResults).toHaveBeenCalledOnce()
  })

  it('shows Unknown error when failed with no error message', () => {
    const job = makeJob({ status: 'failed', error: null })
    render(
      <MarketingBanner marketingStatus="failed" marketingJob={job} onViewResults={vi.fn()} />
    )
    expect(screen.getByText('Unknown error')).toBeInTheDocument()
  })

  it('handles processing state from marketingStatus alone (no job)', () => {
    render(
      <MarketingBanner marketingStatus="processing" marketingJob={null} onViewResults={vi.fn()} />
    )
    expect(screen.getByText('Marketing Pipeline')).toBeInTheDocument()
    expect(screen.getByText('0/6 steps')).toBeInTheDocument()
  })
})
