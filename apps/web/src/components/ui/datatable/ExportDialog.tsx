'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@erp/ui'
import { Button, Checkbox, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Label, Separator } from '@erp/ui'
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react'
import { ColumnConfig } from './types'
import { ExportUtils } from './export-utils'

interface ExportDialogProps<T = any> {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: T[]
  columns: ColumnConfig<T>[]
  filename?: string
}

interface ExportSettings {
  format: 'xlsx' | 'csv' | 'pdf'
  filename: string
  includeHeaders: boolean
  selectedOnly: boolean
  visibleColumnsOnly: boolean
  includeStyles: boolean
  freezeHeader: boolean
  autoFilter: boolean
  conditionalFormatting: boolean
  includeStatistics: boolean
  dateRange?: {
    from?: Date
    to?: Date
  }
  selectedColumns: string[]
}

export function ExportDialog<T>({ 
  open, 
  onOpenChange, 
  data, 
  columns, 
  filename = 'export' 
}: ExportDialogProps<T>) {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'xlsx',
    filename: filename,
    includeHeaders: true,
    selectedOnly: false,
    visibleColumnsOnly: true,
    includeStyles: true,
    freezeHeader: true,
    autoFilter: true,
    conditionalFormatting: true,
    includeStatistics: false,
    selectedColumns: columns.map(col => col.id)
  })
  
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Filtrer les colonnes sélectionnées
      const selectedColumns = columns.filter(col => 
        settings.selectedColumns.includes(col.id)
      )
      
      // Filtrer les données si nécessaire
      let exportData = data
      
      // Appliquer le filtre de date si configuré
      if (settings.dateRange?.from || settings.dateRange?.to) {
        exportData = data.filter(row => {
          // Logique de filtrage par date à implémenter selon vos besoins
          return true
        })
      }
      
      const exportOptions = {
        format: settings.format,
        filename: `${settings.filename}.${settings.format}`,
        includeHeaders: settings.includeHeaders,
        selectedOnly: settings.selectedOnly,
        visibleColumnsOnly: settings.visibleColumnsOnly,
        includeStyles: settings.includeStyles,
        freezeHeader: settings.freezeHeader,
        autoFilter: settings.autoFilter,
        conditionalFormatting: settings.conditionalFormatting
      }
      
      // Exporter selon le format
      if (settings.format === 'xlsx') {
        ExportUtils.exportToExcel(exportData, selectedColumns, exportOptions)
      } else if (settings.format === 'csv') {
        ExportUtils.exportToCSV(exportData, selectedColumns, exportOptions)
      } else if (settings.format === 'pdf') {
        ExportUtils.exportToPDF(exportData, selectedColumns, exportOptions)
      }
      
      onOpenChange(false)
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      alert('Erreur lors de l\'export des données')
    } finally {
      setIsExporting(false)
    }
  }

  const toggleColumnSelection = (columnId: string) => {
    setSettings(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(columnId)
        ? prev.selectedColumns.filter(id => id !== columnId)
        : [...prev.selectedColumns, columnId]
    }))
  }

  const selectAllColumns = () => {
    setSettings(prev => ({
      ...prev,
      selectedColumns: columns.map(col => col.id)
    }))
  }

  const deselectAllColumns = () => {
    setSettings(prev => ({
      ...prev,
      selectedColumns: []
    }))
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />
      case 'csv':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'pdf':
        return <File className="h-4 w-4 text-red-600" />
      default:
        return <Download className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Options d'export avancées
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Format et nom de fichier */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format d'export</Label>
                <Select 
                  value={settings.format} 
                  onValueChange={(value: 'xlsx' | 'csv' | 'pdf') => 
                    setSettings(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">
                      <div className="flex items-center gap-2">
                        {getFormatIcon('xlsx')}
                        Excel (.xlsx)
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        {getFormatIcon('csv')}
                        CSV (.csv)
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        {getFormatIcon('pdf')}
                        PDF (.pdf)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Nom du fichier</Label>
                <Input
                  value={settings.filename}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    filename: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_') 
                  }))}
                  placeholder="export"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Options de base */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Options de base</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHeaders"
                  checked={settings.includeHeaders}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, includeHeaders: !!checked }))
                  }
                />
                <Label htmlFor="includeHeaders">Inclure les en-têtes</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectedOnly"
                  checked={settings.selectedOnly}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, selectedOnly: !!checked }))
                  }
                />
                <Label htmlFor="selectedOnly">Lignes sélectionnées uniquement</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visibleColumnsOnly"
                  checked={settings.visibleColumnsOnly}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, visibleColumnsOnly: !!checked }))
                  }
                />
                <Label htmlFor="visibleColumnsOnly">Colonnes visibles uniquement</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Options Excel spécifiques */}
          {settings.format === 'xlsx' && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Options Excel</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeStyles"
                      checked={settings.includeStyles}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, includeStyles: !!checked }))
                      }
                    />
                    <Label htmlFor="includeStyles">Inclure les styles et couleurs</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="freezeHeader"
                      checked={settings.freezeHeader}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, freezeHeader: !!checked }))
                      }
                    />
                    <Label htmlFor="freezeHeader">Figer la ligne d'en-tête</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoFilter"
                      checked={settings.autoFilter}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, autoFilter: !!checked }))
                      }
                    />
                    <Label htmlFor="autoFilter">Activer l'autofilter</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="conditionalFormatting"
                      checked={settings.conditionalFormatting}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, conditionalFormatting: !!checked }))
                      }
                    />
                    <Label htmlFor="conditionalFormatting">Formatage conditionnel</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeStatistics"
                      checked={settings.includeStatistics}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, includeStatistics: !!checked }))
                      }
                    />
                    <Label htmlFor="includeStatistics">Feuille de statistiques</Label>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Sélection des colonnes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Colonnes à exporter</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllColumns}
                >
                  Tout sélectionner
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={deselectAllColumns}
                >
                  Tout désélectionner
                </Button>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
              {columns.map(column => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`column-${column.id}`}
                    checked={settings.selectedColumns.includes(column.id)}
                    onCheckedChange={() => toggleColumnSelection(column.id)}
                  />
                  <Label 
                    htmlFor={`column-${column.id}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span>{column.title}</span>
                    <span className="text-xs text-muted-foreground">({column.type})</span>
                  </Label>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {settings.selectedColumns.length} colonne(s) sélectionnée(s) sur {columns.length}
            </p>
          </div>

          {/* Résumé */}
          <div className="bg-muted/50 p-3 rounded-md">
            <h4 className="text-sm font-medium mb-2">Aperçu de l'export</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Format: {settings.format.toUpperCase()}</div>
              <div>Lignes: {data.length}</div>
              <div>Colonnes: {settings.selectedColumns.length}</div>
              <div>Fichier: {settings.filename}.{settings.format}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || settings.selectedColumns.length === 0}
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Export en cours...
              </>
            ) : (
              <>
                {getFormatIcon(settings.format)}
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}