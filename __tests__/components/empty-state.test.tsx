// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EmptyState } from '@/components/empty-state'

describe('EmptyState', () => {
  it('renders no-photos state', () => {
    render(<EmptyState type="no-photos" />)
    expect(screen.getByText('No photos yet')).toBeInTheDocument()
    expect(screen.getByText(/Upload your listing photos/)).toBeInTheDocument()
  })

  it('renders no-enhanced state', () => {
    render(<EmptyState type="no-enhanced" />)
    expect(screen.getByText('No enhanced photos')).toBeInTheDocument()
  })

  it('renders no-shared state', () => {
    render(<EmptyState type="no-shared" />)
    expect(screen.getByText('Nothing shared yet')).toBeInTheDocument()
  })

  it('renders no-downloads state', () => {
    render(<EmptyState type="no-downloads" />)
    expect(screen.getByText('Ready for download')).toBeInTheDocument()
  })

  it('renders action element when provided', () => {
    render(<EmptyState type="no-photos" action={<button>Upload</button>} />)
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
  })
})
