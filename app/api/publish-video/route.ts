import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { platform, videoUrl, caption, listingId } = await request.json()
    
    if (!platform || !videoUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
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
        }
      )
      
      const result = await response.json()
      
      if (result.error) {
        console.error('Facebook publish error:', result.error)
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
        }
      )
      
      const container = await containerResponse.json()
      
      if (container.error) {
        console.error('Instagram container error:', container.error)
        return NextResponse.json({ error: container.error.message }, { status: 400 })
      }
      
      // Step 2: Wait for video processing (poll status)
      let status = 'IN_PROGRESS'
      let attempts = 0
      const maxAttempts = 30
      
      while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000))
        
        const statusResponse = await fetch(
          `https://graph.facebook.com/v18.0/${container.id}?fields=status_code&access_token=${accessToken}`
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
        }
      )
      
      const publishResult = await publishResponse.json()
      
      if (publishResult.error) {
        console.error('Instagram publish error:', publishResult.error)
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
      const linkedinId = connection.linkedin_id
      const accessToken = connection.access_token
      
      if (!linkedinId) {
        return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 400 })
      }
      
      // LinkedIn requires registering upload, uploading binary, then creating post
      // This is complex - for now return not implemented
      return NextResponse.json({ error: 'LinkedIn video publishing coming soon' }, { status: 501 })
    }
    
    return NextResponse.json({ error: 'Platform not supported' }, { status: 400 })
    
  } catch (error) {
    console.error('Publish video error:', error)
    return NextResponse.json({ error: 'Failed to publish video' }, { status: 500 })
  }
}

