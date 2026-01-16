import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const getServiceSupabase = () => createServiceClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = getServiceSupabase();
    const { platform, content, imageUrls, listingId, scheduleFor } = await req.json();

    const { data: connection, error: connError } = await serviceSupabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      return NextResponse.json({ 
        error: `${platform} not connected. Please connect your account first.` 
      }, { status: 400 });
    }

    if (scheduleFor) {
      const { data: scheduled, error } = await serviceSupabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          listing_id: listingId,
          platform,
          content,
          image_urls: imageUrls,
          scheduled_for: scheduleFor,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Save scheduled posts to content library
      const { error: saveError } = await serviceSupabase.from('content_library').insert({
        user_id: user.id,
        name: `Scheduled ${platform.charAt(0).toUpperCase() + platform.slice(1)} Post`,
        category: 'general',
        platform,
        post_type: 'image',
        image_url: imageUrls?.[0] || null,
        caption: content,
        is_favorite: false,
        use_count: 0,
      });
      if (saveError) console.error('Content library save error:', saveError);

      return NextResponse.json({ 
        success: true, 
        scheduled: true, 
        scheduledFor: scheduleFor,
        postId: scheduled.id 
      });
    }

    let result;
    
    switch (platform) {
      case 'facebook':
        result = await publishToFacebook(connection, content, imageUrls);
        break;
      case 'instagram':
        result = await publishToInstagram(connection, content, imageUrls);
        break;
      case 'linkedin':
        result = await publishToLinkedIn(connection, content, imageUrls);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    await serviceSupabase.from('scheduled_posts').insert({
      user_id: user.id,
      listing_id: listingId,
      platform,
      content,
      image_urls: imageUrls,
      scheduled_for: new Date().toISOString(),
      status: 'published',
      published_at: new Date().toISOString(),
      platform_post_id: result.postId,
    });

    // Save to content_library for the Content Library page
    const { error: libError } = await serviceSupabase.from('content_library').insert({
      user_id: user.id,
      name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Post - ${new Date().toLocaleDateString()}`,
      category: 'general',
      platform,
      post_type: 'image',
      image_url: imageUrls?.[0] || null,
      caption: content,
      is_favorite: false,
      use_count: 1,
    });
    if (libError) console.error('Content library save error:', libError);

    return NextResponse.json({ success: true, postId: result.postId, url: result.url });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: error.message || 'Failed to publish' }, { status: 500 });
  }
}

async function publishToFacebook(connection: any, content: string, imageUrls: string[]) {
  const accessToken = connection.page_access_token || connection.access_token;
  const pageId = connection.page_id;

  if (!pageId) throw new Error('No Facebook Page connected');

  let postId: string;

  if (imageUrls && imageUrls.length > 0) {
    if (imageUrls.length === 1) {
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrls[0], caption: content, access_token: accessToken }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      postId = data.post_id || data.id;
    } else {
      const photoIds = await Promise.all(
        imageUrls.map(async (url) => {
          const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, published: false, access_token: accessToken }),
          });
          const data = await response.json();
          return { media_fbid: data.id };
        })
      );
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, attached_media: photoIds, access_token: accessToken }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      postId = data.id;
    }
  } else {
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, access_token: accessToken }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    postId = data.id;
  }

  return { postId, url: `https://facebook.com/${postId}` };
}

async function publishToInstagram(connection: any, content: string, imageUrls: string[]) {
  const accessToken = connection.access_token;
  const igUserId = connection.platform_user_id;

  if (!imageUrls || imageUrls.length === 0) throw new Error('Instagram requires at least one image');

  let containerId: string;

  if (imageUrls.length === 1) {
    const createResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrls[0], caption: content, access_token: accessToken }),
    });
    const createData = await createResponse.json();
    if (createData.error) throw new Error(createData.error.message);
    containerId = createData.id;
  } else {
    const childContainers = await Promise.all(
      imageUrls.slice(0, 10).map(async (url) => {
        const response = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: accessToken }),
        });
        const data = await response.json();
        return data.id;
      })
    );
    const carouselResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_type: 'CAROUSEL', children: childContainers, caption: content, access_token: accessToken }),
    });
    const carouselData = await carouselResponse.json();
    if (carouselData.error) throw new Error(carouselData.error.message);
    containerId = carouselData.id;
  }

  const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
  });
  const publishData = await publishResponse.json();
  if (publishData.error) throw new Error(publishData.error.message);

  return { postId: publishData.id, url: `https://instagram.com` };
}

async function publishToLinkedIn(connection: any, content: string, imageUrls: string[]) {
  const accessToken = connection.access_token;
  let personId = connection.platform_user_id;

  if (!personId) {
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    personId = profile.sub;
    
    if (!personId) {
      throw new Error('Could not get LinkedIn user ID');
    }
  }

  console.log('[LinkedIn] Publishing for person:', personId);

  const postBody = {
    author: `urn:li:person:${personId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: content },
        shareMediaCategory: imageUrls?.length > 0 ? 'ARTICLE' : 'NONE',
        ...(imageUrls?.length > 0 && {
          media: [{
            status: 'READY',
            originalUrl: imageUrls[0],
          }]
        })
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  console.log('[LinkedIn] Request:', JSON.stringify(postBody));

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  const data = await response.json();
  console.log('[LinkedIn] Response:', response.status, JSON.stringify(data));

  if (!response.ok || data.status === 422) {
    throw new Error(data.message || `LinkedIn error: ${response.status}`);
  }

  const postUrn = data.id;
  const postUrl = postUrn 
    ? `https://www.linkedin.com/feed/update/${postUrn}`
    : `https://www.linkedin.com/feed/`;

  return { postId: postUrn || 'unknown', url: postUrl };
}
