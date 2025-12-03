import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard-client';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: listings } = await supabase
    .from('listings')
    .select('*, photos(id, raw_url, processed_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const listingsWithThumbnails = await Promise.all(
    (listings || []).map(async (listing) => {
      const photos = (listing as any).photos || [];
      const firstPhoto = photos[0];
      let thumbnail_url = null;

      if (firstPhoto) {
        const path = firstPhoto.processed_url || firstPhoto.raw_url;
        if (path) {
          const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
          thumbnail_url = data?.signedUrl || null;
        }
      }

      return {
        ...listing,
        photo_count: photos.length,
        thumbnail_url,
      };
    }),
  );

  return <DashboardClient user={user} listings={listingsWithThumbnails} />;
}
