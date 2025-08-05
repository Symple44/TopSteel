'use client'

import { useState } from 'react'
import { X, Palette, Layout, Eye, Code } from 'lucide-react'
import { BaseSection, SectionStyles, SectionSettings as Settings } from '../sections'

interface SectionSettingsProps {
  section: BaseSection
  onUpdate: (updates: Partial<BaseSection>) => void
  onClose: () => void
}

type TabType = 'content' | 'style' | 'responsive' | 'advanced'

export function SectionSettings({ section, onUpdate, onClose }: SectionSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('content')

  const tabs = [
    { id: 'content' as TabType, name: 'Contenu', icon: Layout },
    { id: 'style' as TabType, name: 'Style', icon: Palette },
    { id: 'responsive' as TabType, name: 'Responsive', icon: Eye },
    { id: 'advanced' as TabType, name: 'Avancé', icon: Code },
  ]

  const updateContent = (updates: any) => {
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
              <label className="block text-sm font-medium mb-2">Titre</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="Votre titre principal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sous-titre</label>
              <input
                type="text"
                value={section.content.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="Votre sous-titre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={section.content.description || ''}
                onChange={(e) => updateContent({ description: e.target.value })}
                className="w-full p-2 border rounded-md h-24"
                placeholder="Votre description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Image de fond</label>
              <input
                type="url"
                value={section.content.backgroundImage || ''}
                onChange={(e) => updateContent({ backgroundImage: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="URL de l'image"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Alignement</label>
              <select
                value={section.content.alignment || 'center'}
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
              <label className="block text-sm font-medium mb-2">Titre</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contenu</label>
              <textarea
                value={section.content.content || ''}
                onChange={(e) => updateContent({ content: e.target.value })}
                className="w-full p-2 border rounded-md h-32"
                placeholder="Votre contenu HTML"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Colonnes</label>
              <select
                value={section.content.columns || 1}
                onChange={(e) => updateContent({ columns: parseInt(e.target.value) })}
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
              <label className="block text-sm font-medium mb-2">Titre</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Source des produits</label>
              <select
                value={section.content.source || 'featured'}
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
              <label className="block text-sm font-medium mb-2">Nombre de produits</label>
              <input
                type="number"
                value={section.content.limit || 12}
                onChange={(e) => updateContent({ limit: parseInt(e.target.value) })}
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
        <label className="block text-sm font-medium mb-2">Couleur de fond</label>
        <input
          type="color"
          value={section.styles.backgroundColor || '#ffffff'}
          onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
          className="w-full h-10 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Image de fond</label>
        <input
          type="url"
          value={section.styles.backgroundImage || ''}
          onChange={(e) => updateStyles({ backgroundImage: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="URL de l'image"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Padding haut</label>
          <input
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
          <label className="block text-sm font-medium mb-2">Padding bas</label>
          <input
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
        <label className="block text-sm font-medium mb-2">CSS personnalisé</label>
        <textarea
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
        <label className="block text-sm font-medium mb-2">Nom de la section</label>
        <input
          type="text"
          value={section.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">ID CSS</label>
        <input
          type="text"
          value={section.settings.id || ''}
          onChange={(e) => updateSettings({ id: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="section-id"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Classes CSS</label>
        <input
          type="text"
          value={section.settings.customClass || ''}
          onChange={(e) => updateSettings({ customClass: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="ma-classe-css"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Type de conteneur</label>
        <select
          value={section.settings.container || 'boxed'}
          onChange={(e) => updateSettings({ container: e.target.value as any })}
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
          id="visible"
          checked={section.isVisible}
          onChange={(e) => onUpdate({ isVisible: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="visible" className="text-sm font-medium">
          Section visible
        </label>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l shadow-xl z-40 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-semibold">Paramètres de section</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
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
