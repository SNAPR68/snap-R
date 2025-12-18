import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: { slug: string };
}

export default async function OrgLandingPage({ params }: PageProps) {
  const { slug } = params;

  // Fetch organization branding
  const supabase = await createClient();
  
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .eq('white_label_active', true)
    .single();

  if (!org) {
    notFound();
  }

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, redirect to dashboard
  if (user) {
    redirect(`/org/${slug}/dashboard`);
  }

  const primaryColor = org.primary_color || '#D4A017';
  const secondaryColor = org.secondary_color || '#1A1A1A';
  const platformName = org.platform_name || org.name;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: secondaryColor }}
    >
      {/* Logo & Name */}
      <div className="text-center mb-8">
        {org.logo_url ? (
          <img 
            src={org.logo_url} 
            alt={platformName} 
            className="w-24 h-24 object-contain mx-auto mb-4"
          />
        ) : (
          <div 
            className="w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {platformName.charAt(0)}
          </div>
        )}
        <h1 
          className="text-3xl font-bold"
          style={{ color: primaryColor }}
        >
          {platformName}
        </h1>
        {org.custom_login_message && (
          <p className="mt-2 text-white/60 max-w-md">
            {org.custom_login_message}
          </p>
        )}
      </div>

      {/* Login Box */}
      <div 
        className="w-full max-w-md rounded-2xl p-8"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <h2 className="text-xl font-semibold text-white mb-6 text-center">
          Sign in to continue
        </h2>

        <Link
          href={`/auth/login?org=${slug}`}
          className="block w-full py-3 rounded-xl text-center font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: primaryColor, color: secondaryColor }}
        >
          Sign In
        </Link>

        <div className="mt-4 text-center">
          <Link
            href={`/auth/signup?org=${slug}`}
            className="text-sm hover:underline"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </div>

      {/* Powered by (if not hidden) */}
      {!org.hide_powered_by && (
        <div className="mt-8 text-center">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Powered by{' '}
            <a 
              href="https://snap-r.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              SnapR
            </a>
          </span>
        </div>
      )}

      {/* Support link */}
      {org.custom_support_email && (
        <div className="mt-4 text-center">
          <a 
            href={`mailto:${org.custom_support_email}`}
            className="text-xs hover:underline"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Need help? Contact support
          </a>
        </div>
      )}
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const supabase = await createClient();
  
  const { data: org } = await supabase
    .from('organizations')
    .select('name, platform_name')
    .eq('slug', params.slug)
    .eq('white_label_active', true)
    .single();

  if (!org) {
    return { title: 'Not Found' };
  }

  const title = org.platform_name || org.name;

  return {
    title: `${title} - Sign In`,
    description: `Sign in to ${title}`,
  };
}
