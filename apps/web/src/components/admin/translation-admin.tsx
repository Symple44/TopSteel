'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Search,
  Download,
  Upload,
  Save,
  X,
  Edit2,
  Languages,
  Filter,
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
  filterTranslations,
  calculateTranslationStats,
  exportToExcel,
  importFromExcel,
  saveTranslation,
  bulkImportTranslations,
  determineCategory
} from '@/lib/i18n/translation-utils'
import type { TranslationEntry, TranslationFilter, TranslationStats } from '@/lib/i18n/types'

export default function TranslationAdmin() {
  const { t } = useTranslation('admin')
  const { current: currentLanguage } = useLanguage()
  
  // États
  const [entries, setEntries] = useState<TranslationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage.code)
  const [filter, setFilter] = useState<TranslationFilter>({})
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
  const filteredEntries = useMemo(() => {
    return filterTranslations(entries, filter)
  }, [entries, filter])
  
  // Obtenir les namespaces uniques
  const namespaces = useMemo(() => {
    const ns = new Set(entries.map(e => e.namespace))
    return Array.from(ns).sort()
  }, [entries])
  
  // Obtenir les catégories uniques
  const categories = useMemo(() => {
    const cats = new Set(entries.map(e => e.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [entries])
  
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
    } else {
      toast.error('Erreur lors de la sauvegarde')
    }
  }
  
  // Gérer l'export
  const handleExport = () => {
    try {
      const languages = filter.language ? [filter.language] : ['fr', 'en', 'es']
      const blob = exportToExcel(filteredEntries, languages)
      
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
      
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div>
              <Label>Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Clé ou traduction..."
                  className="pl-9"
                  value={filter.search || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter({ ...filter, search: e.target.value })}
                />
              </div>
            </div>
            
            {/* Namespace */}
            <div>
              <Label>Namespace</Label>
              <Select
                value={filter.namespace || 'all'}
                onValueChange={(value: string) => setFilter({ 
                  ...filter, 
                  namespace: value === 'all' ? undefined : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {namespaces.map(ns => (
                    <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Catégorie */}
            <div>
              <Label>Catégorie</Label>
              <Select
                value={filter.category || 'all'}
                onValueChange={(value: string) => setFilter({ 
                  ...filter, 
                  category: value === 'all' ? undefined : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Langue */}
            <div>
              <Label>Langue</Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value: string) => {
                  setSelectedLanguage(value)
                  setFilter({ ...filter, language: value })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Options supplémentaires */}
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filter.untranslated || false}
                onChange={(e) => setFilter({ ...filter, untranslated: e.target.checked })}
                className="rounded"
              />
              <span>Afficher uniquement les non traduites</span>
            </label>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter({})}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Liste des traductions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Traductions ({filteredEntries.length} résultats)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredEntries.map(entry => (
                <div
                  key={entry.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {entry.fullKey}
                        </code>
                        <Badge variant="secondary" className="text-xs">
                          {entry.namespace}
                        </Badge>
                        {entry.category && (
                          <Badge variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {entry.category}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {SUPPORTED_LANGUAGES.map(lang => {
                          const value = entry.translations[lang.code] || ''
                          const isEmpty = !value.trim()
                          
                          return (
                            <div key={lang.code} className="flex items-start gap-2">
                              <span className="text-lg mt-1">{lang.flag}</span>
                              <div className="flex-1">
                                <p className={`text-sm ${isEmpty ? 'text-muted-foreground italic' : ''}`}>
                                  {isEmpty ? '(Non traduit)' : value}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {entry.description && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {entry.description}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
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