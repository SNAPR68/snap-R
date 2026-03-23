'use client'

import { Button } from '@/components/ui/button'
import { Download, Trash2, Mail } from 'lucide-react'

interface LeadBulkActionsProps {
  selectedLeads: Set<string>
  totalLeads: number
  onSelectAll: (select: boolean) => void
  onDeselectAll: () => void
  onBulkStatusChange: (status: string) => void
  onBulkDelete: () => void
  onBulkExport: () => void
  onBulkEmail: () => void
  loading: boolean
}

export function LeadBulkActions({
  selectedLeads,
  totalLeads,
  onSelectAll,
  onDeselectAll,
  onBulkStatusChange,
  onBulkDelete,
  onBulkExport,
  onBulkEmail,
  loading,
}: LeadBulkActionsProps) {
  const isAllSelected = selectedLeads.size === totalLeads && totalLeads > 0
  const someSelected = selectedLeads.size > 0

  if (!someSelected) {
    return null
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
      {/* Selection Info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white">
          {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
        </p>
        <button
          onClick={onDeselectAll}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Clear selection
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            onClick={() => onBulkStatusChange('contacted')}
            disabled={loading}
            className="flex-1 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30"
          >
            Mark Contacted
          </Button>
          <Button
            onClick={() => onBulkStatusChange('qualified')}
            disabled={loading}
            className="flex-1 bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
          >
            Mark Qualified
          </Button>
          <Button
            onClick={() => onBulkStatusChange('converted')}
            disabled={loading}
            className="flex-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
          >
            Mark Converted
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onBulkEmail}
            disabled={loading}
            className="flex-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email Selected
          </Button>
          <Button
            onClick={onBulkExport}
            disabled={loading}
            className="flex-1 bg-white/10 text-white hover:bg-white/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={onBulkDelete}
            disabled={loading}
            className="flex-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
