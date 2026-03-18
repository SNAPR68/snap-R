import DOMPurify from 'dompurify';

/**
 * Strip dangerous HTML content on the server side (no DOM available).
 * Removes: script tags, event handlers, javascript: URIs, data: URIs in href/src,
 * iframe/object/embed tags, and meta refresh redirects.
 */
function serverSideStrip(dirty: string): string {
  return dirty
    // Remove script tags (including nested)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove dangerous tags entirely
    .replace(/<(iframe|object|embed|applet|form|base|link|meta)\b[^>]*\/?>/gi, '')
    .replace(/<\/(iframe|object|embed|applet|form|base|link|meta)>/gi, '')
    // Remove all event handler attributes (on*)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: and vbscript: protocol URIs
    .replace(/(href|src|action|formaction|xlink:href)\s*=\s*(?:"[^"]*(?:javascript|vbscript|data)\s*:[^"]*"|'[^']*(?:javascript|vbscript|data)\s*:[^']*')/gi, '$1=""')
    // Remove style expressions (IE CSS expression attack)
    .replace(/expression\s*\(/gi, 'blocked(');
}

/**
 * Sanitize HTML to prevent XSS attacks.
 * Uses DOMPurify on the client, comprehensive regex stripping on the server.
 * Safe to use with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    return serverSideStrip(dirty);
  }
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true, svg: true },
    ADD_TAGS: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'base'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onmouseenter'],
  });
}

/**
 * Sanitize SVG content decoded from base64 data URLs.
 * Uses DOMPurify on the client, comprehensive regex stripping on the server.
 */
export function sanitizeSvg(svgContent: string): string {
  if (typeof window === 'undefined') {
    return serverSideStrip(svgContent);
  }
  return DOMPurify.sanitize(svgContent, {
    USE_PROFILES: { svg: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'foreignObject'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
  });
}
