// @vitest-environment jsdom
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CookieConsent } from '@/components/cookie-consent'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <a {...props}>{children}</a>,
}))

beforeEach(() => {
  localStorage.clear()
})

describe('CookieConsent', () => {
  it('shows banner after delay when no consent stored', async () => {
    vi.useFakeTimers()
    render(<CookieConsent />)
    expect(screen.queryByText(/We use cookies/)).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText(/We use cookies/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('does not show banner when consent already stored', async () => {
    vi.useFakeTimers()
    localStorage.setItem('snapr-cookie-consent', JSON.stringify({ accepted: true }))
    render(<CookieConsent />)

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.queryByText(/We use cookies/)).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('renders Accept and Decline buttons when visible', async () => {
    vi.useFakeTimers()
    render(<CookieConsent />)

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('contains a link to privacy policy', async () => {
    vi.useFakeTimers()
    render(<CookieConsent />)

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText('Learn more')).toHaveAttribute('href', '/privacy')
    vi.useRealTimers()
  })
})
