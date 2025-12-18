'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Home, Zap, Users, Hammer, LayoutGrid, Image, Palette, FileText,
  Settings, CheckSquare, Camera, Mic, Sparkles, CreditCard,
  LogOut, Building2, BarChart3, Loader2, ArrowLeft
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  platform_name: string | null;
  hide_powered_by: boolean;
  owner_id: string;
}

export default function BrandedDashboardCatchAll() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const slug = params.slug as string;
  const pathSegments = params.path as string[] || [];
  const subPath = pathSegments.join('/');
  
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrg();
  }, [slug]);

  const loadOrg = async () => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/org/${slug}`);
      return;
    }

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

    // Verify access
    if (orgData.owner_id !== user.id) {
      router.push('/dashboard');
      return;
    }

    setOrg(orgData);
    setLoading(false);
  };

  const NavLink = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
    const orgHref = `/org/${slug}/dashboard${href === '/dashboard' ? '' : href.replace('/dashboard', '')}`;
    const isActive = pathname === orgHref || (href !== '/dashboard' && pathname.startsWith(orgHref));

    return (
      <Link
        href={orgHref}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          isActive ? 'text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
        }`}
        style={isActive ? { backgroundColor: (org?.primary_color || '#D4A017') + '30', color: org?.primary_color || '#D4A017' } : {}}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm">{children}</span>
      </Link>
    );
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

  // Map subPath to human-readable title
  const getPageTitle = (path: string) => {
    const titles: Record<string, string> = {
      'listings': 'My Listings',
      'camera': 'Mobile Camera',
      'content-studio': 'Content Studio',
      'brand': 'Brand Profile',
      'listing-intelligence': 'AI Analyzer',
      'approvals': 'Client Approvals',
      'ai-descriptions': 'AI Descriptions',
      'photo-culling': 'Photo Culling',
      'portfolio': 'Portfolios',
      'renovation': 'Virtual Renovation',
      'floor-plans': 'Floor Plans',
      'virtual-tours': 'Virtual Tours',
      'voiceover': 'AI Voiceover',
      'campaigns': 'Auto Campaigns',
      'cma': 'CMA Reports',
      'team': 'Team',
      'settings': 'Settings',
      'organization': 'White-Label Settings',
      'billing': 'Billing',
    };
    return titles[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="min-h-screen text-white flex" style={{ backgroundColor: '#0F0F0F' }}>
      {/* Branded Sidebar */}
      <aside 
        className="w-[220px] border-r border-white/10 p-4 flex flex-col flex-shrink-0"
        style={{ backgroundColor: secondary_color }}
      >
        <Link href={`/org/${slug}/dashboard`} className="flex items-center gap-2 mb-8">
          {logo_url ? (
            <img src={logo_url} alt="" className="w-10 h-10 object-contain" />
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
          <NavLink href="/dashboard/listings" icon={Home}>My Listings</NavLink>
          <NavLink href="/dashboard/camera" icon={Camera}>Mobile Camera</NavLink>

          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Content</p>
          <NavLink href="/dashboard/content-studio" icon={FileText}>Content Studio</NavLink>
          <NavLink href="/dashboard/brand" icon={Palette}>Brand Profile</NavLink>

          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Tools</p>
          <NavLink href="/dashboard/listing-intelligence" icon={Sparkles}>AI Analyzer</NavLink>
          <NavLink href="/dashboard/approvals" icon={CheckSquare}>Client Approvals</NavLink>
          <NavLink href="/dashboard/ai-descriptions" icon={FileText}>AI Descriptions</NavLink>
          <NavLink href="/dashboard/photo-culling" icon={Image}>Photo Culling</NavLink>
          <NavLink href="/dashboard/portfolio" icon={Palette}>Portfolios</NavLink>
          <NavLink href="/dashboard/renovation" icon={Hammer}>Virtual Renovation</NavLink>
          <NavLink href="/dashboard/floor-plans" icon={LayoutGrid}>Floor Plans</NavLink>
          <NavLink href="/dashboard/virtual-tours" icon={Camera}>Virtual Tours</NavLink>
          <NavLink href="/dashboard/voiceover" icon={Mic}>AI Voiceover</NavLink>
          <NavLink href="/dashboard/campaigns" icon={Zap}>Auto Campaigns</NavLink>
          <NavLink href="/dashboard/cma" icon={BarChart3}>CMA Reports</NavLink>

          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Account</p>
          <NavLink href="/dashboard/team" icon={Users}>Team</NavLink>
          <NavLink href="/dashboard/settings" icon={Settings}>Settings</NavLink>
          <NavLink href="/dashboard/organization" icon={Building2}>White-Label</NavLink>
          <NavLink href="/dashboard/billing" icon={CreditCard}>Billing</NavLink>
        </nav>

        <div className="pt-4 border-t border-white/10">
          <form action="/auth/signout" method="POST">
            <button type="submit" className="flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-white/60 w-full">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </form>
          {!hide_powered_by && (
            <div className="mt-3 text-center">
              <span className="text-xs text-white/30">
                Powered by <a href="https://snap-r.com" target="_blank" className="hover:text-white/50">SnapR</a>
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content - Embedded iframe to actual dashboard page */}
      <main className="flex-1 overflow-auto">
        {/* Page Header */}
        <div className="h-14 border-b border-white/10 flex items-center px-6 gap-4" style={{ backgroundColor: secondary_color }}>
          <Link 
            href={`/org/${slug}/dashboard`}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </Link>
          <h1 className="font-semibold" style={{ color: primary_color }}>
            {getPageTitle(pathSegments[0] || '')}
          </h1>
        </div>

        {/* Embedded Dashboard Page */}
        <iframe
          src={`/dashboard/${subPath}`}
          className="w-full border-0"
          style={{ height: 'calc(100vh - 56px)' }}
          title={getPageTitle(pathSegments[0] || '')}
        />
      </main>
    </div>
  );
}
