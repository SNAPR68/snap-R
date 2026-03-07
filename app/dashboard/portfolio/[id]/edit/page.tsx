'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2, ArrowLeft, Save, Trash2, Globe, Eye, Copy, Check
} from 'lucide-react';

interface Portfolio {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  theme: string;
  accent_color: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
}

export default function PortfolioEditPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState('#D4A017');
  const [isPublic, setIsPublic] = useState(false);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch(`/api/portfolio?id=${portfolioId}`);
        if (!response.ok) {
          setError('Portfolio not found');
          return;
        }

        const portfolio: Portfolio = await response.json();
        setTitle(portfolio.title);
        setTagline(portfolio.tagline ?? '');
        setDescription(portfolio.description ?? '');
        setTheme(portfolio.theme);
        setAccentColor(portfolio.accent_color);
        setIsPublic(portfolio.is_public);
        setSlug(portfolio.slug);
      } catch {
        setError('Failed to load portfolio');
      } finally {
        setLoading(false);
      }
    }

    fetchPortfolio();
  }, [portfolioId, router]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: portfolioId,
          title,
          tagline: tagline || null,
          description: description || null,
          theme,
          accent_color: accentColor,
          is_public: isPublic,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess('Portfolio saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this portfolio? This cannot be undone.')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/portfolio?id=${portfolioId}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      router.push('/dashboard/portfolio');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
      setDeleting(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/portfolio/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/portfolio"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Edit Portfolio</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/portfolio/${slug}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Link>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/50"
              placeholder="My Portfolio"
              aria-label="Portfolio title"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/50"
              placeholder="Professional real estate photography"
              aria-label="Portfolio tagline"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/50 resize-none"
              placeholder="Tell visitors about your work..."
              aria-label="Portfolio description"
            />
          </div>

          {/* Theme & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4A017]/50"
                aria-label="Portfolio theme"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                  aria-label="Accent color"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-[#D4A017]/50"
                  aria-label="Accent color hex value"
                />
              </div>
            </div>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-white/10 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-white/40" />
              <div>
                <p className="text-sm font-medium">Public Portfolio</p>
                <p className="text-xs text-white/40">Anyone with the link can view your portfolio</p>
              </div>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isPublic ? 'bg-[#D4A017]' : 'bg-white/20'
              }`}
              role="switch"
              aria-checked={isPublic}
              aria-label="Toggle public visibility"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                isPublic ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>

          {/* Slug (read-only) */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">URL Slug</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white/40 text-sm">
              <span>/portfolio/</span>
              <span className="text-white">{slug}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Portfolio
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#D4A017] text-black rounded-lg text-sm font-semibold hover:bg-[#D4A017]/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
