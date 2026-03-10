/**
 * Tests for lib/utils/html-escape.ts — XSS prevention
 */

import { describe, it, expect } from 'vitest'
import { escapeHtml } from '@/lib/utils/html-escape'

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's fine")).toBe('it&#39;s fine')
  })

  it('escapes all special characters together', () => {
    expect(escapeHtml('<div class="x" data-val=\'y\'>&</div>')).toBe(
      '&lt;div class=&quot;x&quot; data-val=&#39;y&#39;&gt;&amp;&lt;/div&gt;'
    )
  })

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('returns plain text unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123')
  })

  it('handles multiple consecutive special chars', () => {
    expect(escapeHtml('<<>>')).toBe('&lt;&lt;&gt;&gt;')
  })
})
