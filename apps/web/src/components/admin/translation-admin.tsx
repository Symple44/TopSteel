'use client'

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Progress,
  Separator,
  Textarea,
} from '@erp/ui'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Download,
  Globe,
  Hash,
  Languages,
  Save,
  Upload,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n'
import { useTranslation } from '@/lib/i18n/hooks'
import {
  bulkImportTranslations,
  calculateTranslationStats,
  exportToExcel,
  importFromExcel,
  loadTranslationsWithOverrides,
  saveTranslation,
} from '@/lib/i18n/translation-utils'
import type { TranslationEntry, TranslationStats } from '@/lib/i18n/types'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/types'
import { TranslationDataTable } from './TranslationDataTable'

export default function TranslationAdmin() {
  const { t } = useTranslation('admin')
  const { current: currentLanguage } = useLanguage()

  // États - moved before the callback to avoid initialization order issues
  const [entries, setEntries] = useState<TranslationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [_selectedLanguage, _setSelectedLanguage] = useState(currentLanguage.code)
  const [_stats, setStats] = useState<TranslationStats | null>(null)
  const [editingEntry, setEditingEntry] = useState<TranslationEntry | null>(null)
  const [importDialog, setImportDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null)

  // Debounced stats update pour éviter les recalculs excessifs
  const debouncedStatsUpdate = useCallback(() => {
    const timer = setTimeout(() => {
      setStats(calculateTranslationStats(entries))
    }, 500)
    return () => clearTimeout(timer)
  }, [entries])

  const loadTranslations = useCallback(async () => {
    setLoading(true)
    try {
      const loadedEntries = await loadTranslationsWithOverrides()
      setEntries(loadedEntries)
      setStats(calculateTranslationStats(loadedEntries))
    } catch (_error) {
      toast.error(t('modules.translations.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  // Charger les traductions au montage
  useEffect(() => {
    setMounted(true)
    loadTranslations()
  }, [loadTranslations])

  // Fermer le dropdown de catégorie quand on clique ailleurs
  useEffect(() => {
    if (categoryDropdownOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element
        if (!target.closest('[data-category-dropdown]')) {
          setCategoryDropdownOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [categoryDropdownOpen])

  // Mémoriser les calculs coûteux - recalculer seulement quand les entrées changent
  const memoizedStats = useMemo(() => {
    return calculateTranslationStats(entries)
  }, [entries])

  // Gérer l'édition
  const handleEdit = (entry: TranslationEntry) => {
    setEditingEntry({ ...entry })
    setCategoryDropdownOpen(false)
  }

  const handleSave = async () => {
    if (!editingEntry) return

    const success = await saveTranslation(editingEntry)
    if (success) {
      toast.success(t('modules.translations.saveSuccess'))

      // Mettre à jour la liste
      setEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? editingEntry : e)))

      // Les stats seront recalculées automatiquement via useMemo

      setEditingEntry(null)

      // Déclencher un événement pour recharger les traductions
      window.dispatchEvent(new Event('translation-updated'))
    } else {
      toast.error(t('modules.translations.saveError'))
    }
  }

  // Gérer l'édition inline depuis le DataTable
  const handleCellEdit = async (_value: any, row: TranslationEntry) => {
    try {
      const success = await saveTranslation(row)
      if (success) {
        toast.success('Traduction mise à jour')

        // Mettre à jour la liste locale sans recalculer les stats immédiatement
        setEntries((prev) => prev.map((e) => (e.id === row.id ? row : e)))

        // Déclencher un événement pour recharger les traductions
        window.dispatchEvent(new Event('translation-updated'))

        // Recalculer les stats de manière débouncée
        debouncedStatsUpdate()
      } else {
        toast.error(t('modules.translations.saveError'))
      }
    } catch (_error) {
      toast.error(t('modules.translations.saveError'))
    }
  }

  // Gérer l'export
  const handleExport = () => {
    try {
      const languages = ['fr', 'en', 'es']
      const blob = exportToExcel(entries, languages)

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `translations_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()

      URL.revokeObjectURL(url)
      toast.success(t('modules.translations.exportSuccess'))
    } catch (_error) {
      toast.error(t('modules.translations.exportError'))
    }
  }

  // Nouveaux handlers pour les fonctionnalités avancées du DataTable
  const handleCreateTranslation = () => {
    toast.info('Fonctionnalité de création en développement')
  }

  const handleDeleteTranslations = (translations: TranslationEntry[]) => {
    if (translations.length === 0) return

    const translationKeys = translations.map((t) => t.fullKey).join(', ')
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer ${translations.length} traduction(s) ?\n\n${translationKeys}`
    )

    if (confirmed) {
      toast.info('Fonctionnalité de suppression en développement')
    }
  }

  const handleExportTranslations = (translations: TranslationEntry[]) => {
    try {
      const languages = ['fr', 'en', 'es']
      const blob = exportToExcel(translations, languages)

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `translations_selected_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()

      URL.revokeObjectURL(url)
      toast.success(`Export de ${translations.length} traduction(s) réussi`)
    } catch (_error) {
      toast.error(t('modules.translations.exportError'))
    }
  }

  const handleImportTranslations = () => {
    setImportDialog(true)
  }

  const handleDuplicateTranslation = (translation: TranslationEntry) => {
    const duplicatedTranslation = {
      ...translation,
      id: crypto.randomUUID(),
      fullKey: `${translation.fullKey}_copy`,
      key: `${translation.key}_copy`,
      isModified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setEntries((prev) => [...prev, duplicatedTranslation])
    toast.success(`Traduction "${translation.fullKey}" dupliquée`)
  }

  // Gérer l'import
  const handleImport = async () => {
    if (!selectedFile) return

    try {
      // Parser le fichier Excel pour extraire les données
      const parseResult = await importFromExcel(selectedFile, entries)

      if (!parseResult.success) {
        parseResult.errors.forEach((e) => toast.error(e))
        return
      }

      // Créer les entrées de traduction à partir des données parsées
      // Note: importFromExcel modifie les entrées existantes, donc on utilise entries mis à jour
      const response = await bulkImportTranslations(entries)

      if (response.success) {
        toast.success(
          response.message ||
            `Import réussi: ${response.stats?.imported || 0} nouvelles, ${response.stats?.updated || 0} mises à jour`
        )

        if (parseResult.warnings.length > 0) {
          parseResult.warnings.forEach((w) => toast.warning(w))
        }

        // Recharger les traductions depuis l'API
        await loadTranslations()
        setImportDialog(false)
        setSelectedFile(null)
      } else {
        toast.error(response.message || "Erreur lors de l'import")
      }
    } catch (_error) {
      toast.error(t('modules.translations.importError'))
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Languages className="h-8 w-8" />
            Gestion des Traductions
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez et modifiez toutes les traductions de l'application
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            {t('modules.translations.import')}
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('modules.translations.export')}
          </Button>
        </div>
      </div>

      {/* {t('modules.translations.statistics')} */}
      {memoizedStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total des clés</p>
                  <p className="text-2xl font-bold">{memoizedStats.total}</p>
                </div>
                <Hash className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>

          {SUPPORTED_LANGUAGES.map((lang) => (
            <Card key={lang.code}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{lang.flag}</span>
                    <p className="font-medium">{lang.name}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {memoizedStats.percentageComplete[lang.code]}%
                  </span>
                </div>
                <Progress value={memoizedStats.percentageComplete[lang.code]} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{memoizedStats.translated[lang.code]} traduites</span>
                  <span>{memoizedStats.untranslated[lang.code]} manquantes</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* {t('modules.translations.actions')} globales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('modules.translations.quickActions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => handleExport()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>

            <Button
              onClick={() => setImportDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Excel
            </Button>

            <div className="text-sm text-muted-foreground">
              Utilisez les filtres intégrés du tableau pour rechercher et filtrer les traductions
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des traductions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Traductions ({entries.length} total)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <TranslationDataTable
            entries={entries}
            loading={loading}
            onEdit={handleEdit}
            onCellEdit={handleCellEdit}
            onCreate={handleCreateTranslation}
            onDelete={handleDeleteTranslations}
            onExport={handleExportTranslations}
            onImport={handleImportTranslations}
            onDuplicate={handleDuplicateTranslation}
          />
        </CardContent>
      </Card>

      {/* Dialog d'édition - Version personnalisée fonctionnelle */}
      {editingEntry && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80"
          onClick={() => {
            setEditingEntry(null)
            setCategoryDropdownOpen(false)
          }}
        >
          <div
            className="fixed left-[50%] top-[50%] z-[10000] grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Éditer la traduction
              </h2>
              <p className="text-sm text-muted-foreground">
                Modifiez les traductions pour chaque langue
              </p>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Clé
                </Label>
                <code className="text-sm font-mono bg-muted px-3 py-2 rounded block mt-1">
                  {editingEntry.fullKey}
                </code>
              </div>

              <Separator />

              <div className="space-y-4">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <div key={lang.code}>
                    <Label className="flex items-center gap-2 mb-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </Label>
                    <Textarea
                      value={editingEntry.translations[lang.code] || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEditingEntry({
                          ...editingEntry,
                          translations: {
                            ...editingEntry.translations,
                            [lang.code]: e.target.value,
                          },
                        })
                      }
                      placeholder={`Traduction en ${lang.nativeName}...`}
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div data-category-dropdown className="relative">
                  <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Catégorie
                  </Label>
                  <div className="relative mt-1">
                    <button
                      ref={dropdownTriggerRef}
                      type="button"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="block truncate text-left">
                        {editingEntry.category || '(Aucune catégorie)'}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Description
                  </Label>
                  <Input
                    value={editingEntry.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingEntry({
                        ...editingEntry,
                        description: e.target.value,
                      })
                    }
                    placeholder="Description..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingEntry(null)
                  setCategoryDropdownOpen(false)
                }}
                className="mt-2 sm:mt-0"
              >
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Dropdown Portal */}
      {categoryDropdownOpen &&
        mounted &&
        dropdownTriggerRef.current &&
        (() => {
          const triggerRect = dropdownTriggerRef.current?.getBoundingClientRect()
          const uniqueCategories = Array.from(
            new Set(entries.map((entry) => entry.category).filter(Boolean))
          ).sort()
          const dropdownHeight = Math.min((uniqueCategories.length + 1) * 40 + 8, 240) // +1 pour "(Aucune catégorie)"
          const viewportHeight = window.innerHeight
          const spaceBelow = viewportHeight - triggerRect.bottom
          const spaceAbove = triggerRect.top

          // Déterminer si on affiche en dessous ou au-dessus
          const showAbove = spaceBelow < dropdownHeight + 10 && spaceAbove > spaceBelow

          const style: React.CSSProperties = {
            left: triggerRect.left,
            width: Math.max(triggerRect.width, 200),
            maxHeight: showAbove ? Math.min(240, spaceAbove - 10) : Math.min(240, spaceBelow - 10),
          }

          if (showAbove) {
            style.bottom = viewportHeight - triggerRect.top + 4
          } else {
            style.top = triggerRect.bottom + 4
          }

          return createPortal(
            <div
              data-category-dropdown
              className="fixed z-[99999] bg-background border border-border rounded-md shadow-xl overflow-auto min-w-[200px]"
              style={style}
            >
              <button
                type="button"
                onClick={() => {
                  setEditingEntry(
                    editingEntry
                      ? {
                          ...editingEntry,
                          category: '',
                        }
                      : null
                  )
                  setCategoryDropdownOpen(false)
                }}
                className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${editingEntry?.category ? 'opacity-0' : 'opacity-100'}`}
                />
                (Aucune catégorie)
              </button>
              {Array.from(new Set(entries.map((entry) => entry.category).filter(Boolean)))
                .sort()
                .map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setEditingEntry(
                        editingEntry
                          ? {
                              ...editingEntry,
                              category: category,
                            }
                          : null
                      )
                      setCategoryDropdownOpen(false)
                    }}
                    className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${editingEntry?.category === category ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {category}
                  </button>
                ))}
            </div>,
            document.body
          )
        })()}

      {/* Dialog d'import */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modules.translations.importTitle')}</DialogTitle>
            <DialogDescription>Importez un fichier Excel avec les traductions</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le fichier Excel doit contenir les colonnes : ID, Namespace, Key, Category,
                Translation_fr, Translation_en, Translation_es
              </AlertDescription>
            </Alert>

            <div>
              <Label>Fichier Excel</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSelectedFile(e.target.files?.[0] || null)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportDialog(false)
                setSelectedFile(null)
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={!selectedFile}>
              <Upload className="h-4 w-4 mr-2" />
              {t('modules.translations.import')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
