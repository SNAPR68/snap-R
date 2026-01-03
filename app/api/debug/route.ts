import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No user', 
        userError: userError?.message 
      });
    }
    
    // Get listings for this user
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, user_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get ALL listings (bypass user filter) to compare
    const { data: allListings, error: allError } = await supabase
      .from('listings')
      .select('id, title, user_id')
      .limit(5);
    
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      userListings: listings,
      userListingsError: listingsError?.message,
      allListings: allListings,
      allListingsError: allError?.message,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
