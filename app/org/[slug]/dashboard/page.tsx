'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Home, Zap, Users, Hammer, LayoutGrid, Image, Palette, FileText,
  Settings, CheckSquare, Camera, Mic, Sparkles, CreditCard, BookOpen,
  LogOut, Building2, BarChart3, Loader2
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  platform_name: string | null;
  hide_powered_by: boolean;
}

interface NavLinkProps {
  href: string;
  icon: any;
  children: React.ReactNode;
  primaryColor: string;
  currentPath: string;
  orgSlug: string;
}

function NavLink({ href, icon: Icon, children, primaryColor, currentPath, orgSlug }: NavLinkProps) {
  // Convert /dashboard/xxx to /org/[slug]/dashboard/xxx
  const orgHref = href.replace('/dashboard', `/org/${orgSlug}/dashboard`);
  const isActive = currentPath === orgHref || currentPath.startsWith(orgHref + '/');

  return (
    <Link
      href={orgHref}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        isActive
          ? 'text-white'
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
      style={isActive ? { backgroundColor: primaryColor + '30', color: primaryColor } : {}}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{children}</span>
    </Link>
  );
}

export default function BrandedDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    loadOrgAndVerifyAccess();
    setCurrentPath(window.location.pathname);
  }, [slug]);

  const loadOrgAndVerifyAccess = async () => {
    const supabase = createClient();
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/org/${slug}`);
      return;
    }

    // Fetch org
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('white_label_active', true)
      .single();

    if (!orgData) {
      router.push('/dashboard');
      return;
    }

    // Verify user has access (is owner or member)
    // For now, we'll check if user is the owner
    if (orgData.owner_id !== user.id) {
      // TODO: Check organization_members table for membership
      router.push('/dashboard');
      return;
    }

    setOrg(orgData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!org) return null;

  const { primary_color, secondary_color, platform_name, logo_url, hide_powered_by } = org;

  return (
    <div className="min-h-screen text-white flex" style={{ backgroundColor: '#0F0F0F' }}>
      {/* Branded Sidebar */}
      <aside 
        className="w-[220px] border-r border-white/10 p-4 flex flex-col flex-shrink-0"
        style={{ backgroundColor: secondary_color }}
      >
        {/* Logo */}
        <Link href={`/org/${slug}/dashboard`} className="flex items-center gap-2 mb-8">
          {logo_url ? (
            <img src={logo_url} alt={platform_name || ''} className="w-10 h-10 object-contain" />
          ) : (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: primary_color }}
            >
              {(platform_name || org.name).charAt(0)}
            </div>
          )}
          <span className="text-xl font-bold" style={{ color: primary_color }}>
            {platform_name || org.name}
          </span>
        </Link>

        <nav className="flex-1 space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 px-3">Main</p>
          <NavLink href="/dashboard/listings" icon={Home} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>My Listings</NavLink>
          <NavLink href="/dashboard/camera" icon={Camera} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Mobile Camera</NavLink>

          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Content</p>
          <NavLink href="/dashboard/content-studio" icon={FileText} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Content Studio</NavLink>
          <NavLink href="/dashboard/brand" icon={Palette} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Brand Profile</NavLink>

          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Tools</p>
          <NavLink href="/dashboard/listing-intelligence" icon={Sparkles} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>AI Analyzer</NavLink>
          <NavLink href="/dashboard/approvals" icon={CheckSquare} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Client Approvals</NavLink>
          <NavLink href="/dashboard/ai-descriptions" icon={FileText} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>AI Descriptions</NavLink>
          <NavLink href="/dashboard/photo-culling" icon={Image} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Photo Culling</NavLink>
          <NavLink href="/dashboard/portfolio" icon={Palette} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Portfolios</NavLink>
          <NavLink href="/dashboard/renovation" icon={Hammer} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Virtual Renovation</NavLink>
          <NavLink href="/dashboard/floor-plans" icon={LayoutGrid} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Floor Plans</NavLink>
          <NavLink href="/dashboard/virtual-tours" icon={Camera} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Virtual Tours</NavLink>
          <NavLink href="/dashboard/voiceover" icon={Mic} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>AI Voiceover</NavLink>
          <NavLink href="/dashboard/campaigns" icon={Zap} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Auto Campaigns</NavLink>
          <NavLink href="/dashboard/cma" icon={BarChart3} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>CMA Reports</NavLink>

          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Account</p>
          <NavLink href="/dashboard/team" icon={Users} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Team</NavLink>
          <NavLink href="/dashboard/settings" icon={Settings} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Settings</NavLink>
          <NavLink href="/dashboard/organization" icon={Building2} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>White-Label</NavLink>
          <NavLink href="/dashboard/billing" icon={CreditCard} primaryColor={primary_color} currentPath={currentPath} orgSlug={slug}>Billing</NavLink>
        </nav>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-white/60 w-full"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </form>

          {!hide_powered_by && (
            <div className="mt-3 text-center">
              <span className="text-xs text-white/30">
                Powered by{' '}
                <a href="https://snap-r.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/50">
                  SnapR
                </a>
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content - Embed actual dashboard */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2" style={{ color: primary_color }}>
              Welcome to {platform_name || org.name}
            </h1>
            <p className="text-white/60">
              Your white-label dashboard is active. Use the sidebar to navigate.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-4">
            <Link
              href={`/org/${slug}/dashboard/listings`}
              className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Home className="w-8 h-8 mb-2" style={{ color: primary_color }} />
              <div className="font-medium">My Listings</div>
              <div className="text-sm text-white/50">View all properties</div>
            </Link>
            <Link
              href={`/org/${slug}/dashboard/content-studio`}
              className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <FileText className="w-8 h-8 mb-2" style={{ color: primary_color }} />
              <div className="font-medium">Content Studio</div>
              <div className="text-sm text-white/50">Create marketing content</div>
            </Link>
            <Link
              href={`/org/${slug}/dashboard/listing-intelligence`}
              className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-8 h-8 mb-2" style={{ color: primary_color }} />
              <div className="font-medium">AI Analyzer</div>
              <div className="text-sm text-white/50">Analyze your photos</div>
            </Link>
            <Link
              href={`/org/${slug}/dashboard/organization`}
              className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Building2 className="w-8 h-8 mb-2" style={{ color: primary_color }} />
              <div className="font-medium">Settings</div>
              <div className="text-sm text-white/50">Customize branding</div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
