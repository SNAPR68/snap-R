// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CelebrationModal } from '@/components/celebration-modal'

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const filteredProps: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(props)) {
        if (!['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap'].includes(key)) {
          filteredProps[key] = val
        }
      }
      return <div {...filteredProps}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CheckCircle: () => <span data-testid="check-icon" />,
  Sparkles: () => <span data-testid="sparkles-icon" />,
  ArrowRight: () => <span data-testid="arrow-icon" />,
}))

function dispatchPreparationComplete(detail: {
  listingTitle: string
  totalPhotos: number
  confidence: number
  listingId: string
}) {
  act(() => {
    window.dispatchEvent(new CustomEvent('snapr:preparation-complete', { detail }))
  })
}

describe('CelebrationModal', () => {
  it('renders nothing initially (no event dispatched)', () => {
    render(<CelebrationModal />)
    expect(screen.queryByText('Listing Prepared!')).not.toBeInTheDocument()
  })

  it('shows modal when custom event is dispatched', () => {
    render(<CelebrationModal />)
    dispatchPreparationComplete({
      listingTitle: '123 Main St',
      totalPhotos: 15,
      confidence: 92,
      listingId: 'abc-123',
    })
    expect(screen.getByText('Listing Prepared!')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('15 enhanced photos')).toBeInTheDocument()
    // 92% appears twice (description + stat), so use getAllByText
    expect(screen.getAllByText('92%')).toHaveLength(2)
  })

  it('shows photo count stat', () => {
    render(<CelebrationModal />)
    dispatchPreparationComplete({
      listingTitle: 'Test',
      totalPhotos: 25,
      confidence: 85,
      listingId: 'id-1',
    })
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('Photos')).toBeInTheDocument()
  })

  it('hides confidence when zero', () => {
    render(<CelebrationModal />)
    dispatchPreparationComplete({
      listingTitle: 'Test',
      totalPhotos: 10,
      confidence: 0,
      listingId: 'id-2',
    })
    expect(screen.queryByText('Confidence')).not.toBeInTheDocument()
  })

  it('links to content studio with listing ID', () => {
    render(<CelebrationModal />)
    dispatchPreparationComplete({
      listingTitle: 'Test',
      totalPhotos: 10,
      confidence: 90,
      listingId: 'listing-xyz',
    })
    const link = screen.getByText('Generate Marketing Content').closest('a')
    expect(link).toHaveAttribute('href', '/dashboard/content-studio?listing=listing-xyz')
  })

  it('closes modal when Stay in Studio clicked', () => {
    render(<CelebrationModal />)
    dispatchPreparationComplete({
      listingTitle: 'Test',
      totalPhotos: 5,
      confidence: 80,
      listingId: 'id-3',
    })
    expect(screen.getByText('Listing Prepared!')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Stay in Studio'))
    expect(screen.queryByText('Listing Prepared!')).not.toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    render(<CelebrationModal />)
    dispatchPreparationComplete({
      listingTitle: 'Test',
      totalPhotos: 5,
      confidence: 80,
      listingId: 'id-4',
    })
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-label', 'Listing preparation complete')
  })
})
