import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks.
 * Strips <script> tags, event handlers, and other dangerous elements.
 * Safe to use with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty: string): string {
  // DOMPurify requires a DOM environment — in SSR/Node, return stripped version
  if (typeof window === 'undefined') {
    // Basic server-side strip: remove script tags and event handlers
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bon\w+\s*=/gi, 'data-removed=');
  }
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true, svg: true },
    ADD_TAGS: ['style'],
    FORBID_TAGS: ['script'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

/**
 * Sanitize SVG content decoded from base64 data URLs.
 * Removes script tags and event handlers from SVG markup.
 */
export function sanitizeSvg(svgContent: string): string {
  if (typeof window === 'undefined') {
    return svgContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bon\w+\s*=/gi, 'data-removed=');
  }
  return DOMPurify.sanitize(svgContent, {
    USE_PROFILES: { svg: true },
    FORBID_TAGS: ['script'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
  });
}
