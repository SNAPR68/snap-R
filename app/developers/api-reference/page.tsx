'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'

interface SchemaProperty {
  type?: string
  format?: string
  description?: string
  example?: unknown
  enum?: string[]
  nullable?: boolean
  items?: SchemaProperty | { $ref?: string }
  properties?: Record<string, SchemaProperty>
  required?: string[]
  $ref?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  minItems?: number
  default?: unknown
}

interface PathOperation {
  tags?: string[]
  summary?: string
  description?: string
  operationId?: string
  parameters?: Array<{
    name: string
    in: string
    required?: boolean
    description?: string
    schema?: SchemaProperty
    $ref?: string
  }>
  requestBody?: {
    required?: boolean
    content?: Record<string, { schema?: SchemaProperty }>
  }
  responses?: Record<string, {
    description?: string
    content?: Record<string, { schema?: SchemaProperty; example?: unknown }>
  }>
}

interface OpenAPISpec {
  info: { title: string; version: string; description: string }
  paths: Record<string, Record<string, PathOperation>>
  components: {
    schemas: Record<string, SchemaProperty>
    parameters?: Record<string, { name: string; in: string; description?: string; schema?: SchemaProperty }>
    responses?: Record<string, { description?: string; content?: Record<string, { schema?: SchemaProperty; example?: unknown }> }>
  }
}

const METHOD_COLORS: Record<string, string> = {
  get: 'bg-green-500/20 text-green-400 border-green-500/30',
  post: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  patch: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  put: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  delete: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const TAG_ORDER = ['Listings', 'Photos', 'Video', 'Leads', 'Webhooks']

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // clipboard API may not be available
    })
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-on-surface-muted hover:text-on-surface/80"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function resolveRef(ref: string, spec: OpenAPISpec): SchemaProperty | undefined {
  // $ref format: #/components/schemas/Listing
  const parts = ref.replace('#/', '').split('/')
  let current: unknown = spec
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return current as SchemaProperty
}

function renderSchemaType(schema: SchemaProperty, spec: OpenAPISpec, depth = 0): string {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, spec)
    if (resolved) return renderSchemaType(resolved, spec, depth)
    const name = schema.$ref.split('/').pop()
    return name ?? 'object'
  }

  if (schema.type === 'array') {
    const itemSchema = schema.items
    if (itemSchema) {
      if ('$ref' in itemSchema && itemSchema.$ref) {
        const name = itemSchema.$ref.split('/').pop()
        return `${name ?? 'object'}[]`
      }
      return `${renderSchemaType(itemSchema as SchemaProperty, spec, depth)}[]`
    }
    return 'array'
  }

  if (schema.enum) {
    return schema.enum.map(v => `"${v}"`).join(' | ')
  }

  return schema.type ?? 'object'
}

