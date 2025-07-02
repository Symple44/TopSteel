'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { File, FileText, Image, Upload, X } from 'lucide-react'
import { useCallback, useState } from 'react'

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  multiple?: boolean
  maxSize?: number // en MB
  maxFiles?: number
  className?: string
  disabled?: boolean
}

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  id: string
}

export function FileUpload({
  onUpload,
  accept = '*/*',
  multiple = false,
  maxSize = 10,
  maxFiles = 5,
  className,
  disabled = false
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (file.type.includes('pdf') || file.type.includes('document')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Le fichier est trop volumineux (max: ${maxSize}MB)`
    }
    return null
  }

  const processFiles = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    
    if (!multiple && fileArray.length > 1) {
      alert('Un seul fichier autorisé')
      return
    }

    if (files.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} fichiers autorisés`)
      return
    }

    const newFiles: FileWithProgress[] = fileArray.map(file => {
      const error = validateFile(file)
      return {
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        id: Math.random().toString(36).substr(2, 9)
      }
    })

    setFiles(prev => [...prev, ...newFiles])

    // Simuler upload avec progress
    for (const fileItem of newFiles) {
      if (fileItem.status === 'error') continue

      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'uploading' } : f
      ))

      try {
        // Simuler progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, progress } : f
          ))
        }

        await onUpload([fileItem.file])
        
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'success', progress: 100 } : f
        ))
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error' } : f
        ))
      }
    }
  }, [files, multiple, maxFiles, maxSize, onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    processFiles(e.dataTransfer.files)
  }, [processFiles, disabled])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }, [processFiles])

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragOver && "border-primary bg-primary/5",
          !isDragOver && "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Glissez vos fichiers ici ou{' '}
              <span className="text-primary underline">parcourez</span>
            </span>
          </label>
          <input
            id="file-upload"
            type="file"
            className="sr-only"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={disabled}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {accept === '*/*' ? 'Tous types de fichiers' : accept} - Max {maxSize}MB
        </p>
      </div>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              {getFileIcon(fileItem.file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileItem.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileItem.file.size)}
                </p>
                {fileItem.status === 'uploading' && (
                  <Progress value={fileItem.progress} className="mt-1" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                {fileItem.status === 'success' && (
                  <span className="text-green-500 text-sm">✓</span>
                )}
                {fileItem.status === 'error' && (
                  <span className="text-red-500 text-sm">✗</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileItem.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}