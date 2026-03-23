// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter description" />)
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
  })

  it('accepts user input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Textarea onChange={onChange} placeholder="Type here" />)
    await user.type(screen.getByPlaceholderText('Type here'), 'Hello world')
    expect(onChange).toHaveBeenCalled()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Textarea disabled placeholder="Disabled" />)
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-textarea" placeholder="test" />)
    expect(screen.getByPlaceholderText('test')).toHaveClass('custom-textarea')
  })
})
