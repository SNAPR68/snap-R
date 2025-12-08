import { BrandForm } from '@/components/brand/brand-form'
import { Palette } from 'lucide-react'

export default function BrandProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-[#D4AF37] to-[#B8960C] rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-2xl font-bold">Brand Profile</h1>
          </div>
          <p className="text-white/60">
            Set up your brand identity for auto-generated marketing content. Your logo, colors, and contact info will be applied to all social posts, flyers, and marketing materials.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <BrandForm />
        </div>
      </div>
    </div>
  )
}