function SchemaTable({ schema, spec, depth = 0 }: { schema: SchemaProperty; spec: OpenAPISpec; depth?: number }) {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, spec)
    if (resolved) return <SchemaTable schema={resolved} spec={spec} depth={depth} />
    return null
  }

  if (!schema.properties) return null

  const requiredFields = schema.required ?? []

  return (
    <div className={`${depth > 0 ? 'ml-4 border-l border-white/10 pl-4' : ''}`}>
      {Object.entries(schema.properties).map(([name, prop]) => {
        const resolvedProp = prop.$ref ? resolveRef(prop.$ref, spec) ?? prop : prop
        const isRequired = requiredFields.includes(name)
        const typeStr = renderSchemaType(resolvedProp, spec, depth)

        return (
          <div key={name} className="py-2 border-b border-white/5 last:border-0">
            <div className="flex items-start gap-2">
              <code className="text-sm text-primary font-mono">{name}</code>
              <span className="text-xs text-white/30 font-mono">{typeStr}</span>
              {isRequired && (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">required</span>
              )}
              {resolvedProp.nullable && (
                <span className="text-[10px] bg-white/10 text-on-surface-muted px-1.5 py-0.5 rounded">nullable</span>
              )}
            </div>
            {resolvedProp.description && (
              <p className="text-xs text-on-surface-muted mt-0.5">{resolvedProp.description}</p>
            )}
            {resolvedProp.example !== undefined && (
              <p className="text-xs text-white/30 mt-0.5">Example: <code className="text-on-surface-muted">{JSON.stringify(resolvedProp.example)}</code></p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EndpointCard({
  method,
  path,
  operation,
  spec,
}: {
  method: string
  path: string
  operation: PathOperation
  spec: OpenAPISpec
}) {
  const [expanded, setExpanded] = useState(false)

  // Build curl example
  const curlParts = [`curl -X ${method.toUpperCase()}`]
  curlParts.push(`  -H "Authorization: Bearer YOUR_API_KEY"`)

  const requestSchema = operation.requestBody?.content?.['application/json']?.schema
  if (requestSchema) {
    curlParts.push(`  -H "Content-Type: application/json"`)
    curlParts.push(`  -d '{ ... }'`)
  }
  curlParts.push(`  https://snap-r.com${path}`)
  const curlExample = curlParts.join(' \\\n')

  // Get response schema for 200/201/202
  const successCode = Object.keys(operation.responses ?? {}).find(c => c.startsWith('2'))
  const successResponse = successCode ? operation.responses?.[successCode] : undefined
  const responseSchema = successResponse?.content?.['application/json']?.schema

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden mb-3 hover:border-white/20 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${METHOD_COLORS[method] ?? 'text-gray-400'}`}>
          {method.toUpperCase()}
        </span>
        <code className="text-sm text-on-surface font-mono flex-1">{path}</code>
        <span className="text-xs text-on-surface-muted hidden md:inline">{operation.summary}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/30" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-4 bg-white/[0.02]">
          {/* Description */}
          {operation.description && (
            <p className="text-sm text-white/70">{operation.description}</p>
          )}

          {/* Parameters */}
          {operation.parameters && operation.parameters.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider mb-2">Parameters</h4>
              <div className="bg-black/30 rounded-lg p-3">
                {operation.parameters.map((param, i) => {
                  // Resolve $ref parameters
                  let resolvedParam = param
                  if (param.$ref) {
                    const refPath = param.$ref.replace('#/', '').split('/')
                    let resolved: unknown = spec
                    for (const p of refPath) {
                      resolved = (resolved as Record<string, unknown>)?.[p]
                    }
                    if (resolved) resolvedParam = resolved as typeof param
                  }

                  return (
                    <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                      <code className="text-xs text-primary font-mono">{resolvedParam.name}</code>
                      <span className="text-[10px] bg-white/10 text-on-surface-muted px-1 rounded">{resolvedParam.in}</span>
                      {resolvedParam.required && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded">required</span>
                      )}
                      {resolvedParam.description && (
                        <span className="text-xs text-on-surface-muted">{resolvedParam.description}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Request Body */}
          {requestSchema && (
            <div>
              <h4 className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider mb-2">Request Body</h4>
              <div className="bg-black/30 rounded-lg p-3">
                <SchemaTable schema={requestSchema} spec={spec} />
              </div>
            </div>
          )}

          {/* Response */}
          {responseSchema && (
            <div>
              <h4 className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider mb-2">
                Response <span className="text-green-400">{successCode}</span>
              </h4>
              <div className="bg-black/30 rounded-lg p-3">
                <SchemaTable schema={responseSchema} spec={spec} />
              </div>
            </div>
          )}

          {/* Curl Example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider">Try it</h4>
              <CopyButton text={curlExample} />
            </div>
            <pre className="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto">
              <code className="text-green-400">{curlExample}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApiReferencePage() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/openapi.json', { signal: AbortSignal.timeout(15000) })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load spec: ${res.status}`)
        return res.json()
      })
      .then((data: OpenAPISpec) => {
        setSpec(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load API specification'
        setError(message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-muted">Loading API Reference...</p>
        </div>
      </div>
    )
  }

  if (error || !spec) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error ?? 'Failed to load specification'}</p>
          <Link href="/developers" className="text-primary underline">Back to Developer Docs</Link>
        </div>
      </div>
    )
  }

  // Group endpoints by tag
  const endpointsByTag: Record<string, Array<{ method: string; path: string; operation: PathOperation }>> = {}

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const tag = operation.tags?.[0] ?? 'Other'
      if (!endpointsByTag[tag]) endpointsByTag[tag] = []
      endpointsByTag[tag].push({ method, path, operation })
    }
  }

  const sortedTags = TAG_ORDER.filter(t => endpointsByTag[t])

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/developers"
            className="inline-flex items-center gap-1.5 text-sm text-on-surface-muted hover:text-on-surface mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Developer Docs
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold">API Reference</h1>
            <span className="px-2 py-0.5 bg-[#D4A017]/20 text-primary text-xs font-mono rounded">
              v{spec.info.version}
            </span>
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-on-surface-muted hover:text-white/70 transition-colors ml-auto"
            >
              OpenAPI JSON <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-on-surface-muted max-w-2xl">{spec.info.description}</p>
        </div>

        {/* Base URL */}
        <div className="glass-luxury rounded-xl p-4 mb-8 flex items-center gap-3">
          <span className="text-xs text-on-surface-muted uppercase tracking-wider font-semibold">Base URL</span>
          <code className="text-sm text-primary font-mono">https://snap-r.com</code>
          <CopyButton text="https://snap-r.com" />
        </div>

        {/* Auth reminder */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
          <p className="text-sm text-white/70">
            All endpoints require a <code className="text-primary bg-black/30 px-1.5 py-0.5 rounded">Bearer</code> token.
            Create API keys in{' '}
            <Link href="/dashboard/settings/api-keys" className="text-primary underline">Dashboard Settings</Link>.
            Keys start with <code className="text-on-surface bg-black/30 px-1.5 py-0.5 rounded">sk_live_</code>.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-10">
          <h2 className="text-sm font-semibold text-on-surface-muted uppercase tracking-wider mb-3">Resources</h2>
          <div className="flex flex-wrap gap-2">
            {sortedTags.map(tag => (
              <a
                key={tag}
                href={`#${tag.toLowerCase()}`}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:text-on-surface hover:border-[#D4A017]/30 transition-colors"
              >
                {tag}
                <span className="ml-1.5 text-white/30 text-xs">{endpointsByTag[tag].length}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* Endpoints by tag */}
        {sortedTags.map(tag => (
          <section key={tag} id={tag.toLowerCase()} className="mb-12 scroll-mt-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#D4A017] rounded-full" />
              {tag}
            </h2>
            {endpointsByTag[tag].map((ep, i) => (
              <EndpointCard
                key={`${ep.method}-${ep.path}-${i}`}
                method={ep.method}
                path={ep.path}
                operation={ep.operation}
                spec={spec}
              />
            ))}
          </section>
        ))}

        {/* Error Codes */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-red-500 rounded-full" />
            Error Codes
          </h2>
          <div className="glass-luxury rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-on-surface-muted font-medium">Code</th>
                  <th className="text-left p-3 text-on-surface-muted font-medium">HTTP Status</th>
                  <th className="text-left p-3 text-on-surface-muted font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: 'validation_error', status: '400', desc: 'Request body or parameters failed validation' },
                  { code: 'unauthorized', status: '401', desc: 'Missing or invalid API key' },
                  { code: 'not_found', status: '404', desc: 'Resource does not exist or is not owned by you' },
                  { code: 'rate_limited', status: '429', desc: 'Too many requests. Check Retry-After header' },
                  { code: 'internal_error', status: '500', desc: 'Server error. Contact support if persistent' },
                ].map(row => (
                  <tr key={row.code} className="border-b border-white/5 last:border-0">
                    <td className="p-3"><code className="text-primary text-xs">{row.code}</code></td>
                    <td className="p-3 text-white/70">{row.status}</td>
                    <td className="p-3 text-on-surface-muted">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-yellow-500 rounded-full" />
            Rate Limits
          </h2>
          <div className="glass-luxury rounded-xl p-5">
            <p className="text-sm text-white/70 mb-3">
              Default: <strong className="text-on-surface">60 requests per minute</strong> per API key.
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex gap-3">
                <code className="text-on-surface/80 font-mono text-xs min-w-[180px]">X-RateLimit-Limit</code>
                <span className="text-on-surface-muted">Max requests per window</span>
              </div>
              <div className="flex gap-3">
                <code className="text-on-surface/80 font-mono text-xs min-w-[180px]">X-RateLimit-Remaining</code>
                <span className="text-on-surface-muted">Remaining requests</span>
              </div>
              <div className="flex gap-3">
                <code className="text-on-surface/80 font-mono text-xs min-w-[180px]">X-RateLimit-Reset</code>
                <span className="text-on-surface-muted">Unix timestamp when window resets</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center glass-gold-luxury rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-2">Ready to integrate?</h2>
          <p className="text-on-surface-muted mb-4">Create your API key and start building.</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard/settings/api-keys"
              className="px-6 py-3 bg-[#D4A017] text-black font-bold rounded-lg hover:bg-[#B8860B] transition-colors"
            >
              Get API Key
            </Link>
            <Link
              href="/developers"
              className="px-6 py-3 bg-white/10 text-on-surface font-medium rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Developer Docs
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
