import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateHashtags, PropertyDetails } from '@/lib/ai/providers/gpt-copy'
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
      .maybeSingle()

    /* TEMPORARILY DISABLED - profile check
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    */

    // Check if usage should be reset (monthly)
    let captionsUsed = profile?.ai_captions_used || 0
    if (profile && shouldResetUsage(profile.ai_captions_reset_at)) {
      captionsUsed = 0
      await supabase
        .from('profiles')
        .update({ 
          ai_captions_used: 0, 
          ai_captions_reset_at: new Date().toISOString() 
        })
        .eq('id', user.id)
    }

    /* TEMPORARILY DISABLED - plan limit check
    // Check plan limits (hashtags count as captions)
    if (!canGenerateCaption(profile.plan, captionsUsed)) {
      return NextResponse.json({ 
        error: 'AI generation limit reached',
        upgrade: true,
        used: captionsUsed,
        plan: profile.plan
      }, { status: 403 })
    }
    */

    // Parse request body
    const body = await request.json()
    const property: PropertyDetails = body.property || {}
    const platform = body.platform || 'instagram'
    const count = body.count || 20

    // Generate hashtags
    const result = await generateHashtags(property, platform, count)

    // Parse hashtags into array
    const hashtagsArray = result.text
      .split(/\s+/)
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.toLowerCase())

    // Log to ai_copy_generations table
    await supabase.from('ai_copy_generations').insert({
      user_id: user.id,
      listing_id: body.listing_id || null,
      copy_type: 'hashtags',
      input_data: { property, platform, count },
      output_text: result.text,
      tokens_used: result.tokensUsed,
      model: result.model
    })

    // Increment usage counter
    if (profile) {
      await supabase
        .from('profiles')
        .update({ ai_captions_used: captionsUsed + 1 })
        .eq('id', user.id)
    }

    return NextResponse.json({
      hashtags: hashtagsArray,
      hashtagsText: result.text,
      tokensUsed: result.tokensUsed,
      generationsRemaining: profile?.plan === 'agency' ? 'unlimited' : 
        (profile?.plan === 'pro' ? 50 : 10) - (captionsUsed + 1)
    })

  } catch (error) {
    console.error('Hashtag generation error:', error)
    return NextResponse.json({ error: 'Failed to generate hashtags' }, { status: 500 })
  }
}
