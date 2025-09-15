'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React from 'react'
import { PageBuilderEditor } from '@/components/page-builder'
import type { BaseSection } from '@/components/page-builder/sections'
import { marketplaceApi } from '@/lib/api/client'

interface PageTemplate {
  id: string
  name: string
  slug: string
  pageType: string
  status: string
  description?: string
  sections?: BaseSection[]
  metadata?: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
    canonical?: string
  }
  settings?: {
    layout?: 'full-width' | 'boxed' | 'sidebar-left' | 'sidebar-right'
    showHeader?: boolean
    showFooter?: boolean
    showBreadcrumbs?: boolean
    customClass?: string
    backgroundColor?: string
    backgroundImage?: string
  }
  version: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
  scheduledAt?: string
  createdBy?: string
  updatedBy?: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PageEditorPage({ params }: PageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { id } = React.use(params)

  const { data: template, isLoading } = useQuery<PageTemplate | null>({
    queryKey: ['pageTemplate', id],
    queryFn: async () => {
      if (id === 'new') return null
      const response = await marketplaceApi.get(`/page-builder/templates/${id}`)
      return (response as { data: PageTemplate }).data
    },
  })

  const saveMutation = useMutation<PageTemplate, Error, BaseSection[]>({
    mutationFn: async (sections: BaseSection[]) => {
      const templateData = {
        name: template?.name || 'Nouvelle page',
        slug: template?.slug || 'nouvelle-page',
        pageType: template?.pageType || 'custom',
        status: template?.status || 'draft',
        description: template?.description || '',
        sections: sections.map((section) => ({
          type: section.type,
          name: section.name,
          content: section.content,
          styles: section.styles,
          responsive: section.responsive,
          settings: section.settings,
        })),
      }

      if (id === 'new') {
        const response = await marketplaceApi.post('/page-builder/templates', templateData)
        return (response as { data: PageTemplate }).data
      } else {
        const response = await marketplaceApi.put(`/page-builder/templates/${id}`, templateData)
        return (response as { data: PageTemplate }).data
      }
    },
    onSuccess: (savedTemplate: PageTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['pageTemplates'] })
      queryClient.invalidateQueries({ queryKey: ['pageTemplate', id] })

      if (id === 'new') {
        router.push(`/admin/page-builder/${savedTemplate.id}`)
      }
    },
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
