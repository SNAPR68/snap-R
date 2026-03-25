import { Code2, Key, Zap, Shield, Webhook } from 'lucide-react'

export const metadata = {
  title: 'SnapR API | Developer Docs and Webhooks',
  description: 'Explore the SnapR API, webhook events, and developer tools for integrating AI-powered real estate photo enhancement into your workflow.',
  alternates: {
    canonical: '/developers',
  },
}

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold font-serif tracking-tighter">SnapR API</h1>
            <span className="px-2 py-0.5 bg-primary/20 text-primary uppercase tracking-wide text-[0.6875rem] font-mono rounded-sm">v1</span>
          </div>
          <p className="text-gray-400 text-lg">
            Use the SnapR API and webhooks to connect AI real estate photo enhancement to your existing tools and workflows.
          </p>
        </header>

        <main>

        {/* Auth Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-serif tracking-tighter">Authentication</h2>
          </div>
          <div className="bg-surface-container-low rounded-lg p-6">
            <p className="text-gray-300 mb-4">
              All API requests require a Bearer token in the Authorization header. Create API keys in your{' '}
              <a href="/dashboard/settings/api-keys" className="text-primary underline">Dashboard Settings</a>.
            </p>
            <pre className="bg-black/50 rounded-lg p-4 text-sm overflow-x-auto">
              <code className="text-green-400">{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://snap-r.com/api/v1/listings`}</code>
            </pre>
            <p className="text-gray-500 text-sm mt-3">
              API keys start with <code className="text-on-surface">sk_live_</code>. Keep them secret — never expose in client-side code.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-serif tracking-tighter">Endpoints</h2>
          </div>

          {/* Listings */}
          <EndpointGroup title="Listings" endpoints={[
            { method: 'GET', path: '/api/v1/listings', desc: 'List all listings. Supports ?page=1&per_page=50' },
            { method: 'POST', path: '/api/v1/listings', desc: 'Create a new listing' },
            { method: 'GET', path: '/api/v1/listings/:id', desc: 'Get listing details with photos' },
            { method: 'PATCH', path: '/api/v1/listings/:id', desc: 'Update listing fields' },
            { method: 'DELETE', path: '/api/v1/listings/:id', desc: 'Delete a listing' },
          ]} />

          {/* Photos */}
          <EndpointGroup title="Photos" endpoints={[
            { method: 'GET', path: '/api/v1/listings/:id/photos', desc: 'List photos for a listing' },
            { method: 'POST', path: '/api/v1/photos/:id/enhance', desc: 'Apply AI enhancement to a photo' },
          ]} />

          {/* Preparation & Marketing */}
          <EndpointGroup title="Preparation & Marketing" endpoints={[
            { method: 'POST', path: '/api/v1/listings/:id/prepare', desc: 'Trigger AI preparation pipeline' },
            { method: 'GET', path: '/api/v1/listings/:id/status', desc: 'Get preparation + marketing status' },
          ]} />

          {/* Video */}
          <EndpointGroup title="Video" endpoints={[
            { method: 'POST', path: '/api/v1/video/generate', desc: 'Trigger video render (returns render_id)' },
            { method: 'GET', path: '/api/v1/video/:renderId', desc: 'Get video render status + output URL' },
          ]} />

          {/* Leads */}
          <EndpointGroup title="Leads" endpoints={[
            { method: 'GET', path: '/api/v1/leads', desc: 'List leads. Supports ?listing_id=&page=&per_page=' },
            { method: 'POST', path: '/api/v1/leads', desc: 'Create a new lead' },
          ]} />

          {/* Webhooks */}
          <EndpointGroup title="Webhooks" endpoints={[
            { method: 'GET', path: '/api/v1/webhooks', desc: 'List outgoing webhooks' },
            { method: 'POST', path: '/api/v1/webhooks', desc: 'Create a webhook endpoint' },
            { method: 'PATCH', path: '/api/v1/webhooks', desc: 'Update webhook config' },
            { method: 'DELETE', path: '/api/v1/webhooks', desc: 'Delete a webhook' },
          ]} />
        </section>

        {/* Response Format */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold font-serif tracking-tighter mb-4">Response Format</h2>
          <div className="bg-surface-container-low rounded-lg p-6 space-y-4">
            <div>
              <p className="text-gray-400 mb-2">Success (single item):</p>
              <pre className="bg-black/50 rounded-lg p-3 text-sm">
                <code className="text-green-400">{`{ "data": { "id": "...", "title": "..." } }`}</code>
              </pre>
            </div>
            <div>
              <p className="text-gray-400 mb-2">Success (list):</p>
              <pre className="bg-black/50 rounded-lg p-3 text-sm">
                <code className="text-green-400">{`{ "data": [...], "meta": { "page": 1, "per_page": 50, "total": 123 } }`}</code>
              </pre>
            </div>
            <div>
              <p className="text-gray-400 mb-2">Error:</p>
              <pre className="bg-black/50 rounded-lg p-3 text-sm">
                <code className="text-red-400">{`{ "error": { "message": "...", "code": "validation_error" } }`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-serif tracking-tighter">Rate Limits</h2>
          </div>
          <div className="bg-surface-container-low rounded-lg p-6">
            <p className="text-gray-300 mb-3">Default: <strong className="text-on-surface">60 requests/minute</strong> per API key.</p>
            <p className="text-gray-400 text-sm mb-3">Rate limit headers are included in every response:</p>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li><code className="text-on-surface">X-RateLimit-Limit</code> — Maximum requests per window</li>
              <li><code className="text-on-surface">X-RateLimit-Remaining</code> — Remaining requests</li>
              <li><code className="text-on-surface">Retry-After</code> — Seconds to wait (on 429)</li>
            </ul>
          </div>
        </section>

        {/* Webhook Events */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Webhook className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-serif tracking-tighter">Webhook Events</h2>
          </div>
          <div className="bg-surface-container-low rounded-lg p-6">
            <p className="text-gray-300 mb-3">Subscribe to real-time events via outgoing webhooks:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                'listing.created', 'listing.updated', 'listing.prepared',
                'lead.created', 'lead.updated',
                'post.published', 'post.scheduled',
                'photo.enhanced',
              ].map(event => (
                <code key={event} className="bg-black/50 px-2 py-1 rounded text-primary">{event}</code>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-3">
              Payloads are signed with HMAC-SHA256 via the <code className="text-on-surface">X-Webhook-Signature</code> header.
            </p>
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold font-serif tracking-tighter mb-4">Code Examples</h2>
          <div className="space-y-4">
            <div className="bg-surface-container-low rounded-lg p-6">
              <p className="text-gray-400 mb-2 font-medium">JavaScript / Node.js</p>
              <pre className="bg-black/50 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-green-400">{`const response = await fetch('https://snap-r.com/api/v1/listings', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});
const { data, meta } = await response.json();
console.log(\`Found \${meta.total} listings\`);`}</code>
              </pre>
            </div>
            <div className="bg-surface-container-low rounded-lg p-6">
              <p className="text-gray-400 mb-2 font-medium">Python</p>
              <pre className="bg-black/50 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-green-400">{`import requests

headers = {"Authorization": "Bearer YOUR_API_KEY"}
response = requests.get("https://snap-r.com/api/v1/listings", headers=headers)
data = response.json()
print(f"Found {data['meta']['total']} listings")`}</code>
              </pre>
            </div>
          </div>
        </section>

        </main>

        {/* CTA */}
        <footer className="text-center bg-surface-container-low rounded-lg p-8">
          <h2 className="text-2xl font-bold font-serif tracking-tighter mb-2">Ready to integrate?</h2>
          <p className="text-gray-400 mb-4">Create your first API key and start building.</p>
          <a
            href="/dashboard/settings/api-keys"
            className="inline-block px-6 py-3 bg-primary text-black font-bold rounded-lg hover:shadow-glow-gold transition-colors"
          >
            Get API Key →
          </a>
        </footer>
      </div>
    </div>
  )
}

function EndpointGroup({ title, endpoints }: { title: string; endpoints: { method: string; path: string; desc: string }[] }) {
  const methodColors: Record<string, string> = {
    GET: 'text-green-400 bg-green-400/10',
    POST: 'text-blue-400 bg-blue-400/10',
    PATCH: 'text-yellow-400 bg-yellow-400/10',
    PUT: 'text-yellow-400 bg-yellow-400/10',
    DELETE: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-on-surface mb-2">{title}</h3>
      <div className="bg-surface-container-low rounded-lg overflow-hidden divide-y divide-white/5">
        {endpoints.map((ep, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${methodColors[ep.method] ?? 'text-gray-400'}`}>
              {ep.method}
            </span>
            <code className="text-sm text-on-surface font-mono">{ep.path}</code>
            <span className="text-gray-500 text-sm ml-auto">{ep.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
