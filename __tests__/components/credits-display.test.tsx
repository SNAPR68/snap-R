// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CreditsDisplay } from '@/components/credits-display'

describe('CreditsDisplay', () => {
  it('renders credit count', () => {
    render(<CreditsDisplay credits={50} />)
    expect(screen.getByText('50 credits')).toBeInTheDocument()
  })

  it('shows warning when credits are low', () => {
    render(<CreditsDisplay credits={3} />)
    expect(screen.getByText('3 credits')).toBeInTheDocument()
  })

  it('shows insufficient state when required credits exceed available', () => {
    render(<CreditsDisplay credits={5} requiredCredits={10} />)
    expect(screen.getByText('5 credits')).toBeInTheDocument()
    expect(screen.getByText('(need 10)')).toBeInTheDocument()
  })

  it('does not show need text when credits are sufficient', () => {
    render(<CreditsDisplay credits={20} requiredCredits={5} />)
    expect(screen.queryByText(/need/)).not.toBeInTheDocument()
  })

  it('renders without warning when showWarning is false', () => {
    render(<CreditsDisplay credits={2} showWarning={false} />)
    expect(screen.getByText('2 credits')).toBeInTheDocument()
  })
})
