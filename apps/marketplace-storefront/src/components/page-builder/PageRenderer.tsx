'use client'

import { useQuery } from '@tanstack/react-query'
import { SectionRenderer, BaseSection } from './sections'
import { marketplaceApi } from '@/lib/api/client'

interface PageRendererProps {
  templateId?: string
  slug?: string
  sections?: BaseSection[]
  isPreview?: boolean
}

export function PageRenderer({ 
  templateId, 
  slug, 
  sections: providedSections,
  isPreview = false 
}: PageRendererProps) {
  const { data: template, isLoading } = useQuery({
    queryKey: ['pageTemplate', templateId, slug],
    queryFn: async () => {
      if (providedSections) return { sections: providedSections }
      
      if (templateId) {
        const response = await marketplaceApi.get(`/page-templates/${templateId}`)
        return (response as any).data
      } else if (slug) {
        const response = await marketplaceApi.get(`/page-templates/by-slug/${slug}`)
        return (response as any).data
      }
      
      throw new Error('Template ID or slug required')
    },
    enabled: !providedSections && (!!templateId || !!slug)
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const sections = providedSections || template?.sections || []
  const visibleSections = sections
    .filter((section: BaseSection) => section.isVisible)
    .sort((a: BaseSection, b: BaseSection) => a.order - b.order)

  if (visibleSections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Page en construction
          </h2>
          <p className="text-gray-600">
            Cette page n'a pas encore de contenu configuré.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {visibleSections.map((section: BaseSection) => (
        <SectionRenderer
          key={section.id}
          section={section}
          isEditing={false}
        />
      ))}
    </div>
  )
}