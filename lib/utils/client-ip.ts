/**
 * Extract client IP from request headers.
 * Checks x-forwarded-for first, then x-real-ip, falls back to 'unknown'.
 */
export function getClientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') || 'unknown'
}
