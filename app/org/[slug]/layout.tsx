import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export default async function OrgLayout({ children, params }: LayoutProps) {
  const { slug } = params;
  const supabase = await createClient();

  // Fetch org to validate it exists and is active
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, white_label_active, favicon_url, platform_name')
    .eq('slug', slug)
    .eq('white_label_active', true)
    .single();

  if (!org) {
    notFound();
  }

  return (
    <>
      {/* Inject favicon if org has one */}
      {org.favicon_url && (
        <head>
          <link rel="icon" href={org.favicon_url} />
        </head>
      )}
      {children}
    </>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('name, platform_name, favicon_url')
    .eq('slug', params.slug)
    .eq('white_label_active', true)
    .single();

  if (!org) {
    return { title: 'Not Found' };
  }

  return {
    title: org.platform_name || org.name,
    icons: org.favicon_url ? { icon: org.favicon_url } : undefined,
  };
}
