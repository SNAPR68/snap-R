import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { getPlanLimits } from '@/lib/content/limits';
import { getClientIp } from '@/lib/utils/client-ip';

import { logger } from '@/lib/logger';
import { checkRateLimitAsync } from '@/lib/rate-limit';
import { socialPublishExtendedSchema, parseBody } from '@/lib/validation/schemas';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface SocialConnection {
  access_token: string;
  platform_user_id?: string;
  pages?: FacebookPage[];
  default_page_id?: string;
  instagram_account?: { id: string; username: string; name: string; page_id: string };
  linkedin_urn?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 15 req/min per IP (uses Upstash Redis in production)
    const ip = getClientIp(req.headers);
    const { success: withinLimit } = await checkRateLimitAsync(`social-publish:${ip}`, 15, 60_000);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = adminSupabase();

    // Billing gate: check if user's plan allows publishing
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    const planLimits = getPlanLimits(profile?.subscription_tier || 'free');
    if (!planLimits.canPublish) {
      return NextResponse.json(
        { error: 'Your plan does not include social publishing. Please upgrade to Pro or higher.' },
        { status: 403 }
      );
    }
    const body = await req.json();
    const validated = parseBody(socialPublishExtendedSchema, body);
    if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); }
    const { platform, content, imageUrls, listingId, scheduleFor } = validated.data;

    const { data: connection, error: connError } = await serviceSupabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (connError) {
      // PGRST116 = "no rows returned" from .single() — means not connected
      if (connError.code === 'PGRST116') {
        return NextResponse.json({
          error: `${platform} not connected. Please connect your account first.`
        }, { status: 400 });
      }
      logger.error('Social connection lookup error:', connError);
      return NextResponse.json({ error: 'Failed to check social connection' }, { status: 500 });
    }

    if (!connection) {
      return NextResponse.json({
        error: `${platform} not connected. Please connect your account first.`
      }, { status: 400 });
    }

    // Pre-publish validation: check platform-specific requirements before attempting publish
    const conn = connection as SocialConnection;
    if (platform === 'facebook') {
      const pages = conn.pages || [];
      const page = conn.default_page_id
        ? pages.find(p => p.id === conn.default_page_id) || pages[0]
        : pages[0];
      if (!page) {
        return NextResponse.json({
          error: 'No Facebook Page connected. Please reconnect your Facebook account and select a Page.'
        }, { status: 400 });
      }
    }
    if (platform === 'instagram' && !conn.platform_user_id) {
      return NextResponse.json({
        error: 'No Instagram account linked. Please reconnect your Instagram account.'
      }, { status: 400 });
    }
    if (platform === 'linkedin' && !conn.platform_user_id) {
      return NextResponse.json({
        error: 'No LinkedIn profile linked. Please reconnect your LinkedIn account.'
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
      if (saveError) logger.error('Content library save error:', saveError);

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
        result = await publishToFacebook(connection, content, imageUrls ?? []);
        break;
      case 'instagram':
        result = await publishToInstagram(connection, content, imageUrls ?? []);
        break;
      case 'linkedin':
        result = await publishToLinkedIn(connection, content, imageUrls ?? []);
        break;
      case 'twitter':
        result = await publishToTwitterX(connection, content, imageUrls ?? []);
        break;
      case 'tiktok':
        result = await publishToTikTok(connection, content, imageUrls ?? []);
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
    if (libError) logger.error('Content library save error:', libError);

    return NextResponse.json({ success: true, postId: result.postId, url: result.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to publish';
    logger.error('Publish error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function publishToFacebook(connection: SocialConnection, content: string, imageUrls: string[]) {
  // Resolve Facebook page from pages JSONB array + default_page_id
  const pages = connection.pages || [];
  const defaultPageId = connection.default_page_id;
  const page = defaultPageId
    ? pages.find(p => p.id === defaultPageId) || pages[0]
    : pages[0];

  if (!page) throw new Error('No Facebook Page connected. Please reconnect your Facebook account and select a Page.');

  const accessToken = page.access_token || connection.access_token;
  const pageId = page.id;

  let postId: string;

  if (imageUrls && imageUrls.length > 0) {
    if (imageUrls.length === 1) {
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrls[0], caption: content, access_token: accessToken }),
        signal: AbortSignal.timeout(15000),
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
            signal: AbortSignal.timeout(15000),
          });
          const data = await response.json();
          return { media_fbid: data.id };
        })
      );
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, attached_media: photoIds, access_token: accessToken }),
        signal: AbortSignal.timeout(15000),
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
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    postId = data.id;
  }

  return { postId, url: `https://facebook.com/${postId}` };
}

