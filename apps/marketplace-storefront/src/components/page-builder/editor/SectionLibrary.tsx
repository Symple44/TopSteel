'use client'

import { X } from 'lucide-react'
import { SectionType } from '../sections'

interface SectionLibraryProps {
  onSelect: (type: SectionType) => void
  onClose: () => void
}

const sectionCategories = [
  {
    name: 'Héros & Bannières',
    sections: [
      { type: SectionType.HERO, name: 'Section Héros', icon: '🎯' },
      { type: SectionType.BANNER, name: 'Bannière', icon: '📢' },
    ],
  },
  {
    name: 'Produits',
    sections: [
      { type: SectionType.PRODUCTS_GRID, name: 'Grille de produits', icon: '📦' },
      { type: SectionType.PRODUCTS_CAROUSEL, name: 'Carrousel de produits', icon: '🎠' },
      { type: SectionType.CATEGORIES, name: 'Catégories', icon: '📂' },
    ],
  },
  {
    name: 'Contenu',
    sections: [
      { type: SectionType.TEXT_BLOCK, name: 'Bloc de texte', icon: '📝' },
      { type: SectionType.IMAGE_GALLERY, name: "Galerie d'images", icon: '🖼️' },
      { type: SectionType.VIDEO, name: 'Vidéo', icon: '🎥' },
      { type: SectionType.FAQ, name: 'FAQ', icon: '❓' },
      { type: SectionType.TESTIMONIALS, name: 'Témoignages', icon: '💬' },
    ],
  },
  {
    name: "Appels à l'action",
    sections: [
      { type: SectionType.CTA, name: 'Call to Action', icon: '🎯' },
      { type: SectionType.NEWSLETTER, name: 'Newsletter', icon: '✉️' },
      { type: SectionType.CONTACT_FORM, name: 'Formulaire de contact', icon: '📧' },
    ],
  },
  {
    name: 'Fonctionnalités',
    sections: [
      { type: SectionType.FEATURES, name: 'Fonctionnalités', icon: '⭐' },
      { type: SectionType.PRICING_TABLE, name: 'Tableau de prix', icon: '💰' },
      { type: SectionType.STATISTICS, name: 'Statistiques', icon: '📊' },
      { type: SectionType.TEAM, name: 'Équipe', icon: '👥' },
    ],
  },
  {
    name: 'Mise en page',
    sections: [
      { type: SectionType.SPACER, name: 'Espace', icon: '↕️' },
      { type: SectionType.DIVIDER, name: 'Séparateur', icon: '➖' },
      { type: SectionType.TABS, name: 'Onglets', icon: '📑' },
      { type: SectionType.ACCORDION, name: 'Accordéon', icon: '🎹' },
    ],
  },
]

export function SectionLibrary({ onSelect, onClose }: SectionLibraryProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">Bibliothèque de sections</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {sectionCategories.map((category) => (
            <div key={category.name} className="mb-8">
              <h3 className="text-lg font-semibold mb-4">{category.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {category.sections.map((section) => (
                  <button
                    type="button"
                    key={section.type}
                    onClick={() => onSelect(section.type)}
                    className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center group"
                  >
                    <div className="text-3xl mb-2">{section.icon}</div>
                    <div className="text-sm font-medium group-hover:text-blue-600">
                      {section.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
