import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'content-library'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${user.id}/${folder}/${Date.now()}-${file.name}`
    
    const { data, error } = await supabase.storage
      .from('content-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      // Try raw-images bucket as fallback
      const { data: fallbackData, error: fallbackError } = await supabase.storage
        .from('raw-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        })
      
      if (fallbackError) {
        console.error('Upload error:', fallbackError)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
      }
      
      const { data: urlData } = supabase.storage
        .from('raw-images')
        .getPublicUrl(fileName)
      
      return NextResponse.json({ url: urlData.publicUrl, path: fileName })
    }

    const { data: urlData } = supabase.storage
      .from('content-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: urlData.publicUrl, path: fileName })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 })
  }
}
