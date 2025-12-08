'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'

interface LogoUploaderProps {
  currentLogo?: string | null
  onUpload: (url: string) => void
  label?: string
}

export function LogoUploader({ currentLogo, onUpload, label = 'Logo' }: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentLogo || null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `brand-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      onUpload(publicUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload logo. Please try again.')
      setPreview(currentLogo || null)
    } finally {
      setUploading(false)
    }
  }, [supabase, onUpload, currentLogo])

  const handleRemove = () => {
    setPreview(null)
    onUpload('')
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/80">{label}</label>
      
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/10 border border-white/20">
              <img 
                src={preview} 
                alt="Logo preview" 
                className="w-full h-full object-contain"
              />
            </div>
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-white/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-white/50" />
                <span className="text-xs text-white/50 mt-1">Upload</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}

        {preview && (
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" className="pointer-events-none">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Change
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  )
}
