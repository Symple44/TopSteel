'use client'

import { Label } from '@erp/ui'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea,
} from '@erp/ui/primitives'
import { AlertCircle, FileJson, Upload } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ImportDialogProps {
  onImport: (data: any) => void
}

export function ImportDialog({ onImport }: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [jsonContent, setJsonContent] = useState('')
  const [error, setError] = useState('')
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonContent(content)
      setError('')
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonContent)

      // Validation basique
      if (!data.name || !data.mainTable) {
        setError('Le JSON doit contenir au minimum "name" et "mainTable"')
        return
      }

      // Appliquer les valeurs par défaut si nécessaire
      const importedData = {
        name: data.name,
        description: data.description || '',
        database: data.database || 'default',
        mainTable: data.mainTable,
        isPublic: data.isPublic ?? false,
        maxRows: data.maxRows || null,
        settings: data.settings || {
          enablePagination: true,
          pageSize: 20,
          enableSorting: true,
          enableFiltering: true,
          enableExport: true,
          exportFormats: ['csv', 'excel', 'json'],
        },
        columns: data.columns || [],
        joins: data.joins || [],
        calculatedFields: data.calculatedFields || [],
        layout: data.layout || {},
      }

      onImport(importedData)
      toast({
        title: 'Import réussi',
        description: 'La configuration a été importée avec succès',
      })
      setOpen(false)
      setJsonContent('')
      setError('')
    } catch (_err) {
      setError('JSON invalide. Veuillez vérifier le format.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importer JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer une configuration Query Builder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Fichier JSON</Label>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <FileJson className="h-4 w-4 mr-2" />
                Choisir un fichier
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="text-sm text-muted-foreground">ou collez le JSON ci-dessous</span>
            </div>
          </div>

          <div>
            <Label htmlFor="json-content">Contenu JSON</Label>
            <Textarea
              id="json-content"
              value={jsonContent}
              onChange={(e) => {
                setJsonContent(e.target.value)
                setError('')
              }}
              placeholder={`{
  "name": "Mon Query Builder",
  "description": "Description",
  "database": "default",
  "mainTable": "users",
  "columns": [...]
}`}
              className="font-mono text-sm h-64"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={!jsonContent.trim()}>
              Importer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
