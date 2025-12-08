import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateCaption, PropertyDetails, CaptionOptions } from '@/lib/ai/providers/gpt-copy'
import { canGenerateCaption, shouldResetUsage } from '@/lib/content/limits'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with plan and usage
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, ai_captions_used, ai_captions_reset_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if usage should be reset (monthly)
    let captionsUsed = profile.ai_captions_used || 0
    if (shouldResetUsage(profile.ai_captions_reset_at)) {
      captionsUsed = 0
      await supabase
        .from('profiles')
        .update({ 
          ai_captions_used: 0, 
          ai_captions_reset_at: new Date().toISOString() 
        })
        .eq('id', user.id)
    }

    // Check plan limits
    if (!canGenerateCaption(profile.plan, captionsUsed)) {
      return NextResponse.json({ 
        error: 'Caption limit reached',
        upgrade: true,
        used: captionsUsed,
        plan: profile.plan
      }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const property: PropertyDetails = body.property || {}
    const options: CaptionOptions = {
      platform: body.platform || 'instagram',
      tone: body.tone || 'professional',
      includeEmojis: body.includeEmojis !== false,
      includeCallToAction: body.includeCallToAction !== false,
      maxLength: body.maxLength
    }

    // Generate caption
    const result = await generateCaption(property, options)

    // Log to ai_copy_generations table
    await supabase.from('ai_copy_generations').insert({
      user_id: user.id,
      listing_id: body.listing_id || null,
      copy_type: `${options.platform}_caption`,
      input_data: { property, options },
      output_text: result.text,
      tokens_used: result.tokensUsed,
      model: result.model
    })

    // Increment usage counter
    await supabase
      .from('profiles')
      .update({ ai_captions_used: captionsUsed + 1 })
      .eq('id', user.id)

    return NextResponse.json({
      caption: result.text,
      tokensUsed: result.tokensUsed,
      captionsRemaining: profile.plan === 'agency' ? 'unlimited' : 
        (profile.plan === 'pro' ? 50 : 10) - (captionsUsed + 1)
    })

  } catch (error) {
    console.error('Caption generation error:', error)
    return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 })
  }
}
