'use client'

import { Phone, Mail, Building, Loader2, AlertCircle, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Agent {
  name: string
  email: string | null
  phone: string | null
  avatar?: string | null
  company?: string | null
  title?: string | null
}

interface ContactForm {
  name: string
  email: string
  phone: string
  message: string
}

interface PropertyContactProps {
  agent: Agent | null
  listing: { title?: string | null; address?: string | null; id?: string }
  contactForm: ContactForm
  formSubmitted: boolean
  isSubmitting: boolean
  submitError: string | null
  onFormChange: (form: ContactForm) => void
  onSubmit: () => void
}

export function PropertyContact({
  agent,
  listing,
  contactForm,
  formSubmitted,
  isSubmitting,
  submitError,
  onFormChange,
  onSubmit,
}: PropertyContactProps) {
  return (
    <div className="space-y-6">
      {/* Agent Info */}
      {agent && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Listing Agent</h3>
          <div className="flex items-start gap-4">
            {agent.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold text-white">{agent.name}</p>
              {agent.title && (
                <p className="text-sm text-white/60">{agent.title}</p>
              )}
              {agent.company && (
                <div className="flex items-center gap-1 text-sm text-white/60 mt-1">
                  <Building className="w-4 h-4" />
                  {agent.company}
                </div>
              )}
              <div className="flex flex-col gap-2 mt-3">
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {agent.phone}
                  </a>
                )}
                {agent.email && (
                  <a
                    href={`mailto:${agent.email}`}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {agent.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Form */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Inquire About This Property</h3>

        {formSubmitted && !submitError ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex gap-3">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-400">Thanks for your interest!</p>
              <p className="text-sm text-green-300 mt-1">We'll get back to you soon.</p>
            </div>
          </div>
        ) : (
          <>
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{submitError}</p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSubmit()
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-white/60 text-sm block mb-1">Name</label>
                <Input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) =>
                    onFormChange({ ...contactForm, name: e.target.value })
                  }
                  placeholder="Your name"
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1">Email</label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    onFormChange({ ...contactForm, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1">Phone</label>
                <Input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) =>
                    onFormChange({ ...contactForm, phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) =>
                    onFormChange({ ...contactForm, message: e.target.value })
                  }
                  placeholder="Tell us more about your interest..."
                  rows={4}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Inquiry'
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
