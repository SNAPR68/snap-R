export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client for deletion operations
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's listings to delete associated photos from storage
    const { data: listings } = await adminSupabase
      .from('listings')
      .select('id')
      .eq('user_id', user.id);

    const listingIds = listings?.map(l => l.id) || [];

    // Get all photos to delete from storage
    const { data: photos } = await adminSupabase
      .from('photos')
      .select('raw_url, processed_url')
      .in('listing_id', listingIds);

    // Delete photos from storage
    if (photos && photos.length > 0) {
      const filesToDelete = photos
        .flatMap(p => [p.raw_url, p.processed_url])
        .filter(Boolean);
      
      if (filesToDelete.length > 0) {
        await adminSupabase.storage
          .from('raw-images')
          .remove(filesToDelete);
      }
    }

    // Delete from database in correct order (foreign key constraints)
    await adminSupabase.from('human_edit_orders').delete().eq('user_id', user.id);
    await adminSupabase.from('photos').delete().in('listing_id', listingIds);
    await adminSupabase.from('shares').delete().eq('user_id', user.id);
    await adminSupabase.from('listings').delete().eq('user_id', user.id);
    await adminSupabase.from('profiles').delete().eq('id', user.id);

    // Log the deletion
    await adminSupabase.from('system_logs').insert({
      level: 'info',
      source: 'account-deletion',
      message: `User account deleted: ${user.email}`,
      metadata: { 
        userId: user.id,
        listingsDeleted: listingIds.length,
        photosDeleted: photos?.length || 0,
      },
    });

    // Send confirmation email
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: 'SnapR <notifications@snap-r.com>',
        to: user.email!,
        subject: 'Your SnapR Account Has Been Deleted',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Account Deleted</h2>
            <p>Your SnapR account and all associated data has been permanently deleted.</p>
            <p>This includes:</p>
            <ul>
              <li>Your profile information</li>
              <li>${listingIds.length} listing(s)</li>
              <li>${photos?.length || 0} photo(s)</li>
              <li>All enhancement history</li>
            </ul>
            <p>If you did not request this deletion, please contact us immediately at support@snap-r.com</p>
            <p>We're sorry to see you go. If you ever want to come back, you're always welcome!</p>
            <p>- The SnapR Team</p>
          </div>
        `,
      });
    }

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
