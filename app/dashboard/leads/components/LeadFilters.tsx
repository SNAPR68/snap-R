'use client'

import { Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'archived'

interface LeadFiltersProps {
  searchQuery: string
  selectedStatus: LeadStatus | 'all'
  sortBy: 'recent' | 'oldest'
  onSearchChange: (query: string) => void
  onStatusChange: (status: LeadStatus | 'all') => void
  onSortChange: (sort: 'recent' | 'oldest') => void
  onClearFilters: () => void
}

const statusOptions = [
  { value: 'all', label: 'All Leads' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'archived', label: 'Archived' },
]

export function LeadFilters({
  searchQuery,
  selectedStatus,
  sortBy,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onClearFilters,
}: LeadFiltersProps) {
  const isFiltered = searchQuery !== '' || selectedStatus !== 'all' || sortBy !== 'recent'

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <Input
          type="text"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className="text-white/60 text-sm block mb-2">Status</label>
        <select
          value={selectedStatus}
          onChange={e => onStatusChange(e.target.value as LeadStatus | 'all')}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div>
        <label className="text-white/60 text-sm block mb-2">Sort By</label>
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value as 'recent' | 'oldest')}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Clear Filters */}
      {isFiltered && (
        <button
          onClick={onClearFilters}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
      )}
    </div>
  )
}
