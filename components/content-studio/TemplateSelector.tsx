'use client'

import { ChevronRight } from 'lucide-react'
import { TemplateDefinition, TEMPLATE_CATEGORIES } from '@/lib/content/templates'

interface TemplateSelectorProps {
  category: string
  templates: Record<string, TemplateDefinition>
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'story'
  onCategoryChange: (category: string) => void
  onTemplateSelect: (platform: string, template: TemplateDefinition) => void
  currentTemplate: TemplateDefinition
}

export function TemplateSelector({
  category,
  templates,
  platform,
  onCategoryChange,
  onTemplateSelect,
  currentTemplate,
}: TemplateSelectorProps) {
  const currentCategories = TEMPLATE_CATEGORIES
  const categoryTemplates = Object.values(templates).filter((t: TemplateDefinition) => t.category === category)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-3">Template Category</label>
        <div className="grid grid-cols-2 gap-2">
          {currentCategories.map((cat: { id: string; name: string; icon: string }) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`p-3 rounded-lg transition-all text-left ${
                category === cat.id
                  ? 'bg-amber-500/30 border border-amber-500 text-amber-300'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:border-white/20'
              }`}
            >
              <p className="font-medium">{cat.name}</p>
              <p className="text-xs text-white/50 mt-1">{cat.icon}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-3">Templates</label>
        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
          {categoryTemplates.map((template: TemplateDefinition) => (
            <button
              key={template.id}
              onClick={() => onTemplateSelect(platform, template)}
              className={`p-3 rounded-lg transition-all text-left group ${
                currentTemplate.id === template.id
                  ? 'bg-amber-500/20 border border-amber-500'
                  : 'bg-white/5 border border-white/10 hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{template.name}</p>
                  <p className="text-xs text-white/50 mt-1">{template.description}</p>
                </div>
                {currentTemplate.id === template.id && (
                  <ChevronRight className="w-4 h-4 text-amber-400 mt-1" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
