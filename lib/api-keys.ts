/**
 * SnapR API Key Management
 * ========================
 * Generate, validate, and track API keys for the public developer API.
 * Keys use sk_live_ prefix with SHA-256 hashing for storage.
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'

const KEY_PREFIX = 'sk_live_'
const PREFIX_DISPLAY_LENGTH = 14 // 'sk_live_' + 6 chars

interface GeneratedKey {
  key: string
  keyPrefix: string
  keyHash: string
}

interface ValidatedKey {
  valid: true
  userId: string
  keyId: string
  scopes: string[]
  rateLimitPerMinute: number
}

interface InvalidKey {
  valid: false
}

export type ApiKeyValidation = ValidatedKey | InvalidKey

/**
 * Generate a new API key.
 * Returns the full key (show once), display prefix, and SHA-256 hash for storage.
 */
export function generateApiKey(): GeneratedKey {
  const randomPart = randomBytes(32).toString('base64url')
  const key = `${KEY_PREFIX}${randomPart}`
  const keyPrefix = key.substring(0, PREFIX_DISPLAY_LENGTH)
  const keyHash = createHash('sha256').update(key).digest('hex')

  return { key, keyPrefix, keyHash }
}

/**
 * Validate an API key from a Bearer token.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export async function validateApiKey(bearerToken: string): Promise<ApiKeyValidation> {
  if (!bearerToken.startsWith(KEY_PREFIX)) {
    return { valid: false }
  }

  const keyHash = createHash('sha256').update(bearerToken).digest('hex')
  const keyPrefix = bearerToken.substring(0, PREFIX_DISPLAY_LENGTH)

  const supabase = adminSupabase()

  // Look up by prefix first (indexed), then verify hash
  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('id, user_id, key_hash, scopes, rate_limit_per_minute, is_active, expires_at')
    .eq('key_prefix', keyPrefix)
    .eq('is_active', true)

  if (error || !keys || keys.length === 0) {
    return { valid: false }
  }

  // Find matching key using timing-safe comparison
  for (const apiKey of keys) {
    const storedHash = Buffer.from(apiKey.key_hash, 'hex')
    const providedHash = Buffer.from(keyHash, 'hex')

    if (storedHash.length === providedHash.length && timingSafeEqual(storedHash, providedHash)) {
      // Check expiration
      if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
        return { valid: false }
      }

      // Update last_used_at (fire-and-forget)
      void supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKey.id)
        .then(() => { /* fire-and-forget */ })

      return {
        valid: true,
        userId: apiKey.user_id,
        keyId: apiKey.id,
        scopes: apiKey.scopes ?? [],
        rateLimitPerMinute: apiKey.rate_limit_per_minute ?? 60,
      }
    }
  }

  return { valid: false }
}

/**
 * Log API usage for billing and analytics. Never throws.
 */
export function logApiUsage(
  keyId: string,
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number
): void {
  const supabase = adminSupabase()

  void supabase
    .from('api_usage')
    .insert({
      api_key_id: keyId,
      user_id: userId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
    })
    .then(() => { /* fire-and-forget */ })
}
