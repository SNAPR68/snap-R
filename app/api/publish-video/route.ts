import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishVideoExtendedSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validated = parseBody(publishVideoExtendedSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 })
    }
    const { platform, videoUrl, caption, listingId } = validated.data
    
    // Get social connection for this platform
    const { data: connection } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()
    
    if (!connection) {
      return NextResponse.json({ error: `${platform} not connected` }, { status: 400 })
    }
    
    // Download video from blob URL won't work server-side
    // Video needs to be passed as base64 or uploaded to storage first
    // For now, we'll handle Facebook publishing
    
    if (platform === 'facebook') {
      // Facebook Video Publishing via Graph API
      // First, we need to upload the video to a public URL or use resumable upload
      
      const pageId = connection.page_id
      const accessToken = connection.access_token
      
      if (!pageId) {
        return NextResponse.json({ error: 'No Facebook Page connected' }, { status: 400 })
      }
      
      // For Facebook Reels, we use the video upload endpoint
      // Note: Video must be accessible via URL, so we need to upload to storage first
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/videos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken,
            file_url: videoUrl, // Must be a public URL
            description: caption || '',
            published: true,
          }),
          signal: AbortSignal.timeout(30000),
        }
      )
      
      const result = await response.json()
      
      if (result.error) {
        logger.error('Facebook publish error:', result.error)
        return NextResponse.json({ error: result.error.message }, { status: 400 })
      }
      
      // Log successful publish
      await supabase.from('published_content').insert({
        user_id: user.id,
        listing_id: listingId,
        platform,
        content_type: 'video',
        platform_post_id: result.id,
        caption,
        published_at: new Date().toISOString()
      })
      
      return NextResponse.json({ success: true, postId: result.id })
    }
    
    if (platform === 'instagram') {
      // Instagram Reels require a Container -> Publish flow
      const igUserId = connection.instagram_user_id
      const accessToken = connection.access_token
      
      if (!igUserId) {
        return NextResponse.json({ error: 'No Instagram Business account connected' }, { status: 400 })
      }
      
      // Step 1: Create media container
      const containerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            media_type: 'REELS',
            video_url: videoUrl, // Must be public URL
            caption: caption || '',
          }),
          signal: AbortSignal.timeout(30000),
        }
      )
      
      const container = await containerResponse.json()
      
      if (container.error) {
        logger.error('Instagram container error:', container.error)
        return NextResponse.json({ error: container.error.message }, { status: 400 })
      }
      
      // Step 2: Wait for video processing (poll status)
      let status = 'IN_PROGRESS'
      let attempts = 0
      const maxAttempts = 30
      
      while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000))
        
        const statusResponse = await fetch(
          `https://graph.facebook.com/v18.0/${container.id}?fields=status_code&access_token=${accessToken}`,
          { signal: AbortSignal.timeout(15000) }
        )
        const statusData = await statusResponse.json()
        status = statusData.status_code
        attempts++
      }
      
      if (status !== 'FINISHED') {
        return NextResponse.json({ error: 'Video processing failed or timed out' }, { status: 400 })
      }
      
      // Step 3: Publish the container
      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            creation_id: container.id,
          }),
          signal: AbortSignal.timeout(15000),
        }
      )
      
      const publishResult = await publishResponse.json()
      
      if (publishResult.error) {
        logger.error('Instagram publish error:', publishResult.error)
        return NextResponse.json({ error: publishResult.error.message }, { status: 400 })
      }
      
      // Log successful publish
      await supabase.from('published_content').insert({
        user_id: user.id,
        listing_id: listingId,
        platform,
        content_type: 'video',
        platform_post_id: publishResult.id,
        caption,
        published_at: new Date().toISOString()
      })
      
      return NextResponse.json({ success: true, postId: publishResult.id })
    }
    
    if (platform === 'linkedin') {
      // LinkedIn video publishing
      const linkedinUrn = connection.linkedin_urn ?? connection.linkedin_id

      if (!linkedinUrn) {
        return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 400 })
      }

      const urn: string = linkedinUrn
      const { publishVideoToLinkedIn } = await import('@/lib/social/publish-service')
      const linkedInResult = await publishVideoToLinkedIn(connection.access_token, urn, videoUrl, caption || '')
      if (!linkedInResult.success) {
        return NextResponse.json({ error: linkedInResult.error }, { status: 500 })
      }
      return NextResponse.json({ success: true, postId: linkedInResult.postId })
    }
    
    return NextResponse.json({ error: 'Platform not supported' }, { status: 400 })
    
  } catch (error: unknown) {
    logger.error('Publish video error:', error)
    return NextResponse.json({ error: 'Failed to publish video' }, { status: 500 })
  }
}

