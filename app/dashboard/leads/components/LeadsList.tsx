'use client'

import { Mail, Phone, MapPin, ChevronRight, Star } from 'lucide-react'

interface LeadListing {
  address: string | null
  city: string | null
  state: string | null
  title: string | null
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  status: string
  created_at: string
  updated_at: string
  listings?: LeadListing | null
}

interface LeadsListProps {
  leads: Lead[]
  selectedLeadId: string | null
  onSelectLead: (leadId: string) => void
  onStatusChange: (leadId: string, status: string) => void
  loading: boolean
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  qualified: 'bg-green-500/20 text-green-300 border-green-500/30',
  converted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  archived: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
}

export function LeadsList({
  leads,
  selectedLeadId,
  onSelectLead,
  onStatusChange,
  loading,
}: LeadsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-white/50">Loading leads...</p>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-white/50">
        <p>No leads yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {leads.map(lead => (
        <button
          key={lead.id}
          onClick={() => onSelectLead(lead.id)}
          className={`w-full text-left p-4 rounded-lg border transition-all ${
            selectedLeadId === lead.id
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="font-semibold text-white">{lead.name}</p>
              {lead.listings && (
                <div className="flex items-center gap-1 text-xs text-white/60 mt-1">
                  <MapPin className="w-3 h-3" />
                  {lead.listings.title || lead.listings.address}
                </div>
              )}
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[lead.status] || statusColors.new}`}>
              {lead.status}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-xs text-white/60">
            {lead.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {lead.email}
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                {lead.phone}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
