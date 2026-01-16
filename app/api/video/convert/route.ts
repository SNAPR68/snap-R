import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    if (!videoFile) return NextResponse.json({ error: 'No video file' }, { status: 400 })

    console.log('Starting video conversion for user:', user.id)
    console.log('Video size:', videoFile.size, 'bytes')

    // Upload WebM to Supabase storage temporarily
    const arrayBuffer = await videoFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = `temp-videos/${user.id}/${Date.now()}.webm`
    
    const { error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(fileName, buffer, { contentType: 'video/webm', upsert: true })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(fileName, 3600)
    
    const webmUrl = urlData?.signedUrl
    if (!webmUrl) throw new Error('Failed to get video URL')

    console.log('WebM uploaded, starting Replicate conversion...')

    // Use lucataco/ffmpeg model
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "1531c64eccd2ee6438bc6389cf869f4099cb81e29dae53b59582f5e71201c522",
        input: {
          input_video: webmUrl,
          output_format: "mp4",
        },
      }),
    })

    const prediction = await response.json()
    console.log('Replicate response:', prediction)
    
    if (prediction.error) {
      console.error('Replicate error:', prediction.error)
      throw new Error(prediction.error)
    }

    // Poll for result
    let result = prediction
    let attempts = 0
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 90) {
      await new Promise(r => setTimeout(r, 2000))
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` },
      })
      result = await pollRes.json()
      console.log(`Poll attempt ${attempts + 1}: ${result.status}`)
      attempts++
    }

    // Clean up temp WebM
    await supabase.storage.from('raw-images').remove([fileName])

    if (result.status === 'failed') {
      console.error('Conversion failed:', result.error)
      throw new Error(result.error || 'Conversion failed')
    }
    if (result.status !== 'succeeded') {
      throw new Error('Conversion timeout after 3 minutes')
    }

    console.log('Conversion successful:', result.output)

    return NextResponse.json({ 
      mp4Url: result.output,
      success: true 
    })

  } catch (error: any) {
    console.error('Video conversion error:', error)
    return NextResponse.json({ error: error.message || 'Conversion failed' }, { status: 500 })
  }
}
