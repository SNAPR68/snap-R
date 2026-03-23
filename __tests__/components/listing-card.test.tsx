// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ListingCard } from '@/components/listing-card'

vi.mock('next/image', () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: Record<string, unknown>) => {
    const { fill, priority, unoptimized, ...rest } = props as Record<string, unknown>
    void fill; void priority; void unoptimized
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...rest} />
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <a {...props}>{children}</a>
  ),
}))

function makeListing(overrides = {}) {
  return {
    id: 'listing-1',
    title: '123 Main Street',
    thumbnail: '/photos/thumb.jpg',
    count: 12,
    ...overrides,
  }
}

describe('ListingCard', () => {
  it('renders listing title', () => {
    render(<ListingCard {...makeListing()} />)
    expect(screen.getByText('123 Main Street')).toBeInTheDocument()
  })

  it('renders photo count', () => {
    render(<ListingCard {...makeListing({ count: 8 })} />)
    expect(screen.getByText('8 photos')).toBeInTheDocument()
  })

  it('renders thumbnail image with alt text', () => {
    render(<ListingCard {...makeListing()} />)
    const img = screen.getByAltText('123 Main Street')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/photos/thumb.jpg')
  })

  it('links to the listing page', () => {
    render(<ListingCard {...makeListing({ id: 'abc-123' })} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/listings/abc-123')
  })
})
