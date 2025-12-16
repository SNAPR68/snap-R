import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, content, imageUrls, listingId, scheduleFor } = await req.json();

    // Get connection for this platform
    const { data: connection } = await serviceSupabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (!connection) {
      return NextResponse.json({ 
        error: `${platform} not connected. Please connect your account first.` 
      }, { status: 400 });
    }

    // If scheduling for later, save to queue
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

      return NextResponse.json({ 
        success: true, 
        scheduled: true, 
        scheduledFor: scheduleFor,
        postId: scheduled.id 
      });
    }

    // Publish immediately based on platform
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

    // Log the published post
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

    return NextResponse.json({ success: true, postId: result.postId, url: result.url });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
  }
}

async function publishToFacebook(connection: any, content: string, imageUrls: string[]) {
  const accessToken = connection.page_access_token || connection.access_token;
  const pageId = connection.page_id;

  if (!pageId) {
    throw new Error('No Facebook Page connected');
  }

  let postId: string;
  let postUrl: string;

  if (imageUrls && imageUrls.length > 0) {
    if (imageUrls.length === 1) {
      // Single image post
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrls[0],
          caption: content,
          access_token: accessToken,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      postId = data.post_id || data.id;
    } else {
      // Multiple images - create unpublished photos first
      const photoIds = await Promise.all(
        imageUrls.map(async (url) => {
          const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url,
              published: false,
              access_token: accessToken,
            }),
          });
          const data = await response.json();
          return { media_fbid: data.id };
        })
      );

      // Create multi-photo post
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          attached_media: photoIds,
          access_token: accessToken,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      postId = data.id;
    }
  } else {
    // Text-only post
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        access_token: accessToken,
      }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    postId = data.id;
  }

  postUrl = `https://facebook.com/${postId}`;
  return { postId, url: postUrl };
}

async function publishToInstagram(connection: any, content: string, imageUrls: string[]) {
  const accessToken = connection.access_token;
  const igUserId = connection.platform_user_id;

  if (!imageUrls || imageUrls.length === 0) {
    throw new Error('Instagram requires at least one image');
  }

  let containerId: string;

  if (imageUrls.length === 1) {
    // Single image post
    const createResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrls[0],
        caption: content,
        access_token: accessToken,
      }),
    });
    const createData = await createResponse.json();
    if (createData.error) throw new Error(createData.error.message);
    containerId = createData.id;
  } else {
    // Carousel post
    const childContainers = await Promise.all(
      imageUrls.slice(0, 10).map(async (url) => {
        const response = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: url,
            is_carousel_item: true,
            access_token: accessToken,
          }),
        });
        const data = await response.json();
        return data.id;
      })
    );

    const carouselResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: childContainers,
        caption: content,
        access_token: accessToken,
      }),
    });
    const carouselData = await carouselResponse.json();
    if (carouselData.error) throw new Error(carouselData.error.message);
    containerId = carouselData.id;
  }

  // Publish the container
  const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: accessToken,
    }),
  });
  const publishData = await publishResponse.json();
  if (publishData.error) throw new Error(publishData.error.message);

  return { postId: publishData.id, url: `https://instagram.com/p/${publishData.id}` };
}

async function publishToLinkedIn(connection: any, content: string, imageUrls: string[]) {
  const accessToken = connection.access_token;
  const personId = connection.platform_user_id;

  const postBody: any = {
    author: `urn:li:person:${personId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: content },
        shareMediaCategory: imageUrls?.length > 0 ? 'IMAGE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  // If images, need to upload them first (LinkedIn requires asset upload)
  if (imageUrls && imageUrls.length > 0) {
    // For now, just post without images - LinkedIn image upload is complex
    // Would need to: 1) Register upload 2) Upload binary 3) Reference in post
    postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
    postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [{
      status: 'READY',
      originalUrl: imageUrls[0],
    }];
  }

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
  if (data.error) throw new Error(data.message || 'LinkedIn publish failed');

  const postId = data.id?.split(':').pop();
  return { postId, url: `https://linkedin.com/feed/update/${data.id}` };
}
