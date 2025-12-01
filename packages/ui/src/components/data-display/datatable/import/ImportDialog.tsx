'use client'

/**
 * ImportDialog Component
 * Provides a complete UI for importing CSV/Excel files with column mapping and validation
 */

import * as React from 'react'
import { Upload, X, CheckCircle, AlertCircle, Info, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../primitives/dialog/Dialog'
import { Button } from '../../../primitives/button/Button'
import { Progress } from '../../../primitives/progress/Progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
import { cn } from '../../../../lib/utils'
import { useImport } from './useImport'
import type { ImportDialogProps, ColumnMapping, ImportResult } from './types'

export function ImportDialog<T = Record<string, unknown>>({
  open,
  onOpenChange,
  columns,
  validationSchema,
  onImport,
  onCancel,
  allowedFormats = ['csv', 'xlsx', 'xls'],
  maxFileSize = 10 * 1024 * 1024,
  defaultConfig,
  showAdvancedOptions = false,
  title = 'Import Data',
  description,
}: ImportDialogProps<T>) {
  const {
    state,
    progress,
    file,
    preview,
    columnMapping,
    validationResult,
    isImporting,
    error,
    selectFile,
    updateColumnMapping,
    executeImport,
    reset,
  } = useImport<T>({
    columns,
    validationSchema,
    allowedFormats,
    maxFileSize,
    defaultConfig,
    autoMapColumns: true,
  })

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  // Handle file selection
  const handleFileSelect = React.useCallback(
    (selectedFile: File) => {
      selectFile(selectedFile)
    },
    [selectFile]
  )

  // Handle file input change
  const handleFileInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0]
      if (selectedFile) {
        handleFileSelect(selectedFile)
      }
    },
    [handleFileSelect]
  )

  // Handle drag and drop
  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = React.useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)

      const droppedFile = event.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect]
  )

  // Handle import
  const handleImport = React.useCallback(async () => {
    try {
      const result = await executeImport()
      await onImport(result as ImportResult<T>)
      onOpenChange?.(false)
      reset()
    } catch (err) {
      console.error('Import failed:', err)
    }
  }, [executeImport, onImport, onOpenChange, reset])

  // Handle cancel
  const handleCancel = React.useCallback(() => {
    reset()
    onCancel?.()
    onOpenChange?.(false)
  }, [reset, onCancel, onOpenChange])

  // Get column mapping options
  const getMappingOptions = React.useCallback(
    (sourceColumn: string) => {
      return columns.map(col => ({
        value: col.key,
        label: col.title,
      }))
    },
    [columns]
  )

  // Get selected mapping
  const getSelectedMapping = React.useCallback(
    (sourceColumn: string): string | undefined => {
      const mapping = columnMapping.find(m => m.sourceColumn === sourceColumn)
      return mapping?.targetColumn
    },
    [columnMapping]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* File Upload Section */}
          {state === 'idle' && (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                error && 'border-destructive'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload a file</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={isImporting}
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={allowedFormats.map(f => `.${f}`).join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-4">
                Supported formats: {allowedFormats.join(', ').toUpperCase()} (max{' '}
                {(maxFileSize / 1024 / 1024).toFixed(0)}MB)
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive mb-1">Import Error</h4>
                <p className="text-sm text-destructive/90">{error}</p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.message}</span>
                <span className="font-medium">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
          )}

          {/* File Info */}
          {file && state !== 'idle' && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  disabled={isImporting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Column Mapping Section */}
          {preview.length > 0 && state === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Map Columns</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Match columns from your file to the corresponding fields in the table
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.keys(preview[0] || {}).map(sourceColumn => (
                  <div
                    key={sourceColumn}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{sourceColumn}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Sample: {String(preview[0]?.[sourceColumn] || '—')}
                      </p>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={getSelectedMapping(sourceColumn)}
                        onValueChange={value => updateColumnMapping(sourceColumn, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getMappingOptions(sourceColumn).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Section */}
          {preview.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Data Preview</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {Object.keys(preview[0] || {}).map(header => (
                          <th
                            key={header}
                            className="px-4 py-2 text-left font-medium border-b"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, index) => (
                        <tr key={index} className="border-b last:border-0">
                          {Object.values(row).map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2 border-r last:border-0">
                              {String(cell || '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing first {preview.length} rows of {progress.totalRows} total
              </p>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-4">
              <h3 className="font-medium">Validation Results</h3>

              {/* Summary */}
              <div
                className={cn(
                  'rounded-lg p-4 flex items-start gap-3',
                  validationResult.valid
                    ? 'bg-success/10 border border-success'
                    : 'bg-destructive/10 border border-destructive'
                )}
              >
                {validationResult.valid ? (
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4
                    className={cn(
                      'font-medium mb-1',
                      validationResult.valid ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {validationResult.valid
                      ? 'All data is valid'
                      : `${validationResult.invalidRows} validation errors found`}
                  </h4>
                  <p
                    className={cn(
                      'text-sm',
                      validationResult.valid ? 'text-success/90' : 'text-destructive/90'
                    )}
                  >
                    {validationResult.validRows} of {validationResult.totalRows} rows passed
                    validation
                  </p>
                </div>
              </div>

              {/* Errors */}
              {validationResult.invalidRows > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {Array.from(validationResult.errors.entries()).slice(0, 10).map(([rowIndex, rowErrors]) => (
                    <div key={rowIndex} className="text-sm p-2 rounded bg-destructive/5">
                      <p className="font-medium text-destructive">Row {rowIndex + 1}:</p>
                      <ul className="list-disc list-inside text-destructive/80 ml-2">
                        {rowErrors.errors.map((error, i) => (
                          <li key={i}>
                            {error.field}: {error.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {validationResult.errors.size > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      ... and {validationResult.errors.size - 10} more errors
                    </p>
                  )}
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="rounded-lg bg-warning/10 border border-warning p-4">
                  <p className="font-medium text-warning mb-2">
                    {validationResult.warnings.length} Warnings
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationResult.warnings.slice(0, 5).map((warning, i) => (
                      <p key={i} className="text-sm text-warning/90">
                        Row {warning.row + 1}, {warning.field}: {warning.message}
                      </p>
                    ))}
                    {validationResult.warnings.length > 5 && (
                      <p className="text-xs text-warning/70">
                        ... and {validationResult.warnings.length - 5} more warnings
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              isImporting ||
              !file ||
              state === 'idle' ||
              state === 'error' ||
              columnMapping.length === 0 ||
              Boolean(validationResult && !validationResult.valid)
            }
            loading={isImporting}
          >
            Import Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportDialog
