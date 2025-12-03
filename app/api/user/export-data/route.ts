import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather all user data
    const [profileResult, listingsResult, photosResult, ordersResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('listings').select('*').eq('user_id', user.id),
      supabase.from('photos').select('*, listings!inner(user_id)').eq('listings.user_id', user.id),
      supabase.from('human_edit_orders').select('*').eq('user_id', user.id),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      profile: profileResult.data,
      listings: listingsResult.data || [],
      photos: (photosResult.data || []).map(p => ({
        id: p.id,
        listingId: p.listing_id,
        variant: p.variant,
        status: p.status,
        createdAt: p.created_at,
        // Don't include actual image URLs for security
      })),
      humanEditOrders: ordersResult.data || [],
      dataCategories: {
        accountInfo: 'Your email, name, and account settings',
        listings: 'Property listings you have created',
        photos: 'Photo metadata (images are stored separately)',
        orders: 'Human editing orders and their status',
      },
      yourRights: {
        access: 'You have received this data as part of your right to access',
        rectification: 'Contact privacy@snap-r.com to correct any inaccuracies',
        erasure: 'You can delete your account from Settings or contact us',
        portability: 'This export fulfills your right to data portability',
      },
    };

    // Log the export
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'data-export',
      message: `User ${user.email} exported their data`,
      metadata: { userId: user.id },
    });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="snapr-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Data export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
