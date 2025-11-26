'use client'

import { AlertCircle, File, Upload, X } from 'lucide-react'
import * as React from 'react'
import { useCallback, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'

export interface FileUploadProps {
  /** Accepted file types (e.g., "image/*,.pdf") */
  accept?: string
  /** Allow multiple files */
  multiple?: boolean
  /** Maximum file size in bytes */
  maxSize?: number
  /** Maximum number of files */
  maxFiles?: number
  /** Callback when files are selected */
  onFilesChange: (files: File[]) => void
  /** Callback on error */
  onError?: (error: string) => void
  /** Current files (controlled) */
  files?: File[]
  /** Disabled state */
  disabled?: boolean
  /** Custom class name */
  className?: string
  /** Show preview for images */
  showPreview?: boolean
  /** Custom labels */
  labels?: {
    dropzone?: string
    dropzoneActive?: string
    browse?: string
    maxSize?: string
    maxFiles?: string
    remove?: string
    invalidType?: string
    fileTooLarge?: string
    tooManyFiles?: string
  }
}

const defaultLabels = {
  dropzone: 'Glissez vos fichiers ici ou',
  dropzoneActive: 'Déposez les fichiers ici',
  browse: 'parcourir',
  maxSize: 'Taille max',
  maxFiles: 'fichiers max',
  remove: 'Supprimer',
  invalidType: 'Type de fichier non autorisé',
  fileTooLarge: 'Fichier trop volumineux',
  tooManyFiles: 'Trop de fichiers',
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(file: File): React.ReactNode {
  if (file.type.startsWith('image/')) {
    return null // Will show preview
  }
  return <File className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
}

/**
 * FileUpload component with drag and drop support
 * Accessible with keyboard navigation
 */
export function FileUpload({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  onFilesChange,
  onError,
  files: controlledFiles,
  disabled = false,
  className,
  showPreview = true,
  labels: customLabels,
}: FileUploadProps) {
  const labels = { ...defaultLabels, ...customLabels }
  const [isDragActive, setIsDragActive] = useState(false)
  const [internalFiles, setInternalFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<Map<string, string>>(new Map())
  const inputRef = useRef<HTMLInputElement>(null)

  const files = controlledFiles ?? internalFiles

  const validateFiles = useCallback(
    (newFiles: File[]): File[] => {
      const validFiles: File[] = []
      const currentCount = files.length

      for (const file of newFiles) {
        // Check max files
        if (validFiles.length + currentCount >= maxFiles) {
          onError?.(labels.tooManyFiles)
          break
        }

        // Check file size
        if (file.size > maxSize) {
          onError?.(`${labels.fileTooLarge}: ${file.name}`)
          continue
        }

        // Check file type if accept is specified
        if (accept) {
          const acceptedTypes = accept.split(',').map((t) => t.trim())
          const isValid = acceptedTypes.some((type) => {
            if (type.startsWith('.')) {
              return file.name.toLowerCase().endsWith(type.toLowerCase())
            }
            if (type.endsWith('/*')) {
              return file.type.startsWith(type.replace('/*', '/'))
            }
            return file.type === type
          })
          if (!isValid) {
            onError?.(`${labels.invalidType}: ${file.name}`)
            continue
          }
        }

        validFiles.push(file)
      }

      return validFiles
    },
    [accept, files.length, labels, maxFiles, maxSize, onError]
  )

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)
      const validFiles = validateFiles(fileArray)

      if (validFiles.length > 0) {
        const updatedFiles = multiple ? [...files, ...validFiles] : validFiles
        if (!controlledFiles) {
          setInternalFiles(updatedFiles)
        }
        onFilesChange(updatedFiles)

        // Generate previews for images
        if (showPreview) {
          validFiles.forEach((file) => {
            if (file.type.startsWith('image/')) {
              const reader = new FileReader()
              reader.onload = (e) => {
                setPreviews((prev) => new Map(prev).set(file.name, e.target?.result as string))
              }
              reader.readAsDataURL(file)
            }
          })
        }
      }
    },
    [controlledFiles, files, multiple, onFilesChange, showPreview, validateFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragActive(false)

      if (disabled) return

      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles)
      }
    },
    [disabled, handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files
      if (selectedFiles && selectedFiles.length > 0) {
        handleFiles(selectedFiles)
      }
      // Reset input value to allow selecting the same file again
      e.target.value = ''
    },
    [handleFiles]
  )

  const handleRemove = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index)
      const removedFile = files[index]

      if (!controlledFiles) {
        setInternalFiles(newFiles)
      }
      onFilesChange(newFiles)

      // Remove preview
      if (removedFile) {
        setPreviews((prev) => {
          const next = new Map(prev)
          next.delete(removedFile.name)
          return next
        })
      }
    },
    [controlledFiles, files, onFilesChange]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        aria-label={isDragActive ? labels.dropzoneActive : labels.dropzone}
        aria-disabled={disabled}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8',
          'transition-colors cursor-pointer min-h-[200px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
          aria-hidden="true"
        />

        <Upload
          className={cn(
            'h-10 w-10 mb-4',
            isDragActive ? 'text-primary' : 'text-muted-foreground'
          )}
          aria-hidden="true"
        />

        <p className="text-sm text-center">
          {isDragActive ? (
            <span className="font-medium text-primary">{labels.dropzoneActive}</span>
          ) : (
            <>
              <span className="text-muted-foreground">{labels.dropzone} </span>
              <span className="font-medium text-primary underline">{labels.browse}</span>
            </>
          )}
        </p>

        <p className="text-xs text-muted-foreground mt-2">
          {labels.maxSize}: {formatFileSize(maxSize)}
          {multiple && ` | ${maxFiles} ${labels.maxFiles}`}
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2" role="list" aria-label="Fichiers sélectionnés">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
            >
              {/* Preview or icon */}
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded bg-background">
                {showPreview && previews.has(file.name) ? (
                  <img
                    src={previews.get(file.name)}
                    alt={file.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  getFileIcon(file)
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(index)
                }}
                disabled={disabled}
                className={cn(
                  'p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'min-h-[44px] min-w-[44px] flex items-center justify-center'
                )}
                aria-label={`${labels.remove} ${file.name}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FileUpload
