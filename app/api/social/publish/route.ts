import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { platform, imageUrl, caption } = await request.json()

    // Get connection for this platform
    const { data: connection } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()

    if (!connection) {
      return NextResponse.json({ error: `No ${platform} account connected` }, { status: 400 })
    }

    // Facebook Publishing
    if (platform === 'facebook') {
      const uploadRes = await fetch(
        `https://graph.facebook.com/v18.0/${connection.platform_id}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: imageUrl,
            caption: caption || '',
            access_token: connection.access_token
          })
        }
      )
      const uploadData = await uploadRes.json()
      if (uploadData.error) return NextResponse.json({ error: uploadData.error.message }, { status: 400 })
      return NextResponse.json({ success: true, postId: uploadData.id, url: `https://facebook.com/${uploadData.id}` })
    }

    // Instagram Publishing (2-step process)
    if (platform === 'instagram') {
      // Step 1: Create media container
      const containerRes = await fetch(
        `https://graph.facebook.com/v18.0/${connection.platform_id}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption || '',
            access_token: connection.access_token
          })
        }
      )
      const containerData = await containerRes.json()
      if (containerData.error) return NextResponse.json({ error: containerData.error.message }, { status: 400 })

      // Step 2: Publish the container
      const publishRes = await fetch(
        `https://graph.facebook.com/v18.0/${connection.platform_id}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: connection.access_token
          })
        }
      )
      const publishData = await publishRes.json()
      if (publishData.error) return NextResponse.json({ error: publishData.error.message }, { status: 400 })
      return NextResponse.json({ success: true, postId: publishData.id })
    }

    // LinkedIn Publishing
    if (platform === 'linkedin') {
      // Register image upload
      const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: `urn:li:person:${connection.platform_id}`,
            serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }]
          }
        })
      })
      const registerData = await registerRes.json()
      
      if (!registerData.value) {
        return NextResponse.json({ error: 'Failed to register LinkedIn upload' }, { status: 400 })
      }

      const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
      const asset = registerData.value.asset

      // Download image and upload to LinkedIn
      const imageRes = await fetch(imageUrl)
      const imageBlob = await imageRes.blob()
      
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${connection.access_token}` },
        body: imageBlob
      })

      // Create post with image
      const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          author: `urn:li:person:${connection.platform_id}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: caption || '' },
              shareMediaCategory: 'IMAGE',
              media: [{ status: 'READY', media: asset }]
            }
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
        })
      })
      const postData = await postRes.json()
      if (postData.error) return NextResponse.json({ error: postData.error }, { status: 400 })
      return NextResponse.json({ success: true, postId: postData.id })
    }

    // TikTok Publishing (photo mode)
    if (platform === 'tiktok') {
      // TikTok photo publishing requires video creation API
      // For now, return a message about the limitation
      return NextResponse.json({ 
        error: 'TikTok photo publishing requires their Content Posting API. Video upload coming soon.' 
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 })
  }
}