async function publishToInstagram(connection: SocialConnection, content: string, imageUrls: string[]) {
  const accessToken = connection.access_token;
  const igUserId = connection.platform_user_id;

  if (!imageUrls || imageUrls.length === 0) throw new Error('Instagram requires at least one image');

  let containerId: string;

  if (imageUrls.length === 1) {
    const createResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrls[0], caption: content, access_token: accessToken }),
      signal: AbortSignal.timeout(15000),
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
          signal: AbortSignal.timeout(15000),
        });
        const data = await response.json();
        return data.id;
      })
    );
    const carouselResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_type: 'CAROUSEL', children: childContainers, caption: content, access_token: accessToken }),
      signal: AbortSignal.timeout(15000),
    });
    const carouselData = await carouselResponse.json();
    if (carouselData.error) throw new Error(carouselData.error.message);
    containerId = carouselData.id;
  }

  const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
    signal: AbortSignal.timeout(15000),
  });
  const publishData = await publishResponse.json();
  if (publishData.error) throw new Error(publishData.error.message);

  return { postId: publishData.id, url: `https://instagram.com` };
}

async function publishToLinkedIn(connection: Record<string, string>, content: string, imageUrls: string[]) {
  const accessToken = connection.access_token;
  let personId = connection.platform_user_id;

  if (!personId) {
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    const profile = await profileRes.json();
    personId = profile.sub;

    if (!personId) {
      throw new Error('Could not get LinkedIn user ID');
    }
  }

  const personUrn = `urn:li:person:${personId}`;

  // Build post body using modern LinkedIn Posts API (rest/posts)
  const postBody: Record<string, unknown> = {
    author: personUrn,
    commentary: content,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
  };

  // Upload images if provided
  if (imageUrls?.length > 0) {
    const uploadedImages: string[] = [];

    for (const imageUrl of imageUrls) {
      // Initialize image upload
      const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202401',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({ initializeUploadRequest: { owner: personUrn } }),
        signal: AbortSignal.timeout(15000),
      });

      if (initRes.ok) {
        const initData = await initRes.json();
        const uploadUrl = initData.value.uploadUrl;
        const imageUrn = initData.value.image;

        // Download and re-upload binary
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
        const imgBuffer = await imgRes.arrayBuffer();
        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          body: imgBuffer,
          signal: AbortSignal.timeout(30000),
        });

        uploadedImages.push(imageUrn);
      }
    }

    if (uploadedImages.length === 1) {
      postBody.content = { media: { id: uploadedImages[0] } };
    } else if (uploadedImages.length > 1) {
      postBody.content = { multiImage: { images: uploadedImages.map(id => ({ id })) } };
    }
  }

  const response = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202401',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `LinkedIn error: ${response.status}`);
  }

  const postUrn = response.headers.get('x-restli-id') || '';
  const postUrl = postUrn
    ? `https://www.linkedin.com/feed/update/${postUrn}`
    : 'https://www.linkedin.com/feed/';

  return { postId: postUrn || 'unknown', url: postUrl };
}

async function publishToTwitterX(connection: SocialConnection, content: string, imageUrls: string[]) {
  const accessToken = connection.access_token;

  // Upload images if provided (Twitter allows up to 4)
  const mediaIds: string[] = [];
  if (imageUrls?.length > 0) {
    for (const imageUrl of imageUrls.slice(0, 4)) {
      // Download image
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
      const imgBuffer = await imgRes.arrayBuffer();
      const base64Data = Buffer.from(imgBuffer).toString('base64');
      const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

      // INIT
      const initRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          command: 'INIT',
          total_bytes: String(imgBuffer.byteLength),
          media_type: mimeType,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!initRes.ok) continue;
      const initData = await initRes.json();
      const mediaId = initData.media_id_string;

      // APPEND
      const appendRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          command: 'APPEND',
          media_id: mediaId,
          segment_index: '0',
          media_data: base64Data,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!appendRes.ok) continue;

      // FINALIZE
      const finalizeRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          command: 'FINALIZE',
          media_id: mediaId,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (finalizeRes.ok) {
        mediaIds.push(mediaId);
      }
    }
  }

  // Create tweet
  const tweetBody: Record<string, unknown> = { text: content };
  if (mediaIds.length > 0) {
    tweetBody.media = { media_ids: mediaIds };
  }

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tweetBody),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Twitter error: ${response.status}`);
  }

  const data = await response.json();
  const tweetId = data.data?.id;

  return {
    postId: tweetId || 'unknown',
    url: tweetId ? `https://x.com/i/status/${tweetId}` : 'https://x.com',
  };
}

async function publishToTikTok(connection: SocialConnection, content: string, imageUrls: string[]) {
  const accessToken = connection.access_token;

  if (!imageUrls || imageUrls.length === 0) {
    throw new Error('TikTok requires at least one image');
  }

  // Use TikTok Photo Posting API (creates photo carousel)
  const response = await fetch(
    'https://open.tiktokapis.com/v2/post/publish/content/init/',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: content.slice(0, 150),
          privacy_level: process.env.TIKTOK_PRIVACY_LEVEL || 'SELF_ONLY',
          disable_comment: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_cover_index: 0,
          photo_images: imageUrls,
        },
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `TikTok error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error?.code !== 'ok' && data.error?.code) {
    throw new Error(`TikTok API error: ${data.error.message || data.error.code}`);
  }

  return {
    postId: data.data?.publish_id || 'unknown',
    url: 'https://www.tiktok.com',
  };
}
