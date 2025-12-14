'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, X, Loader2 } from 'lucide-react'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (date: string) => Promise<void>
  platform: string
}

export function ScheduleModal({ isOpen, onClose, onSchedule, platform }: ScheduleModalProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSchedule = async () => {
    if (!date || !time) return
    setScheduling(true)
    setError('')
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString()
      await onSchedule(scheduledAt)
      onClose()
    } catch (e) {
      setError('Failed to schedule post')
    } finally {
      setScheduling(false)
    }
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            Schedule Post
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <p className="text-sm text-white/60 mb-4">
          Schedule your {platform} post to be published automatically.
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-white/50 uppercase mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase mb-1 block">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white"
            />
          </div>
        </div>

        {date && time && (
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {new Date(`${date}T${time}`).toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 border-white/20 text-white">
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={scheduling || !date || !time}
            className="flex-1 bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold"
          >
            {scheduling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
