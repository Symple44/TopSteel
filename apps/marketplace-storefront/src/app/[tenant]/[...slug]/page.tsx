'use client'

import React from 'react'
import { PageRenderer } from '@/components/page-builder'

interface DynamicPageProps {
  params: Promise<{ tenant: string; slug: string[] }>
}

export default function DynamicPage({ params }: DynamicPageProps) {
  const { slug } = React.use(params)
  const pageSlug = slug.join('/')

  return (
    <div>
      <PageRenderer slug={pageSlug} />
    </div>
  )
}