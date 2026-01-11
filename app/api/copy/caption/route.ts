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

    // Get user profile - use defaults if not found
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()      // Use maybeSingle instead of single to avoid error on 0 rows
    
    // Use defaults if no profile
    const plan = profile?.plan || profile?.subscription_tier || 'free'
    let captionsUsed = profile?.ai_captions_used || 0
    const resetAt = profile?.ai_captions_reset_at
    
    // Check if usage should be reset (monthly)
    if (resetAt && shouldResetUsage(resetAt)) {
      captionsUsed = 0
      if (profile) {
        await supabase
          .from('profiles')
          .update({ 
            ai_captions_used: 0, 
            ai_captions_reset_at: new Date().toISOString() 
          })
          .eq('id', user.id)
      }
    }


    // Parse request body
    const body = await request.json()
    
    const property: PropertyDetails = body.property || {}
    const contentType = body.contentType || 'just_listed'
    const options: CaptionOptions = {
      platform: body.platform || 'instagram',
      tone: body.tone || 'professional',
      includeEmojis: body.includeEmojis !== false,
      includeCallToAction: body.includeCallToAction !== false,
      maxLength: body.maxLength,
      contentType: contentType
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
      captionsRemaining: plan === 'agency' ? 'unlimited' : 
        (plan === 'pro' ? 50 : 10) - (captionsUsed + 1)
    })

  } catch (error) {
    console.error('Caption generation error:', error)
    return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 })
  }
}
