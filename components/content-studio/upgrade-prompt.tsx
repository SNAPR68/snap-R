'use client'

import { Lock, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface UpgradePromptProps {
  feature: string
  currentPlan: string
  requiredPlan?: string
}

export function UpgradePrompt({ feature, currentPlan, requiredPlan = 'Starter' }: UpgradePromptProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl flex items-center justify-center">
          <Lock className="w-8 h-8 text-[#D4AF37]" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Unlock {feature}</h2>
          <p className="text-white/60">
            Upgrade to {requiredPlan} or higher to access {feature.toLowerCase()} and create stunning marketing content for your listings.
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 text-left">
            <Sparkles className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
            <div>
              <p className="text-white font-medium">What you'll get:</p>
              <ul className="text-white/60 text-sm mt-1 space-y-1">
                <li>• AI-generated captions & descriptions</li>
                <li>• Instagram, Facebook, TikTok templates</li>
                <li>• Auto-branded with your logo & colors</li>
                <li>• One-click content creation</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/dashboard/billing">
            <Button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black font-semibold">
              Upgrade to {requiredPlan}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <p className="text-white/40 text-sm">
            Currently on: <span className="text-white/60 capitalize">{currentPlan}</span> plan
          </p>
        </div>
      </div>
    </div>
  )
}
