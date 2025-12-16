// Social Media Publishing Service
// Actually publish content to connected platforms

import { SOCIAL_PLATFORMS, SocialPlatform } from './oauth-config';

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
    const formData = new FormData();
    
    formData.append('access_token', pageAccessToken);
    formData.append('message', content.text);
    
    if (content.link) {
      formData.append('link', content.link);
    }

    // If there are images, post as photo instead
    if (content.imageUrls && content.imageUrls.length > 0) {
      if (content.imageUrls.length === 1) {
        // Single photo
        url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
        formData.append('url', content.imageUrls[0]);
        formData.append('caption', content.text);
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
            }
          );
          
          if (photoResponse.ok) {
            const photoData = await photoResponse.json();
            photoIds.push(photoData.id);
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
      body: formData,
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
  } catch (error: any) {
    console.error('Facebook publish error:', error);
    return {
      success: false,
      error: error.message,
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
          }
        );

        if (response.ok) {
          const data = await response.json();
          childContainers.push(data.id);
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
  } catch (error: any) {
    console.error('Instagram publish error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Publish to LinkedIn
export async function publishToLinkedIn(
  accessToken: string,
  personUrn: string, // Format: "urn:li:person:xxx"
  content: { text: string; imageUrls?: string[]; link?: string }
): Promise<PublishResult> {
  try {
    const shareContent: any = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.text,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // If there are images, upload them first
    if (content.imageUrls && content.imageUrls.length > 0) {
      const mediaAssets: string[] = [];
      
      for (const imageUrl of content.imageUrls) {
        // Register upload
        const registerResponse = await fetch(
          'https://api.linkedin.com/v2/assets?action=registerUpload',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              registerUploadRequest: {
                recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                owner: personUrn,
                serviceRelationships: [
                  {
                    relationshipType: 'OWNER',
                    identifier: 'urn:li:userGeneratedContent',
                  },
                ],
              },
            }),
          }
        );

        if (registerResponse.ok) {
          const registerData = await registerResponse.json();
          const uploadUrl = registerData.value.uploadMechanism[
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
          ].uploadUrl;
          const asset = registerData.value.asset;

          // Download image and upload to LinkedIn
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();

          await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: imageBuffer,
          });

          mediaAssets.push(asset);
        }
      }

      if (mediaAssets.length > 0) {
        shareContent.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
        shareContent.specificContent['com.linkedin.ugc.ShareContent'].media = mediaAssets.map(asset => ({
          status: 'READY',
          media: asset,
        }));
      }
    }

    // If there's a link
    if (content.link && !content.imageUrls?.length) {
      shareContent.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
      shareContent.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          originalUrl: content.link,
        },
      ];
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(shareContent),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    
    return {
      success: true,
      postId: data.id,
    };
  } catch (error: any) {
    console.error('LinkedIn publish error:', error);
    return {
      success: false,
      error: error.message,
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
      return publishToLinkedIn(request.accessToken, request.pageId || '', request.content);
    
    default:
      return { success: false, error: `Publishing to ${request.platform} not yet supported` };
  }
}
