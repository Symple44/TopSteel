'use client'

import dynamic from 'next/dynamic'
import { SectionType, BaseSection } from './types'

// Import dynamique des composants de sections
const sectionComponents = {
  [SectionType.HERO]: dynamic(() => import('./HeroSection').then(mod => mod.HeroSection)),
  [SectionType.TEXT_BLOCK]: dynamic(() => import('./TextBlockSection').then(mod => mod.TextBlockSection)),
  [SectionType.PRODUCTS_GRID]: dynamic(() => import('./ProductsGridSection').then(mod => mod.ProductsGridSection)),
  [SectionType.CTA]: dynamic(() => import('./CTASection').then(mod => mod.CTASection)),
  // Ajouter d'autres sections au fur et à mesure
}

interface SectionRendererProps {
  section: BaseSection
  isEditing?: boolean
  onUpdate?: (content: any) => void
  onStyleUpdate?: (styles: any) => void
}

export function SectionRenderer({ 
  section, 
  isEditing = false, 
  onUpdate,
  onStyleUpdate 
}: SectionRendererProps) {
  const Component = sectionComponents[section.type]

  if (!Component) {
    console.warn(`Section type "${section.type}" not implemented`)
    return (
      <div className="p-8 bg-gray-100 text-center">
        <p className="text-gray-600">Section "{section.type}" non implémentée</p>
      </div>
    )
  }

  return (
    <Component
      section={section}
      isEditing={isEditing}
      onUpdate={onUpdate}
      onStyleUpdate={onStyleUpdate}
    />
  )
}

export * from './types'