// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SkipNav } from '@/components/skip-nav'

describe('SkipNav', () => {
  it('renders a skip navigation link', () => {
    render(<SkipNav />)
    const link = screen.getByText('Skip to main content')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '#main-content')
  })

  it('has sr-only class for screen reader visibility', () => {
    render(<SkipNav />)
    const link = screen.getByText('Skip to main content')
    expect(link).toHaveClass('sr-only')
  })

  it('renders as an anchor element', () => {
    render(<SkipNav />)
    const link = screen.getByText('Skip to main content')
    expect(link.tagName).toBe('A')
  })
})
