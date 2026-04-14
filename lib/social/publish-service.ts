// Social Media Publishing Service
// Actually publish content to connected platforms

import { type SocialPlatform } from './oauth-config';

import { logger } from '@/lib/logger';
interface PublishRequest {
  platform: SocialPlatform;
  accessToken: string;
  pageId?: string; // For Facebook/Instagram
  pageAccessToken?: string; // Facebook Page access token
  instagramAccountId?: string; // For Instagram
  content: {
    text: string;
    imageUrls?: string[];
    videoUrl?: string;
    link?: string;
  };
}

interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

// Publish to Facebook Page
export async function publishToFacebook(
  pageAccessToken: string,
  pageId: string,
  content: { text: string; imageUrls?: string[]; link?: string }
): Promise<PublishResult> {
  try {
    let url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    const params = new URLSearchParams();

    params.append('access_token', pageAccessToken);
    params.append('message', content.text);

    if (content.link) {
      params.append('link', content.link);
    }

    // If there are images, post as photo instead
    if (content.imageUrls && content.imageUrls.length > 0) {
      if (content.imageUrls.length === 1) {
        // Single photo
        url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
        params.append('url', content.imageUrls[0]);
        params.append('caption', content.text);
      } else {
        // Multiple photos - create unpublished photos first, then combine
        const photoIds: string[] = [];
        
        for (const imageUrl of content.imageUrls) {
          const photoResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}/photos`,
            {
              method: 'POST',
              body: new URLSearchParams({
                access_token: pageAccessToken,
                url: imageUrl,
                published: 'false',
              }),
              signal: AbortSignal.timeout(15000),
            }
          );

          if (photoResponse.ok) {
            const photoData = await photoResponse.json();
            photoIds.push(photoData.id);
          } else {
            logger.warn('[Facebook] Photo upload failed for:', imageUrl, photoResponse.status);
          }
        }

        // Now create a post with attached photos
        const postParams = new URLSearchParams({
          access_token: pageAccessToken,
          message: content.text,
        });
        
        photoIds.forEach((id, index) => {
          postParams.append(`attached_media[${index}]`, JSON.stringify({ media_fbid: id }));
        });

        const response = await fetch(url, {
          method: 'POST',
          body: postParams,
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        return {
          success: true,
          postId: data.id,
          postUrl: `https://facebook.com/${data.id}`,
        };
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      body: params,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    
    return {
      success: true,
      postId: data.id || data.post_id,
      postUrl: `https://facebook.com/${data.id || data.post_id}`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Facebook error';
    logger.error('Facebook publish error:', error);
    return {
      success: false,
      error: message,
    };
  }
}

// Publish to Instagram
export async function publishToInstagram(
  accessToken: string,
  instagramAccountId: string,
  content: { text: string; imageUrls?: string[]; videoUrl?: string }
): Promise<PublishResult> {
  try {
    // Instagram requires a two-step process:
    // 1. Create a media container
    // 2. Publish the container

    if (!content.imageUrls?.length && !content.videoUrl) {
      return { success: false, error: 'Instagram requires at least one image or video' };
    }

    // Single image post
    if (content.imageUrls?.length === 1) {
      // Step 1: Create container
      const containerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
        {
          method: 'POST',
          body: new URLSearchParams({
            access_token: accessToken,
            image_url: content.imageUrls[0],
            caption: content.text,
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!containerResponse.ok) {
        throw new Error(await containerResponse.text());
      }

      const containerData = await containerResponse.json();

      // Step 2: Publish
      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
        {
          method: 'POST',
          body: new URLSearchParams({
            access_token: accessToken,
            creation_id: containerData.id,
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!publishResponse.ok) {
        throw new Error(await publishResponse.text());
      }

      const publishData = await publishResponse.json();

      return {
        success: true,
        postId: publishData.id,
        postUrl: `https://instagram.com/p/${publishData.id}`,
      };
    }

    // Carousel (multiple images)
    if (content.imageUrls && content.imageUrls.length > 1) {
      // Create containers for each image
      const childContainers: string[] = [];

      for (const imageUrl of content.imageUrls) {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
          {
            method: 'POST',
            body: new URLSearchParams({
              access_token: accessToken,
              image_url: imageUrl,
              is_carousel_item: 'true',
            }),
            signal: AbortSignal.timeout(15000),
          }
        );

        if (response.ok) {
          const data = await response.json();
          childContainers.push(data.id);
        } else {
          logger.warn('[Instagram] Carousel item failed for:', imageUrl, response.status);
        }
      }

      // Create carousel container
      const carouselResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
        {
          method: 'POST',
          body: new URLSearchParams({
            access_token: accessToken,
            media_type: 'CAROUSEL',
            caption: content.text,
            children: childContainers.join(','),
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!carouselResponse.ok) {
        throw new Error(await carouselResponse.text());
      }

      const carouselData = await carouselResponse.json();

      // Publish carousel
      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
        {
          method: 'POST',
          body: new URLSearchParams({
            access_token: accessToken,
            creation_id: carouselData.id,
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!publishResponse.ok) {
        throw new Error(await publishResponse.text());
      }

      const publishData = await publishResponse.json();
      
      return {
        success: true,
        postId: publishData.id,
      };
    }

    return { success: false, error: 'Invalid content for Instagram' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Instagram error';
    logger.error('Instagram publish error:', error);
    return {
      success: false,
      error: message,
    };
  }
}

// Upload an image to LinkedIn and return the image URN
async function uploadImageToLinkedIn(
  accessToken: string,
  personUrn: string,
  imageUrl: string
): Promise<string | null> {
  try {
    // Step 1: Initialize image upload
    const initResponse = await fetch(
      'https://api.linkedin.com/rest/images?action=initializeUpload',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202401',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: personUrn,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!initResponse.ok) {
      const errorBody = await initResponse.text().catch(() => '');
      logger.error(`[LinkedIn] Image upload init failed (${initResponse.status}):`, errorBody);
      throw new Error(`LinkedIn image upload failed (${initResponse.status}): ${errorBody}`);
    }

    const initData = await initResponse.json();
    const uploadUrl = initData.value.uploadUrl;
    const imageUrn = initData.value.image;

    // Step 2: Download image from source
    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15000),
    });
    if (!imageResponse.ok) {
      logger.error(`[LinkedIn] Source image download failed (${imageResponse.status}):`, imageUrl);
      throw new Error(`LinkedIn source image download failed (${imageResponse.status})`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // Step 3: Upload binary to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: imageBuffer,
      signal: AbortSignal.timeout(30000),
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text().catch(() => '');
      logger.error(`[LinkedIn] Image binary upload failed (${uploadResponse.status}):`, errorBody);
      throw new Error(`LinkedIn image binary upload failed (${uploadResponse.status}): ${errorBody}`);
    }

    return imageUrn;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown LinkedIn image upload error';
    logger.error('[LinkedIn] Image upload error:', message);
    throw error;
  }
}

// Upload video to LinkedIn via registerUpload → binary PUT → poll processing
async function uploadVideoToLinkedIn(
  accessToken: string,
  personUrn: string,
  videoUrl: string
): Promise<string | null> {
  try {
    // Step 1: Initialize video upload
    const initResponse = await fetch(
      'https://api.linkedin.com/rest/videos?action=initializeUpload',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202401',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: personUrn,
            fileSizeBytes: 0, // LinkedIn allows 0 for server-side detection
            uploadCaptions: false,
            uploadThumbnail: false,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!initResponse.ok) {
      const errorBody = await initResponse.text().catch(() => '');
      logger.error(`[LinkedIn] Video upload init failed (${initResponse.status}):`, errorBody);
      throw new Error(`LinkedIn video upload failed (${initResponse.status}): ${errorBody}`);
    }

    const initData = await initResponse.json();
    const uploadUrl = initData.value?.uploadInstructions?.[0]?.uploadUrl;
    const videoUrn = initData.value?.video;

    if (!uploadUrl || !videoUrn) {
      logger.error('[LinkedIn] Video init response missing uploadUrl or video URN');
      throw new Error('LinkedIn video init response missing uploadUrl or video URN');
    }

    // Step 2: Download video from source
    const videoResponse = await fetch(videoUrl, {
      signal: AbortSignal.timeout(60000), // Videos can be large
    });
    if (!videoResponse.ok) {
      logger.error(`[LinkedIn] Source video download failed (${videoResponse.status}):`, videoUrl);
      throw new Error(`LinkedIn source video download failed (${videoResponse.status})`);
    }
    const videoBuffer = await videoResponse.arrayBuffer();

    // Step 3: Upload binary to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: videoBuffer,
      signal: AbortSignal.timeout(120000), // 2 min for large videos
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text().catch(() => '');
      logger.error(`[LinkedIn] Video binary upload failed (${uploadResponse.status}):`, errorBody);
      throw new Error(`LinkedIn video binary upload failed (${uploadResponse.status}): ${errorBody}`);
    }

    return videoUrn;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown LinkedIn video upload error';
    logger.error('[LinkedIn] Video upload error:', message);
    throw error;
  }
}

// Publish video to LinkedIn
export async function publishVideoToLinkedIn(
  accessToken: string,
  personUrn: string,
  videoUrl: string,
  caption: string
): Promise<PublishResult> {
  try {
    const videoUrn = await uploadVideoToLinkedIn(accessToken, personUrn, videoUrl);
    if (!videoUrn) {
      return { success: false, error: 'Failed to upload video to LinkedIn' };
    }

    const postBody = {
      author: personUrn,
      commentary: caption,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      content: {
        media: {
          id: videoUrn,
        },
      },
    };

    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const postUrn = response.headers.get('x-restli-id') || '';
    return {
      success: true,
      postId: postUrn,
      postUrl: postUrn ? `https://www.linkedin.com/feed/update/${postUrn}` : undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown LinkedIn video error';
    logger.error('LinkedIn video publish error:', error);
    return { success: false, error: message };
  }
}

// Upload video to Twitter via chunked media upload (INIT → APPEND → FINALIZE → poll STATUS)
async function uploadVideoToTwitter(
  accessToken: string,
  videoUrl: string
): Promise<string | null> {
  try {
    // Download video
    const videoResponse = await fetch(videoUrl, { signal: AbortSignal.timeout(60000) });
    if (!videoResponse.ok) {
      logger.warn('[Twitter] Source video download failed:', videoResponse.status);
      return null;
    }
    const videoBuffer = await videoResponse.arrayBuffer();
    const mimeType = videoResponse.headers.get('content-type') || 'video/mp4';
    const totalBytes = videoBuffer.byteLength;

    // INIT with media_category=tweet_video
    const initResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        command: 'INIT',
        total_bytes: String(totalBytes),
        media_type: mimeType,
        media_category: 'tweet_video',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!initResponse.ok) {
      logger.warn('[Twitter] Video INIT failed:', initResponse.status);
      return null;
    }

    const initData = await initResponse.json();
    const mediaId = initData.media_id_string;

    // APPEND in 5MB chunks
    const chunkSize = 5 * 1024 * 1024;
    const buffer = Buffer.from(videoBuffer);
    let segmentIndex = 0;

    for (let offset = 0; offset < totalBytes; offset += chunkSize) {
      const chunk = buffer.subarray(offset, Math.min(offset + chunkSize, totalBytes));
      const base64Chunk = chunk.toString('base64');

      const appendResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          command: 'APPEND',
          media_id: mediaId,
          segment_index: String(segmentIndex),
          media_data: base64Chunk,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!appendResponse.ok) {
        logger.warn('[Twitter] Video APPEND failed at segment', segmentIndex, ':', appendResponse.status);
        return null;
      }
      segmentIndex++;
    }

    // FINALIZE
    const finalizeResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
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

    if (!finalizeResponse.ok) {
      logger.warn('[Twitter] Video FINALIZE failed:', finalizeResponse.status);
      return null;
    }

    const finalizeData = await finalizeResponse.json();

    // Poll STATUS until processing completes (videos are async on Twitter)
    if (finalizeData.processing_info) {
      let checkAfterSecs = finalizeData.processing_info.check_after_secs || 5;
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(resolve => setTimeout(resolve, checkAfterSecs * 1000));

        const statusResponse = await fetch(
          `https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            signal: AbortSignal.timeout(15000),
          }
        );

        if (!statusResponse.ok) break;
        const statusData = await statusResponse.json();
        const state = statusData.processing_info?.state;

        if (state === 'succeeded') return mediaId;
        if (state === 'failed') {
          logger.warn('[Twitter] Video processing failed:', statusData.processing_info?.error);
          return null;
        }
        checkAfterSecs = statusData.processing_info?.check_after_secs || 5;
      }
    }

    return mediaId;
  } catch (err) {
    logger.warn('[Twitter] Video upload error:', err);
    return null;
  }
}

// Publish video to Twitter/X
export async function publishVideoToTwitter(
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<PublishResult> {
  try {
    const mediaId = await uploadVideoToTwitter(accessToken, videoUrl);
    if (!mediaId) {
      return { success: false, error: 'Failed to upload video to Twitter' };
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: caption,
        media: { media_ids: [mediaId] },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    return {
      success: true,
      postId: data.data?.id,
      postUrl: data.data?.id ? `https://twitter.com/i/status/${data.data.id}` : undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Twitter video error';
    logger.error('Twitter video publish error:', error);
    return { success: false, error: message };
  }
}

// Publish to LinkedIn (using modern rest/posts API)
export async function publishToLinkedIn(
  accessToken: string,
  personUrn: string, // Format: "urn:li:person:xxx"
  content: { text: string; imageUrls?: string[]; link?: string }
): Promise<PublishResult> {
  try {
    // Build the post body using the modern LinkedIn Posts API
    const postBody: Record<string, unknown> = {
      author: personUrn,
      commentary: content.text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
    };

    // If there are images, upload them first
    if (content.imageUrls && content.imageUrls.length > 0) {
      const uploadedImages: string[] = [];

      for (const imageUrl of content.imageUrls) {
        try {
          const imageUrn = await uploadImageToLinkedIn(accessToken, personUrn, imageUrl);
          if (imageUrn) {
            uploadedImages.push(imageUrn);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`[LinkedIn] Image upload failed for ${imageUrl}:`, message);
        }
      }

      // Fail if all image uploads failed — don't silently fall back to text-only
      if (uploadedImages.length === 0 && content.imageUrls.length > 0) {
        return { success: false, error: 'All image uploads to LinkedIn failed' };
      }

      if (uploadedImages.length === 1) {
        // Single image post
        postBody.content = {
          media: {
            id: uploadedImages[0],
          },
        };
      } else if (uploadedImages.length > 1) {
        // Multi-image post
        postBody.content = {
          multiImage: {
            images: uploadedImages.map(id => ({ id })),
          },
        };
      }
    }

    // If there's a link (and no images)
    if (content.link && !content.imageUrls?.length) {
      postBody.content = {
        article: {
          source: content.link,
        },
      };
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
      throw new Error(await response.text());
    }

    // The Posts API returns the post URN in the x-restli-id header
    const postUrn = response.headers.get('x-restli-id') || '';

    return {
      success: true,
      postId: postUrn,
      postUrl: postUrn
        ? `https://www.linkedin.com/feed/update/${postUrn}`
        : undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown LinkedIn error';
    logger.error('LinkedIn publish error:', error);
    return {
      success: false,
      error: message,
    };
  }
}

// Publish video to TikTok via Content Posting API (PULL_FROM_URL)
export async function publishVideoToTikTok(
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<PublishResult> {
  try {
    // TikTok Content Posting API — video init with PULL_FROM_URL
    const response = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_info: {
            title: caption.slice(0, 150), // TikTok title max ~150 chars
            privacy_level: process.env.TIKTOK_PRIVACY_LEVEL || 'SELF_ONLY',
            disable_comment: false,
            disable_duet: false,
            disable_stitch: false,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: videoUrl,
          },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`TikTok video init failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    if (data.error?.code !== 'ok' && data.error?.code) {
      throw new Error(`TikTok API error: ${data.error.message || data.error.code}`);
    }

    return {
      success: true,
      postId: data.data?.publish_id || undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown TikTok video error';
    logger.error('TikTok video publish error:', error);
    return {
      success: false,
      error: message,
    };
  }
}

// Publish photo post to TikTok via Photo Posting API
export async function publishPhotoToTikTok(
  accessToken: string,
  imageUrls: string[],
  caption: string
): Promise<PublishResult> {
  try {
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
            title: caption.slice(0, 150),
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
      const errorBody = await response.text();
      throw new Error(`TikTok photo init failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    if (data.error?.code !== 'ok' && data.error?.code) {
      throw new Error(`TikTok API error: ${data.error.message || data.error.code}`);
    }

    return {
      success: true,
      postId: data.data?.publish_id || undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown TikTok photo error';
    logger.error('TikTok photo publish error:', error);
    return {
      success: false,
      error: message,
    };
  }
}

// Upload media to Twitter via v1.1 media upload endpoint
async function uploadMediaToTwitter(
  accessToken: string,
  imageUrl: string
): Promise<string | null> {
  try {
    // Download image
    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15000),
    });
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // INIT
    const initResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        command: 'INIT',
        total_bytes: String(imageBuffer.byteLength),
        media_type: mimeType,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!initResponse.ok) {
      logger.warn('[Twitter] Media INIT failed:', initResponse.status);
      return null;
    }

    const initData = await initResponse.json();
    const mediaId = initData.media_id_string;

    // APPEND
    const appendResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
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

    if (!appendResponse.ok) {
      logger.warn('[Twitter] Media APPEND failed:', appendResponse.status);
      return null;
    }

    // FINALIZE
    const finalizeResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
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

    if (!finalizeResponse.ok) {
      logger.warn('[Twitter] Media FINALIZE failed:', finalizeResponse.status);
      return null;
    }

    return mediaId;
  } catch (err) {
    logger.warn('[Twitter] Media upload error:', err);
    return null;
  }
}

// Publish to Twitter/X via v2 API
export async function publishToTwitter(
  accessToken: string,
  content: { text: string; imageUrls?: string[] }
): Promise<PublishResult> {
  try {
    // Upload images if provided (max 4)
    const mediaIds: string[] = [];
    if (content.imageUrls && content.imageUrls.length > 0) {
      for (const imageUrl of content.imageUrls.slice(0, 4)) {
        const mediaId = await uploadMediaToTwitter(accessToken, imageUrl);
        if (mediaId) {
          mediaIds.push(mediaId);
        }
      }
    }

    // Create tweet
    const tweetBody: Record<string, unknown> = {
      text: content.text,
    };

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
      const errorBody = await response.text();
      throw new Error(`Twitter API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const tweetId = data.data?.id;

    return {
      success: true,
      postId: tweetId,
      postUrl: tweetId ? `https://x.com/i/status/${tweetId}` : undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Twitter error';
    logger.error('Twitter publish error:', error);
    return {
      success: false,
      error: message,
    };
  }
}

// Main publish function
export async function publishToSocial(request: PublishRequest): Promise<PublishResult> {
  switch (request.platform) {
    case 'facebook':
      if (!request.pageAccessToken || !request.pageId) {
        return { success: false, error: 'Facebook requires page access token and page ID' };
      }
      return publishToFacebook(request.pageAccessToken, request.pageId, request.content);

    case 'instagram':
      if (!request.instagramAccountId) {
        return { success: false, error: 'Instagram account ID required' };
      }
      return publishToInstagram(request.accessToken, request.instagramAccountId, request.content);

    case 'linkedin':
      if (!request.pageId) {
        return { success: false, error: 'LinkedIn person URN required' };
      }
      return publishToLinkedIn(request.accessToken, request.pageId, request.content);

    case 'tiktok':
      if (request.content.videoUrl) {
        return publishVideoToTikTok(request.accessToken, request.content.videoUrl, request.content.text);
      }
      if (request.content.imageUrls?.length) {
        return publishPhotoToTikTok(request.accessToken, request.content.imageUrls, request.content.text);
      }
      return { success: false, error: 'TikTok requires video or images' };

    case 'twitter':
      return publishToTwitter(request.accessToken, request.content);

    default:
      return { success: false, error: `Publishing to ${request.platform} not yet supported` };
  }
}
