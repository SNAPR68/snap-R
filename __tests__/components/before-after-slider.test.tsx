// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BeforeAfterSlider } from '@/components/before-after-slider'

// Mock next/image
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
    const filteredProps: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(props)) {
      if (['className', 'style', 'draggable', 'width', 'height'].includes(key)) {
        filteredProps[key] = val
      }
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...filteredProps} />
  },
}))

describe('BeforeAfterSlider', () => {
  it('renders before and after images', () => {
    render(
      <BeforeAfterSlider
        beforeUrl="/before.jpg"
        afterUrl="/after.jpg"
      />
    )
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('alt', 'After')
    expect(images[1]).toHaveAttribute('alt', 'Before')
  })

  it('uses custom labels', () => {
    render(
      <BeforeAfterSlider
        beforeUrl="/before.jpg"
        afterUrl="/after.jpg"
        beforeLabel="Original"
        afterLabel="Enhanced"
      />
    )
    expect(screen.getByText('Enhanced • Enhanced')).toBeInTheDocument()
    expect(screen.getByText('Original • Original')).toBeInTheDocument()
  })

  it('shows default labels', () => {
    render(
      <BeforeAfterSlider beforeUrl="/a.jpg" afterUrl="/b.jpg" />
    )
    expect(screen.getByText('After • Enhanced')).toBeInTheDocument()
    expect(screen.getByText('Before • Original')).toBeInTheDocument()
  })

  it('renders tool badges when toolsApplied provided', () => {
    render(
      <BeforeAfterSlider
        beforeUrl="/a.jpg"
        afterUrl="/b.jpg"
        toolsApplied={['sky-replacement', 'hdr', 'virtual-staging']}
      />
    )
    expect(screen.getByText('Sky Replacement')).toBeInTheDocument()
    expect(screen.getByText('HDR')).toBeInTheDocument()
    expect(screen.getByText('Virtual Staging')).toBeInTheDocument()
  })

  it('formats unknown tool names with title case', () => {
    render(
      <BeforeAfterSlider
        beforeUrl="/a.jpg"
        afterUrl="/b.jpg"
        toolsApplied={['new-cool-tool']}
      />
    )
    expect(screen.getByText('New Cool Tool')).toBeInTheDocument()
  })

  it('shows no tool badges when toolsApplied is empty', () => {
    render(
      <BeforeAfterSlider beforeUrl="/a.jpg" afterUrl="/b.jpg" toolsApplied={[]} />
    )
    // The tool badges section should not render at all
    expect(screen.queryByText('Sky Replacement')).not.toBeInTheDocument()
    expect(screen.queryByText('HDR')).not.toBeInTheDocument()
  })

  it('formats all known tool names correctly', () => {
    const knownTools = [
      { key: 'sky-replacement', display: 'Sky Replacement' },
      { key: 'virtual-twilight', display: 'Virtual Twilight' },
      { key: 'lawn-repair', display: 'Lawn Repair' },
      { key: 'pool-enhance', display: 'Pool Enhancement' },
      { key: 'auto-enhance', display: 'Auto Enhance' },
      { key: 'declutter', display: 'Declutter' },
      { key: 'fire-fireplace', display: 'Fireplace Glow' },
      { key: 'tv-screen', display: 'TV Screen' },
      { key: 'lights-on', display: 'Lights On' },
      { key: 'window-masking', display: 'Window Balance' },
      { key: 'perspective-correction', display: 'Perspective Fix' },
    ]

    for (const { key, display } of knownTools) {
      const { unmount } = render(
        <BeforeAfterSlider beforeUrl="/a.jpg" afterUrl="/b.jpg" toolsApplied={[key]} />
      )
      expect(screen.getByText(display)).toBeInTheDocument()
      unmount()
    }
  })

  it('applies custom className', () => {
    const { container } = render(
      <BeforeAfterSlider beforeUrl="/a.jpg" afterUrl="/b.jpg" className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
