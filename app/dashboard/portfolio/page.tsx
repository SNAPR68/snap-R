'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Loader2, Plus, Eye, Edit, Trash2, ExternalLink, Image, 
  Copy, Check, Globe, Instagram, Settings, Sparkles, Users,
  Lightbulb, Share2, MessageSquare, TrendingUp, Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';

interface Portfolio {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  theme: string;
  accent_color: string;
  is_public: boolean;
  view_count: number;
  portfolio_items: { id: string }[];
  created_at: string;
}

function CreatePortfolioModal({ 
  onClose, 
  onCreated 
}: { 
  onClose: () => void; 
  onCreated: (portfolio: Portfolio) => void;
}) {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, tagline }),
      });
      const data = await response.json();
      if (data.portfolio) {
        onCreated(data.portfolio);
      }
    } catch (error) {
      console.error('Create error:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#1A1A1A] rounded-2xl p-6 max-w-md w-full border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-6">Create Portfolio</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Portfolio Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="John Smith Photography"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          
          <div>
            <label className="block text-sm text-white/60 mb-2">Tagline (optional)</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Professional Real Estate Photography"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title || creating}
            className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PortfolioCard({ 
  portfolio, 
  onDelete 
}: { 
  portfolio: Portfolio; 
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/portfolio/${portfolio.slug}`;
  
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this portfolio? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await fetch(`/api/portfolio?id=${portfolio.id}`, { method: 'DELETE' });
      onDelete(portfolio.id);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{portfolio.title}</h3>
            {portfolio.tagline && (
              <p className="text-sm text-white/50 mt-1">{portfolio.tagline}</p>
            )}
          </div>
          <div 
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: portfolio.accent_color }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-white/10 p-4 bg-white/5">
        <div className="text-center">
          <div className="text-xl font-bold text-amber-400">
            {portfolio.portfolio_items?.length || 0}
          </div>
          <div className="text-xs text-white/40">Items</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-400">
            {portfolio.view_count || 0}
          </div>
          <div className="text-xs text-white/40">Views</div>
        </div>
        <div className="text-center">
          <div className={`text-xl font-bold ${portfolio.is_public ? 'text-green-400' : 'text-red-400'}`}>
            {portfolio.is_public ? 'Public' : 'Private'}
          </div>
          <div className="text-xs text-white/40">Status</div>
        </div>
      </div>

      {/* URL */}
      <div className="px-4 py-3 flex items-center gap-2 bg-black/20">
        <Globe className="w-4 h-4 text-white/40 flex-shrink-0" />
        <span className="text-sm text-white/60 truncate flex-1">
          /portfolio/{portfolio.slug}
        </span>
        <button
          onClick={handleCopyLink}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Copy link"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-white/40" />
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="p-4 flex gap-2">
        <Link
          href={`/portfolio/${portfolio.slug}`}
          target="_blank"
          className="flex-1 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View
        </Link>
        <Link
          href={`/dashboard/portfolio/${portfolio.id}/edit`}
          className="flex-1 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Link>
        <Link
          href={`/dashboard/portfolio/${portfolio.id}/items`}
          className="flex-1 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <Image className="w-4 h-4" />
          Items
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
          title="Delete"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function PortfolioContent() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      setPortfolios(data);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (portfolio: Portfolio) => {
    setPortfolios(prev => [portfolio, ...prev]);
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
              <Image className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Before/After Portfolios</h1>
              <p className="text-white/50">Showcase your work to win new clients</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Portfolio
          </button>
        </div>

        {/* What this is for */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">What this is for</h3>
              <p className="text-sm text-white/70">
                Create a public portfolio page showcasing your best before/after photo transformations. 
                Share the link on your website, business cards, or social media to attract new clients. 
                Visitors can see your work and contact you directly through the built-in form.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Share2 className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Public Shareable Link</div>
            <div className="text-xs text-white/40 mt-1">Anyone can view</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Image className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Before/After Sliders</div>
            <div className="text-xs text-white/40 mt-1">Interactive comparisons</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <MessageSquare className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Contact Form</div>
            <div className="text-xs text-white/40 mt-1">Capture leads directly</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-sm font-medium">View Analytics</div>
            <div className="text-xs text-white/40 mt-1">Track portfolio visits</div>
          </div>
        </div>

        {/* Portfolio Grid */}
        {portfolios.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No portfolios yet</h3>
            <p className="text-white/40 mb-2">Create a portfolio to showcase your transformation work</p>
            <p className="text-sm text-white/30 mb-6">Perfect for: business cards, website, Instagram bio, email signatures</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Portfolio
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map(portfolio => (
              <PortfolioCard 
                key={portfolio.id} 
                portfolio={portfolio}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* How to use */}
        {portfolios.length > 0 && (
          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">How to get clients with your portfolio</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Add your best work</h4>
                  <p className="text-sm text-white/50">Upload before/after pairs that show impressive transformations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Copy your portfolio link</h4>
                  <p className="text-sm text-white/50">Get your unique URL like snapr.com/portfolio/yourname</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Share everywhere</h4>
                  <p className="text-sm text-white/50">Add to your Instagram bio, email signature, business cards</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Get contacted</h4>
                  <p className="text-sm text-white/50">Potential clients submit inquiries through your portfolio</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreatePortfolioModal 
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

export default function PortfolioDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    }>
      <PortfolioContent />
    </Suspense>
  );
}
