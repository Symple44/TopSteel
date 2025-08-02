'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageBuilderEditor } from '@/components/page-builder'
import { marketplaceApi } from '@/lib/api/client'
import { BaseSection } from '@/components/page-builder/sections'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PageEditorPage({ params }: PageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { id } = React.use(params)

  const { data: template, isLoading } = useQuery({
    queryKey: ['pageTemplate', id],
    queryFn: async () => {
      if (id === 'new') return null
      const response = await marketplaceApi.get(`/page-builder/templates/${id}`)
      return response.data
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (sections: BaseSection[]) => {
      const templateData = {
        name: template?.name || 'Nouvelle page',
        slug: template?.slug || 'nouvelle-page',
        pageType: template?.pageType || 'custom',
        status: template?.status || 'draft',
        description: template?.description || '',
        sections: sections.map(section => ({
          type: section.type,
          name: section.name,
          content: section.content,
          styles: section.styles,
          responsive: section.responsive,
          settings: section.settings
        }))
      }

      if (id === 'new') {
        const response = await marketplaceApi.post('/page-builder/templates', templateData)
        return response.data
      } else {
        const response = await marketplaceApi.put(`/page-builder/templates/${id}`, templateData)
        return response.data
      }
    },
    onSuccess: (savedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['pageTemplates'] })
      queryClient.invalidateQueries({ queryKey: ['pageTemplate', id] })
      
      if (id === 'new') {
        router.push(`/admin/page-builder/${savedTemplate.id}`)
      }
    }
  })

  const handleSave = (sections: BaseSection[]) => {
    saveMutation.mutate(sections)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <PageBuilderEditor
      initialSections={template?.sections || []}
      onSave={handleSave}
      templateId={id === 'new' ? undefined : id}
    />
  )
}