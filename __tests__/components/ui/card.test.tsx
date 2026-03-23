// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card><div>Card content</div></Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders full card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Body content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('applies custom className to Card', () => {
    const { container } = render(<Card className="custom-card">Content</Card>)
    expect(container.firstChild).toHaveClass('custom-card')
  })
})
