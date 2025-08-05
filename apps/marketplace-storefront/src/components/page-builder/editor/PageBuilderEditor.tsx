'use client'

import { Eye, Plus, Redo, Save, Settings, Undo } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { type BaseSection, SectionRenderer, type SectionType } from '../sections'
import { SectionLibrary } from './SectionLibrary'
import { SectionSettings } from './SectionSettings'

interface PageBuilderEditorProps {
  initialSections?: BaseSection[]
  onSave?: (sections: BaseSection[]) => void
  templateId?: string
}

export function PageBuilderEditor({
  initialSections = [],
  onSave,
  templateId,
}: PageBuilderEditorProps) {
  const [sections, setSections] = useState<BaseSection[]>(initialSections)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [history, setHistory] = useState<BaseSection[][]>([initialSections])
  const [historyIndex, setHistoryIndex] = useState(0)

  const addToHistory = (newSections: BaseSection[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newSections)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setSections(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setSections(history[historyIndex + 1])
    }
  }

  const addSection = (type: SectionType, index?: number) => {
    const newSection: BaseSection = {
      id: `section-${Date.now()}`,
      type,
      name: `Nouvelle section ${type}`,
      order: index ?? sections.length,
      isVisible: true,
      content: {},
      styles: {},
      responsive: {},
      settings: {},
    }

    const newSections = [...sections]
    if (index !== undefined) {
      newSections.splice(index, 0, newSection)
      // Réorganiser les ordres
      newSections.forEach((section, i) => {
        section.order = i
      })
    } else {
      newSections.push(newSection)
    }

    setSections(newSections)
    addToHistory(newSections)
    setSelectedSection(newSection.id)
  }

  const updateSection = (sectionId: string, updates: Partial<BaseSection>) => {
    const newSections = sections.map((section) =>
      section.id === sectionId ? { ...section, ...updates } : section
    )
    setSections(newSections)
    addToHistory(newSections)
  }

  const deleteSection = (sectionId: string) => {
    const newSections = sections.filter((s) => s.id !== sectionId)
    setSections(newSections)
    addToHistory(newSections)
    setSelectedSection(null)
  }

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections]
    const [movedSection] = newSections.splice(fromIndex, 1)
    newSections.splice(toIndex, 0, movedSection)

    // Réorganiser les ordres
    newSections.forEach((section, i) => {
      section.order = i
    })

    setSections(newSections)
    addToHistory(newSections)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('sectionIndex', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('sectionIndex'))
    if (dragIndex !== dropIndex) {
      moveSection(dragIndex, dropIndex)
    }
  }

  const handleSave = () => {
    onSave?.(sections)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre d'outils */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Éditeur de page</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={undo}
                  disabled={historyIndex === 0}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                  title="Annuler"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex === history.length - 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                  title="Rétablir"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLibrary(!showLibrary)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Ajouter une section
              </button>

              <button
                onClick={() => setIsPreview(!isPreview)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md',
                  isPreview ? 'bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                )}
              >
                <Eye className="w-4 h-4" />
                {isPreview ? 'Éditer' : 'Prévisualiser'}
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex">
        {/* Zone d'édition */}
        <div className="flex-1">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] m-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-4">Aucune section ajoutée</p>
              <button
                onClick={() => setShowLibrary(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Ajouter une première section
              </button>
            </div>
          ) : (
            <div className={cn('pb-20', isPreview && 'pointer-events-none')}>
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  draggable={!isPreview}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={cn(
                    'relative group',
                    !isPreview && 'cursor-move',
                    selectedSection === section.id && 'ring-2 ring-blue-500'
                  )}
                  onClick={() => !isPreview && setSelectedSection(section.id)}
                >
                  {!isPreview && (
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white rounded shadow-lg p-1 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSection(section.id)
                            setShowSettings(true)
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Paramètres"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSection(section.id)
                          }}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                          title="Supprimer"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  <SectionRenderer
                    section={section}
                    isEditing={!isPreview && selectedSection === section.id}
                    onUpdate={(content) => updateSection(section.id, { content })}
                    onStyleUpdate={(styles) => updateSection(section.id, { styles })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panneau latéral pour les paramètres */}
        {showSettings && selectedSection && (
          <SectionSettings
            section={sections.find((s) => s.id === selectedSection)!}
            onUpdate={(updates) => updateSection(selectedSection, updates)}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>

      {/* Bibliothèque de sections */}
      {showLibrary && (
        <SectionLibrary
          onSelect={(type) => {
            addSection(type)
            setShowLibrary(false)
          }}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  )
}
