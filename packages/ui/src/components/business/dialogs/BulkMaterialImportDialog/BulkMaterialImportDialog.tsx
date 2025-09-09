'use client'
import { AlertCircle, CheckCircle, Download, Eye, FileText, Upload, X } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../primitives/dialog/Dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'

interface ImportColumn {
  csvColumn: string
  targetField: string
  required: boolean
  dataType: 'string' | 'number' | 'boolean'
  sampleValue?: string
}
interface ImportPreviewRow {
  [key: string]: string | number | boolean | string[]
  _rowIndex: number
  _hasErrors: boolean
  _errors: string[]
}
interface ImportResult {
  success: number
  errors: number
  warnings: number
  totalRows: number
}
interface BulkMaterialImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport?: (data: unknown[]) => Promise<ImportResult>
}
export function BulkMaterialImportDialog({
  open,
  onOpenChange,
  onImport,
}: BulkMaterialImportDialogProps) {
  const skipFirstRowId = useId()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ImportColumn[]>([])
  const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [skipFirstRow, setSkipFirstRow] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Available target fields for mapping
  const availableFields = useMemo(
    () => [
      { key: 'reference', label: 'Référence', required: true, dataType: 'string' as const },
      { key: 'name', label: 'Nom', required: true, dataType: 'string' as const },
      { key: 'description', label: 'Description', required: false, dataType: 'string' as const },
      { key: 'category', label: 'Catégorie', required: true, dataType: 'string' as const },
      { key: 'type', label: 'Type', required: true, dataType: 'string' as const },
      { key: 'grade', label: 'Nuance', required: false, dataType: 'string' as const },
      { key: 'unit', label: 'Unité', required: true, dataType: 'string' as const },
      { key: 'unitPrice', label: 'Prix unitaire', required: true, dataType: 'number' as const },
      { key: 'minStock', label: 'Stock minimum', required: true, dataType: 'number' as const },
      { key: 'maxStock', label: 'Stock maximum', required: false, dataType: 'number' as const },
      { key: 'weight', label: 'Poids', required: false, dataType: 'number' as const },
      { key: 'supplier', label: 'Fournisseur', required: false, dataType: 'string' as const },
      { key: 'location', label: 'Emplacement', required: false, dataType: 'string' as const },
      { key: 'barcode', label: 'Code-barres', required: false, dataType: 'string' as const },
      { key: 'length', label: 'Longueur (mm)', required: false, dataType: 'number' as const },
      { key: 'width', label: 'Largeur (mm)', required: false, dataType: 'number' as const },
      { key: 'height', label: 'Hauteur (mm)', required: false, dataType: 'number' as const },
      { key: 'diameter', label: 'Diamètre (mm)', required: false, dataType: 'number' as const },
      { key: 'thickness', label: 'Épaisseur (mm)', required: false, dataType: 'number' as const },
      {
        key: 'tensileStrength',
        label: 'Résistance traction (MPa)',
        required: false,
        dataType: 'number' as const,
      },
      {
        key: 'yieldStrength',
        label: 'Limite élasticité (MPa)',
        required: false,
        dataType: 'number' as const,
      },
      { key: 'elongation', label: 'Allongement (%)', required: false, dataType: 'number' as const },
      { key: 'hardness', label: 'Dureté (HB)', required: false, dataType: 'number' as const },
      {
        key: 'corrosionResistance',
        label: 'Résistance corrosion',
        required: false,
        dataType: 'string' as const,
      },
      { key: 'isActive', label: 'Actif', required: false, dataType: 'boolean' as const },
      {
        key: 'requiresInspection',
        label: 'Contrôle qualité',
        required: false,
        dataType: 'boolean' as const,
      },
      { key: 'hazardous', label: 'Dangereux', required: false, dataType: 'boolean' as const },
      { key: 'notes', label: 'Notes', required: false, dataType: 'string' as const },
    ],
    []
  )
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return
    setError(null)
    setFile(selectedFile)
    // Parse CSV/Excel file
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter((line) => line.trim())
        if (lines.length === 0) {
          setError('Le fichier est vide')
          return
        }
        const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
        const rows = lines.slice(skipFirstRow ? 1 : 0).map((line, index) => {
          const values = line.split(',').map((v) => v.trim().replace(/"/g, ''))
          const row: any = { _rowIndex: index }
          headers.forEach((header, i) => {
            row[header] = values[i] || ''
          })
          return row
        })
        setCsvHeaders(headers)
        setCsvData(rows)
        // Initialize column mapping with smart suggestions
        const initialMapping: ImportColumn[] = headers.map((header) => {
          const lowerHeader = header.toLowerCase()
          const suggestedField = availableFields.find(
            (field) =>
              lowerHeader.includes(field.key.toLowerCase()) ||
              field.label.toLowerCase().includes(lowerHeader) ||
              (lowerHeader.includes('ref') && field.key === 'reference') ||
              (lowerHeader.includes('nom') && field.key === 'name') ||
              (lowerHeader.includes('prix') && field.key === 'unitPrice')
          )
          return {
            csvColumn: header,
            targetField: suggestedField?.key || '',
            required: suggestedField?.required || false,
            dataType: suggestedField?.dataType || 'string',
            sampleValue: rows[0]?.[header] || '',
          }
        })
        setColumnMapping(initialMapping)
        setStep('mapping')
      } catch (_err) {
        setError('Erreur lors de la lecture du fichier')
      }
    }
    reader.readAsText(selectedFile)
  }
  const handleMappingChange = (csvColumn: string, targetField: string) => {
    const field = availableFields.find((f) => f.key === targetField)
    setColumnMapping((prev) =>
      prev.map((col) =>
        col.csvColumn === csvColumn
          ? {
              ...col,
              targetField,
              required: field?.required || false,
              dataType: field?.dataType || 'string',
            }
          : col
      )
    )
  }
  const validateMapping = () => {
    const mappedFields = columnMapping
      .filter((col) => col.targetField)
      .map((col) => col.targetField)
    const requiredFields = availableFields
      .filter((field) => field.required)
      .map((field) => field.key)
    const missingRequired = requiredFields.filter((field) => !mappedFields.includes(field))
    if (missingRequired.length > 0) {
      setError(`Champs obligatoires manquants: ${missingRequired.join(', ')}`)
      return false
    }
    // Check for duplicate mappings
    const duplicates = mappedFields.filter((field, index) => mappedFields.indexOf(field) !== index)
    if (duplicates.length > 0) {
      setError(`Champs mappés plusieurs fois: ${duplicates.join(', ')}`)
      return false
    }
    return true
  }
  const generatePreview = () => {
    if (!validateMapping()) return
    const preview: ImportPreviewRow[] = csvData.slice(0, 10).map((row, index) => {
      const previewRow: ImportPreviewRow = {
        _rowIndex: index,
        _hasErrors: false,
        _errors: [],
      }
      columnMapping.forEach((col) => {
        if (!col.targetField) return
        const value = row[col.csvColumn]
        let processedValue = value
        // Type conversion and validation
        if (col.dataType === 'number' && value) {
          const num = parseFloat(value)
          if (Number.isNaN(num)) {
            previewRow._errors.push(`${col.targetField}: "${value}" n'est pas un nombre valide`)
            previewRow._hasErrors = true
          } else {
            processedValue = num
          }
        } else if (col.dataType === 'boolean' && value) {
          const lowerValue = value.toLowerCase()
          if (['true', '1', 'oui', 'yes'].includes(lowerValue)) {
            processedValue = true
          } else if (['false', '0', 'non', 'no'].includes(lowerValue)) {
            processedValue = false
          } else {
            previewRow._errors.push(`${col.targetField}: "${value}" n'est pas un booléen valide`)
            previewRow._hasErrors = true
          }
        }
        // Required field validation
        if (col.required && (!value || value.trim() === '')) {
          previewRow._errors.push(`${col.targetField} est obligatoire`)
          previewRow._hasErrors = true
        }
        previewRow[col.targetField] = processedValue
      })
      return previewRow
    })
    setPreviewData(preview)
    setStep('preview')
  }
  const handleImport = async () => {
    setLoading(true)
    setError(null)
    try {
      // Process all data
      const processedData = csvData.map((row) => {
        const item: any = {}
        columnMapping.forEach((col) => {
          if (!col.targetField) return
          let value = row[col.csvColumn]
          if (col.dataType === 'number' && value) {
            value = parseFloat(value)
          } else if (col.dataType === 'boolean' && value) {
            const lowerValue = value.toLowerCase()
            value = ['true', '1', 'oui', 'yes'].includes(lowerValue)
          }
          item[col.targetField] = value
        })
        return item
      })
      const result = await onImport?.(processedData)
      setImportResult(
        result || {
          success: processedData.length,
          errors: 0,
          warnings: 0,
          totalRows: processedData.length,
        }
      )
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'importation")
    } finally {
      setLoading(false)
    }
  }
  const handleClose = () => {
    if (!loading) {
      setStep('upload')
      setFile(null)
      setCsvData([])
      setCsvHeaders([])
      setColumnMapping([])
      setPreviewData([])
      setImportResult(null)
      setError(null)
      onOpenChange(false)
    }
  }
  const downloadTemplate = () => {
    const headers = availableFields.map((field) => field.label).join(',')
    const sampleData = [
      'ACR-S235-001,Barre ronde acier S235,Barre en acier de construction,acier,barre,S235JR,kg,1.25,50,1000,7.85,ArcelorMittal,A-1-01,,1000,20,,25,2.5,360,235,26,120,faible,true,false,false,Notes sur le matériau',
    ]
    const csvContent = [headers, ...sampleData].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modele_import_materiaux.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import en masse de matériaux
          </DialogTitle>
        </DialogHeader>
        {/* Step indicator */}
        <div className="flex items-center justify-center space-x-4 py-4 border-b">
          <div
            className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600 font-medium' : step === 'mapping' || step === 'preview' || step === 'result' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'upload' ? 'bg-blue-600 text-white' : step === 'mapping' || step === 'preview' || step === 'result' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            >
              1
            </div>
            Fichier
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div
            className={`flex items-center gap-2 ${step === 'mapping' ? 'text-blue-600 font-medium' : step === 'preview' || step === 'result' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'mapping' ? 'bg-blue-600 text-white' : step === 'preview' || step === 'result' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            >
              2
            </div>
            Mapping
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div
            className={`flex items-center gap-2 ${step === 'preview' ? 'text-blue-600 font-medium' : step === 'result' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'preview' ? 'bg-blue-600 text-white' : step === 'result' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            >
              3
            </div>
            Aperçu
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div
            className={`flex items-center gap-2 ${step === 'result' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'result' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              4
            </div>
            Résultat
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        {/* Upload step */}
        {step === 'upload' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8">
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Sélectionnez un fichier à importer</h3>
              <p className="text-gray-500 mb-4">Formats supportés: CSV, Excel (.xlsx)</p>
              <Button type="button" onClick={() => fileInputRef.current?.click()} className="mb-4">
                <FileText className="w-4 h-4 mr-2" />
                Choisir un fichier
              </Button>
              <div className="text-sm text-gray-500">ou</div>
              <Button type="button" variant="outline" onClick={downloadTemplate} className="mt-2">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le modèle CSV
              </Button>
            </div>
            {file && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id={skipFirstRowId}
                    checked={skipFirstRow}
                    onCheckedChange={(checked) => setSkipFirstRow(!!checked)}
                  />
                  <Label htmlFor={skipFirstRowId} className="text-sm">
                    Ignorer la première ligne (en-têtes)
                  </Label>
                </div>
                {csvData.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {csvData.length} lignes détectées, {csvHeaders.length} colonnes
                  </div>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
        {/* Mapping step */}
        {step === 'mapping' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Associez les colonnes de votre fichier aux champs du système. Les champs marqués d'un
              * sont obligatoires.
            </div>
            <div className="grid gap-4">
              {columnMapping.map((col, _index) => (
                <div key={col.csvColumn} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{col.csvColumn}</div>
                    <div className="text-xs text-gray-500 truncate">
                      Exemple: {col.sampleValue || 'Vide'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={col.targetField}
                      onValueChange={(value) => handleMappingChange(col.csvColumn, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un champ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ne pas importer</SelectItem>
                        {availableFields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label} {field.required && '*'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    {col.targetField && (
                      <Badge variant={col.required ? 'default' : 'outline'} className="text-xs">
                        {col.dataType}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Preview step */}
        {step === 'preview' && (
          <div className="flex-1 overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Aperçu des 10 premières lignes</div>
              <div className="text-sm">
                {previewData.filter((row) => row._hasErrors).length > 0 && (
                  <Badge variant="destructive" className="mr-2">
                    {previewData.filter((row) => row._hasErrors).length} erreur(s)
                  </Badge>
                )}
                <Badge variant="outline">{csvData.length} lignes au total</Badge>
              </div>
            </div>
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    {columnMapping
                      .filter((col) => col.targetField)
                      .map((col) => (
                        <th key={col.targetField} className="px-3 py-2 text-left">
                          {availableFields.find((f) => f.key === col.targetField)?.label}
                          {col.required && <span className="text-red-500 ml-1">*</span>}
                        </th>
                      ))}
                    <th className="px-3 py-2 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row) => (
                    <tr
                      key={`row-${row._rowIndex}`}
                      className={row._hasErrors ? 'bg-red-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-3 py-2 text-gray-500">{row._rowIndex + 1}</td>
                      {columnMapping
                        .filter((col) => col.targetField)
                        .map((col) => (
                          <td key={col.targetField} className="px-3 py-2">
                            {String(row[col.targetField] || '')}
                          </td>
                        ))}
                      <td className="px-3 py-2">
                        {row._hasErrors ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <X className="w-4 h-4" />
                            <span className="text-xs">{row._errors.length} erreur(s)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">OK</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.some((row) => row._hasErrors) && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-amber-800">Erreurs détectées</span>
                </div>
                <div className="text-sm text-amber-700 max-h-32 overflow-y-auto">
                  {previewData
                    .filter((row) => row._hasErrors)
                    .map((row) => (
                      <div key={`error-${row._rowIndex}`} className="mb-1">
                        Ligne {row._rowIndex + 1}: {row._errors.join(', ')}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Result step */}
        {step === 'result' && importResult && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">Import terminé</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                  <div className="text-sm text-green-700">Réussis</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                  <div className="text-sm text-red-700">Erreurs</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{importResult.warnings}</div>
                  <div className="text-sm text-amber-700">Avertissements</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{importResult.totalRows}</div>
                  <div className="text-sm text-gray-700">Total</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {step !== 'upload' && step !== 'result' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (step === 'mapping') setStep('upload')
                  else if (step === 'preview') setStep('mapping')
                }}
                disabled={loading}
              >
                Précédent
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {step === 'result' ? 'Fermer' : 'Annuler'}
            </Button>
            {step === 'upload' && csvData.length > 0 && (
              <Button type="button" onClick={() => setStep('mapping')}>
                Continuer
              </Button>
            )}
            {step === 'mapping' && (
              <Button type="button" onClick={generatePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Aperçu
              </Button>
            )}
            {step === 'preview' && (
              <Button
                type="button"
                onClick={handleImport}
                disabled={loading || previewData.some((row) => row._hasErrors)}
              >
                {loading ? 'Import en cours...' : 'Importer'}
              </Button>
            )}
            {step === 'result' && (
              <Button
                type="button"
                onClick={() => {
                  setStep('upload')
                  setFile(null)
                  setCsvData([])
                  setCsvHeaders([])
                  setColumnMapping([])
                  setPreviewData([])
                  setImportResult(null)
                }}
              >
                Nouvel import
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
