'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { TranslationDataTable } from './TranslationDataTable'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Separator,
  Textarea,
  Progress,
  Alert,
  AlertDescription
} from '@erp/ui'
import {
  Download,
  Upload,
  Save,
  X,
  Edit2,
  Languages,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Globe,
  Hash,
  Tag,
  Clock,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/hooks'
import { useLanguage } from '@/lib/i18n'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/types'
import {
  loadTranslationsWithOverrides,
  calculateTranslationStats,
  exportToExcel,
  importFromExcel,
  saveTranslation,
  bulkImportTranslations,
  determineCategory
} from '@/lib/i18n/translation-utils'
import type { TranslationEntry, TranslationStats } from '@/lib/i18n/types'

export default function TranslationAdmin() {
  const { t } = useTranslation('admin')
  const { current: currentLanguage } = useLanguage()
  
  // États
  const [entries, setEntries] = useState<TranslationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage.code)
  const [stats, setStats] = useState<TranslationStats | null>(null)
  const [editingEntry, setEditingEntry] = useState<TranslationEntry | null>(null)
  const [importDialog, setImportDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Charger les traductions au montage
  useEffect(() => {
    loadTranslations()
  }, [])
  
  const loadTranslations = async () => {
    setLoading(true)
    try {
      const loadedEntries = await loadTranslationsWithOverrides()
      setEntries(loadedEntries)
      setStats(calculateTranslationStats(loadedEntries))
    } catch (error) {
      toast.error('Erreur lors du chargement des traductions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  // Filtrer les entrées
  
  // Gérer l'édition
  const handleEdit = (entry: TranslationEntry) => {
    setEditingEntry({ ...entry })
  }
  
  const handleSave = async () => {
    if (!editingEntry) return
    
    const success = await saveTranslation(editingEntry)
    if (success) {
      toast.success('Traduction sauvegardée')
      
      // Mettre à jour la liste
      setEntries(prev => prev.map(e => 
        e.id === editingEntry.id ? editingEntry : e
      ))
      
      // Recalculer les stats
      const updatedEntries = entries.map(e => 
        e.id === editingEntry.id ? editingEntry : e
      )
      setStats(calculateTranslationStats(updatedEntries))
      
      setEditingEntry(null)
      
      // Déclencher un événement pour recharger les traductions
      window.dispatchEvent(new Event('translation-updated'))
    } else {
      toast.error('Erreur lors de la sauvegarde')
    }
  }
  
  // Gérer l'édition inline depuis le DataTable
  const handleCellEdit = async (value: any, row: TranslationEntry) => {
    try {
      const success = await saveTranslation(row)
      if (success) {
        toast.success('Traduction mise à jour')
        
        // Mettre à jour la liste locale
        setEntries(prev => prev.map(e => 
          e.id === row.id ? row : e
        ))
        
        // Recalculer les stats
        const updatedEntries = entries.map(e => 
          e.id === row.id ? row : e
        )
        setStats(calculateTranslationStats(updatedEntries))
        
        // Déclencher un événement pour recharger les traductions
        window.dispatchEvent(new Event('translation-updated'))
      } else {
        toast.error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
      console.error(error)
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
      toast.success('Export réussi')
    } catch (error) {
      toast.error('Erreur lors de l\'export')
      console.error(error)
    }
  }

  // Nouveaux handlers pour les fonctionnalités avancées du DataTable
  const handleCreateTranslation = () => {
    toast.info('Fonctionnalité de création en développement')
  }

  const handleDeleteTranslations = (translations: TranslationEntry[]) => {
    if (translations.length === 0) return
    
    const translationKeys = translations.map(t => t.fullKey).join(', ')
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer ${translations.length} traduction(s) ?\n\n${translationKeys}`)
    
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
    } catch (error) {
      toast.error('Erreur lors de l\'export')
      console.error(error)
    }
  }

  const handleImportTranslations = () => {
    setImportDialog(true)
  }

  const handleDuplicateTranslation = (translation: TranslationEntry) => {
    const duplicatedTranslation = {
      ...translation,
      id: crypto.randomUUID(),
      fullKey: translation.fullKey + '_copy',
      key: translation.key + '_copy',
      isModified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setEntries(prev => [...prev, duplicatedTranslation])
    toast.success(`Traduction "${translation.fullKey}" dupliquée`)
  }
  
  // Gérer l'import
  const handleImport = async () => {
    if (!selectedFile) return
    
    try {
      // Parser le fichier Excel pour extraire les données
      const parseResult = await importFromExcel(selectedFile, entries)
      
      if (!parseResult.success) {
        parseResult.errors.forEach(e => toast.error(e))
        return
      }
      
      // Créer les entrées de traduction à partir des données parsées
      // Note: importFromExcel modifie les entrées existantes, donc on utilise entries mis à jour
      const response = await bulkImportTranslations(entries)
      
      if (response.success) {
        toast.success(response.message || `Import réussi: ${response.stats?.imported || 0} nouvelles, ${response.stats?.updated || 0} mises à jour`)
        
        if (parseResult.warnings.length > 0) {
          parseResult.warnings.forEach(w => toast.warning(w))
        }
        
        // Recharger les traductions depuis l'API
        await loadTranslations()
        setImportDialog(false)
        setSelectedFile(null)
      } else {
        toast.error(response.message || 'Erreur lors de l\'import')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'import')
      console.error(error)
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
          <Button
            variant="outline"
            onClick={() => setImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>
      
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total des clés</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Hash className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
          
          {SUPPORTED_LANGUAGES.map(lang => (
            <Card key={lang.code}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{lang.flag}</span>
                    <p className="font-medium">{lang.name}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stats.percentageComplete[lang.code]}%
                  </span>
                </div>
                <Progress value={stats.percentageComplete[lang.code]} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{stats.translated[lang.code]} traduites</span>
                  <span>{stats.untranslated[lang.code]} manquantes</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Actions globales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Actions Rapides
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
          <CardTitle className="text-lg">
            Traductions ({entries.length} total)
          </CardTitle>
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
      
      {/* Dialog d'édition */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Éditer la traduction</DialogTitle>
            <DialogDescription>
              Modifiez les traductions pour chaque langue
            </DialogDescription>
          </DialogHeader>
          
          {editingEntry && (
            <div className="space-y-4">
              <div>
                <Label>Clé</Label>
                <code className="text-sm font-mono bg-muted px-3 py-2 rounded block">
                  {editingEntry.fullKey}
                </code>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <div key={lang.code}>
                    <Label className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </Label>
                    <Textarea
                      value={editingEntry.translations[lang.code] || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingEntry({
                        ...editingEntry,
                        translations: {
                          ...editingEntry.translations,
                          [lang.code]: e.target.value
                        }
                      })}
                      placeholder={`Traduction en ${lang.nativeName}...`}
                      rows={3}
                    />
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <Input
                    value={editingEntry.category || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEntry({
                      ...editingEntry,
                      category: e.target.value
                    })}
                    placeholder="Catégorie..."
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingEntry.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEntry({
                      ...editingEntry,
                      description: e.target.value
                    })}
                    placeholder="Description..."
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog d'import */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des traductions</DialogTitle>
            <DialogDescription>
              Importez un fichier Excel avec les traductions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le fichier Excel doit contenir les colonnes : ID, Namespace, Key, Category, Translation_fr, Translation_en, Translation_es
              </AlertDescription>
            </Alert>
            
            <div>
              <Label>Fichier Excel</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setImportDialog(false)
              setSelectedFile(null)
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!selectedFile}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}