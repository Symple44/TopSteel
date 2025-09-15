'use client'

import { Code, Eye, Layout, Palette, X } from 'lucide-react'
import { useId, useState } from 'react'
import type { BaseSection, SectionStyles, SectionSettings as Settings } from '../sections'

interface SectionContent {
  title?: string
  subtitle?: string
  description?: string
  content?: string
  backgroundImage?: string
  alignment?: string
  columns?: number
  source?: string
  limit?: number
  [key: string]: unknown
}

interface SectionSettingsProps {
  section: BaseSection
  onUpdate: (updates: Partial<BaseSection>) => void
  onClose: () => void
}

type TabType = 'content' | 'style' | 'responsive' | 'advanced'

export function SectionSettings({ section, onUpdate, onClose }: SectionSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('content')

  // Generate unique IDs for form elements
  const heroTitleId = useId()
  const heroSubtitleId = useId()
  const heroDescriptionId = useId()
  const heroBgImageId = useId()
  const heroAlignmentId = useId()
  const textBlockTitleId = useId()
  const textBlockContentId = useId()
  const textBlockColumnsId = useId()
  const productsGridTitleId = useId()
  const productsGridSourceId = useId()
  const productsGridLimitId = useId()
  const styleBgColorId = useId()
  const styleBgImageId = useId()
  const stylePaddingTopId = useId()
  const stylePaddingBottomId = useId()
  const styleCustomCssId = useId()
  const advancedSectionNameId = useId()
  const advancedCssId = useId()
  const advancedCssClassesId = useId()
  const advancedContainerTypeId = useId()
  const visibleId = useId()

  const tabs = [
    { id: 'content' as TabType, name: 'Contenu', icon: Layout },
    { id: 'style' as TabType, name: 'Style', icon: Palette },
    { id: 'responsive' as TabType, name: 'Responsive', icon: Eye },
    { id: 'advanced' as TabType, name: 'Avancé', icon: Code },
  ]

  const updateContent = (updates: Record<string, unknown>) => {
    onUpdate({ content: { ...section.content, ...updates } })
  }

  const updateStyles = (updates: Partial<SectionStyles>) => {
    onUpdate({ styles: { ...section.styles, ...updates } })
  }

  const updateSettings = (updates: Partial<Settings>) => {
    onUpdate({ settings: { ...section.settings, ...updates } })
  }

  const renderContentTab = () => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor={heroTitleId} className="block text-sm font-medium mb-2">
                Titre
              </label>
              <input
                id={heroTitleId}
                type="text"
                value={(section.content as SectionContent)?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="Votre titre principal"
              />
            </div>
            <div>
              <label htmlFor={heroSubtitleId} className="block text-sm font-medium mb-2">
                Sous-titre
              </label>
              <input
                id={heroSubtitleId}
                type="text"
                value={(section.content as SectionContent)?.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="Votre sous-titre"
              />
            </div>
            <div>
              <label htmlFor={heroDescriptionId} className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id={heroDescriptionId}
                value={(section.content as SectionContent)?.description || ''}
                onChange={(e) => updateContent({ description: e.target.value })}
                className="w-full p-2 border rounded-md h-24"
                placeholder="Votre description"
              />
            </div>
            <div>
              <label htmlFor={heroBgImageId} className="block text-sm font-medium mb-2">
                Image de fond
              </label>
              <input
                id={heroBgImageId}
                type="url"
                value={(section.content as SectionContent)?.backgroundImage || ''}
                onChange={(e) => updateContent({ backgroundImage: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="URL de l'image"
              />
            </div>
            <div>
              <label htmlFor={heroAlignmentId} className="block text-sm font-medium mb-2">
                Alignement
              </label>
              <select
                id={heroAlignmentId}
                value={(section.content as SectionContent)?.alignment || 'center'}
                onChange={(e) => updateContent({ alignment: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="left">Gauche</option>
                <option value="center">Centre</option>
                <option value="right">Droite</option>
              </select>
            </div>
          </div>
        )

      case 'text_block':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor={textBlockTitleId} className="block text-sm font-medium mb-2">
                Titre
              </label>
              <input
                id={textBlockTitleId}
                type="text"
                value={(section.content as SectionContent)?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label htmlFor={textBlockContentId} className="block text-sm font-medium mb-2">
                Contenu
              </label>
              <textarea
                id={textBlockContentId}
                value={(section.content as SectionContent)?.content || ''}
                onChange={(e) => updateContent({ content: e.target.value })}
                className="w-full p-2 border rounded-md h-32"
                placeholder="Votre contenu HTML"
              />
            </div>
            <div>
              <label htmlFor={textBlockColumnsId} className="block text-sm font-medium mb-2">
                Colonnes
              </label>
              <select
                id={textBlockColumnsId}
                value={(section.content as SectionContent)?.columns || 1}
                onChange={(e) => updateContent({ columns: parseInt(e.target.value, 10) })}
                className="w-full p-2 border rounded-md"
              >
                <option value={1}>1 colonne</option>
                <option value={2}>2 colonnes</option>
                <option value={3}>3 colonnes</option>
              </select>
            </div>
          </div>
        )

      case 'products_grid':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor={productsGridTitleId} className="block text-sm font-medium mb-2">
                Titre
              </label>
              <input
                id={productsGridTitleId}
                type="text"
                value={(section.content as SectionContent)?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label htmlFor={productsGridSourceId} className="block text-sm font-medium mb-2">
                Source des produits
              </label>
              <select
                id={productsGridSourceId}
                value={(section.content as SectionContent)?.source || 'featured'}
                onChange={(e) => updateContent({ source: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="featured">Produits mis en avant</option>
                <option value="latest">Derniers produits</option>
                <option value="best-selling">Meilleures ventes</option>
                <option value="category">Par catégorie</option>
              </select>
            </div>
            <div>
              <label htmlFor={productsGridLimitId} className="block text-sm font-medium mb-2">
                Nombre de produits
              </label>
              <input
                id={productsGridLimitId}
                type="number"
                value={(section.content as SectionContent)?.limit || 12}
                onChange={(e) => updateContent({ limit: parseInt(e.target.value, 10) })}
                className="w-full p-2 border rounded-md"
                min="1"
                max="24"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Configuration de contenu non disponible pour ce type de section
          </div>
        )
    }
  }

  const renderStyleTab = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor={styleBgColorId} className="block text-sm font-medium mb-2">
          Couleur de fond
        </label>
        <input
          id={styleBgColorId}
          type="color"
          value={section.styles.backgroundColor || '#ffffff'}
          onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
          className="w-full h-10 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor={styleBgImageId} className="block text-sm font-medium mb-2">
          Image de fond
        </label>
        <input
          id={styleBgImageId}
          type="url"
          value={section.styles.backgroundImage || ''}
          onChange={(e) => updateStyles({ backgroundImage: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="URL de l'image"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={stylePaddingTopId} className="block text-sm font-medium mb-2">
            Padding haut
          </label>
          <input
            id={stylePaddingTopId}
            type="text"
            value={section.styles.padding?.top || ''}
            onChange={(e) =>
              updateStyles({
                padding: { ...section.styles.padding, top: e.target.value },
              })
            }
            className="w-full p-2 border rounded-md"
            placeholder="ex: 20px"
          />
        </div>
        <div>
          <label htmlFor={stylePaddingBottomId} className="block text-sm font-medium mb-2">
            Padding bas
          </label>
          <input
            id={stylePaddingBottomId}
            type="text"
            value={section.styles.padding?.bottom || ''}
            onChange={(e) =>
              updateStyles({
                padding: { ...section.styles.padding, bottom: e.target.value },
              })
            }
            className="w-full p-2 border rounded-md"
            placeholder="ex: 20px"
          />
        </div>
      </div>

      <div>
        <label htmlFor={styleCustomCssId} className="block text-sm font-medium mb-2">
          CSS personnalisé
        </label>
        <textarea
          id={styleCustomCssId}
          value={section.styles.customCSS || ''}
          onChange={(e) => updateStyles({ customCSS: e.target.value })}
          className="w-full p-2 border rounded-md h-24 font-mono text-sm"
          placeholder="/* Votre CSS personnalisé */"
        />
      </div>
    </div>
  )

  const renderAdvancedTab = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor={advancedSectionNameId} className="block text-sm font-medium mb-2">
          Nom de la section
        </label>
        <input
          id={advancedSectionNameId}
          type="text"
          value={section.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor={advancedCssId} className="block text-sm font-medium mb-2">
          ID CSS
        </label>
        <input
          id={advancedCssId}
          type="text"
          value={section.settings.id || ''}
          onChange={(e) => updateSettings({ id: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="section-id"
        />
      </div>

      <div>
        <label htmlFor={advancedCssClassesId} className="block text-sm font-medium mb-2">
          Classes CSS
        </label>
        <input
          id={advancedCssClassesId}
          type="text"
          value={section.settings.customClass || ''}
          onChange={(e) => updateSettings({ customClass: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="ma-classe-css"
        />
      </div>

      <div>
        <label htmlFor={advancedContainerTypeId} className="block text-sm font-medium mb-2">
          Type de conteneur
        </label>
        <select
          id={advancedContainerTypeId}
          value={section.settings.container || 'boxed'}
          onChange={(e) =>
            updateSettings({ container: e.target.value as 'full-width' | 'boxed' | 'custom' })
          }
          className="w-full p-2 border rounded-md"
        >
          <option value="boxed">Conteneur centré</option>
          <option value="full-width">Pleine largeur</option>
          <option value="custom">Personnalisé</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={visibleId}
          checked={section.isVisible}
          onChange={(e) => onUpdate({ isVisible: e.target.checked })}
          className="rounded"
        />
        <label htmlFor={visibleId} className="text-sm font-medium">
          Section visible
        </label>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l shadow-xl z-40 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-semibold">Paramètres de section</h3>
        <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 p-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="p-6 overflow-y-auto h-full">
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'style' && renderStyleTab()}
        {activeTab === 'responsive' && (
          <div className="text-center py-8 text-gray-500">
            Configuration responsive à implémenter
          </div>
        )}
        {activeTab === 'advanced' && renderAdvancedTab()}
      </div>
    </div>
  )
}
