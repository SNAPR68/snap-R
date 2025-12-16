'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Facebook, Instagram, Linkedin, Loader2, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  image_urls: string[];
  scheduled_for: string;
  status: string;
  published_at?: string;
  error_message?: string;
  listing?: { title: string };
}

const PLATFORM_ICONS: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'text-blue-500',
  instagram: 'text-pink-500',
  linkedin: 'text-blue-700',
};

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'published' | 'failed'>('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/social/scheduled');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this scheduled post?')) return;
    
    try {
      await fetch(`/api/social/scheduled/${postId}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handlePublishNow = async (post: ScheduledPost) => {
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: post.platform,
          content: post.content,
          imageUrls: post.image_urls,
        }),
      });
      
      if (res.ok) {
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to publish');
      }
    } catch (error) {
      console.error('Publish error:', error);
    }
  };

  const filteredPosts = posts.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const stats = {
    pending: posts.filter(p => p.status === 'pending').length,
    published: posts.filter(p => p.status === 'published').length,
    failed: posts.filter(p => p.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Scheduled Posts</h1>
            <p className="text-white/60">Manage your upcoming social media posts</p>
          </div>
          <Link
            href="/dashboard/content"
            className="px-4 py-2 bg-[#D4A017] text-black rounded-lg font-medium hover:bg-[#B8860B] transition-all"
          >
            Create New Post
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-sm text-white/50">Pending</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">{stats.published}</div>
            <div className="text-sm text-white/50">Published</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-sm text-white/50">Failed</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'published', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === f ? 'bg-[#D4A017] text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-xl">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No posts found</h3>
            <p className="text-white/50 text-sm">Create your first scheduled post in the Content Studio</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => {
              const Icon = PLATFORM_ICONS[post.platform] || Calendar;
              const colorClass = PLATFORM_COLORS[post.platform] || 'text-white';
              
              return (
                <div key={post.id} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium capitalize">{post.platform}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          post.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          post.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(post.scheduled_for).toLocaleString()}
                        </span>
                        {post.image_urls?.length > 0 && (
                          <span>{post.image_urls.length} image{post.image_urls.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      {post.error_message && (
                        <p className="text-red-400 text-xs mt-2">{post.error_message}</p>
                      )}
                    </div>

                    {post.image_urls?.[0] && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {post.status === 'pending' && (
                        <button
                          onClick={() => handlePublishNow(post)}
                          className="p-2 bg-[#D4A017]/20 hover:bg-[#D4A017]/30 rounded-lg text-[#D4A017]"
                          title="Publish Now"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {post.status === 'pending' && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
