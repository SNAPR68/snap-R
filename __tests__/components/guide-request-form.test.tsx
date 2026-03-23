// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GuideRequestForm } from '@/components/guide-request-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('GuideRequestForm', () => {
  it('renders the form with email input', () => {
    render(<GuideRequestForm source="homepage" />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
  })

  it('renders a submit button', () => {
    render(<GuideRequestForm source="homepage" />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
