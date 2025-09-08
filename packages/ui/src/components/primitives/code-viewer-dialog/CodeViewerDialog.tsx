'use client'

import { CheckCircle, Copy, FileText, Loader2, X } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../data-display/badge'
import { Button } from '../button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../dialog'

interface FileDetails {
  name: string
  content: string
  size: number
  lastModified: string
  path: string
  type?: string
  language?: string
}

export interface CodeViewerDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  fileDetails?: FileDetails
  loadingMessage?: string
  onLoadDetails?: () => Promise<FileDetails>
  // Translation props with fallbacks
  translations?: {
    title?: string
    loading?: string
    loadError?: string
    error?: string
    retry?: string
    linesSelected?: string
    copied?: string
    copySelection?: string
    clear?: string
    copyAll?: string
    code?: string
    clickLineNumbers?: string
    lines?: string
    lineTooltip?: string
  }
}

export function CodeViewerDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  fileDetails,
  loadingMessage,
  onLoadDetails,
  translations = {},
}: CodeViewerDialogProps) {
  // Default translations with fallbacks
  const t = (key: string, params?: Record<string, string | number>) => {
    const defaultTranslations = {
      title: 'Code Viewer',
      loading: 'Loading...',
      loadError: 'Failed to load file',
      error: 'Error',
      retry: 'Retry',
      linesSelected: 'lines selected',
      copied: 'Copied!',
      copySelection: 'Copy Selection',
      clear: 'Clear',
      copyAll: 'Copy All',
      code: 'Code',
      clickLineNumbers: 'Click line numbers to select',
      lines: 'lines',
      lineTooltip: 'Line {{number}}',
    }

    let translation =
      translations[key as keyof typeof translations] ||
      defaultTranslations[key as keyof typeof defaultTranslations] ||
      key

    // Simple parameter replacement
    if (params && typeof translation === 'string') {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(value))
      })
    }

    return translation
  }

  const [details, setDetails] = useState<FileDetails | null>(fileDetails || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set())
  const [lastSelectedLine, setLastSelectedLine] = useState<number | null>(null)

  const loadDetails = useCallback(async () => {
    if (!onLoadDetails) return

    setLoading(true)
    setError(null)

    try {
      const data = await onLoadDetails()
      setDetails(data)
    } catch (_err) {
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [onLoadDetails, t])

  const handleCopyToClipboard = async () => {
    if (!details?.content) return

    try {
      await navigator.clipboard.writeText(details.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_err) {}
  }

  const handleCopySelectedLines = async () => {
    if (!details?.content || selectedLines.size === 0) return

    try {
      const lines = details.content.split('\n')
      const selectedLinesArray = Array.from(selectedLines).sort((a, b) => a - b)
      const selectedContent = selectedLinesArray
        .map((lineNumber) => lines[lineNumber - 1])
        .join('\n')

      await navigator.clipboard.writeText(selectedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_err) {}
  }

  const handleLineClick = (lineNumber: number, event: React.MouseEvent) => {
    event.preventDefault()

    if (event.shiftKey && lastSelectedLine !== null) {
      // Sélection de plage avec Shift
      const start = Math.min(lastSelectedLine, lineNumber)
      const end = Math.max(lastSelectedLine, lineNumber)
      const newSelection = new Set(selectedLines)

      for (let i = start; i <= end; i++) {
        newSelection.add(i)
      }

      setSelectedLines(newSelection)
    } else if (event.ctrlKey || event.metaKey) {
      // Sélection multiple avec Ctrl/Cmd
      const newSelection = new Set(selectedLines)
      if (newSelection.has(lineNumber)) {
        newSelection.delete(lineNumber)
      } else {
        newSelection.add(lineNumber)
      }
      setSelectedLines(newSelection)
      setLastSelectedLine(lineNumber)
    } else {
      // Sélection simple
      setSelectedLines(new Set([lineNumber]))
      setLastSelectedLine(lineNumber)
    }
  }

  const clearSelection = useCallback(() => {
    setSelectedLines(new Set())
    setLastSelectedLine(null)
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
  }

  // Charger les détails quand le dialogue s'ouvre
  useEffect(() => {
    if (isOpen && onLoadDetails && !fileDetails) {
      loadDetails()
    } else if (isOpen && fileDetails) {
      setDetails(fileDetails)
    }

    // Reset de la sélection quand le dialogue s'ouvre/ferme
    if (!isOpen) {
      clearSelection()
    }
  }, [isOpen, onLoadDetails, fileDetails, clearSelection, loadDetails])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <DialogTitle className="text-lg font-semibold">{title || t('title')}</DialogTitle>
              {subtitle && (
                <DialogDescription className="text-sm text-muted-foreground">
                  {subtitle}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-muted-foreground">{loadingMessage || t('loading')}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p className="text-red-600 font-medium mb-2">{t('error')}</p>
                <p className="text-muted-foreground">{error}</p>
                <Button
                  type="button"
                  onClick={loadDetails}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  {t('retry')}
                </Button>
              </div>
            </div>
          )}

          {details && !loading && !error && (
            <>
              {/* Informations compactes */}
              <div className="flex-shrink-0 border-b border-border pb-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="font-medium">{details.name}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{formatFileSize(details.size)}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{new Date(details.lastModified).toLocaleDateString()}</span>
                    {selectedLines.size > 0 && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="font-medium text-blue-600">
                          {selectedLines.size} {t('linesSelected')}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedLines.size > 0 && (
                      <>
                        <Button
                          type="button"
                          onClick={handleCopySelectedLines}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          {copied ? (
                            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copied ? t('copied') : t('copySelection')}</span>
                        </Button>
                        <Button
                          type="button"
                          onClick={clearSelection}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>{t('clear')}</span>
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      onClick={handleCopyToClipboard}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      {copied && selectedLines.size === 0 ? (
                        <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copied && selectedLines.size === 0 ? t('copied') : t('copyAll')}</span>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {details.language || t('code')}
                    </Badge>
                    {details.type && (
                      <Badge variant="outline" className="text-xs">
                        {details.type}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">💡 {t('clickLineNumbers')}</div>
                </div>
              </div>

              {/* Contenu du code */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full border border-border rounded-lg bg-card">
                  {/* Header du code */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground">
                      {details.path}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {details.content.split('\n').length} {t('lines')}
                    </span>
                  </div>

                  {/* Zone de code avec scrollbar forcée */}
                  <div
                    className="h-full max-h-[60vh] overflow-auto code-viewer-scroll"
                    style={{
                      height: 'calc(100% - 41px)', // Soustraire la hauteur du header
                      maxHeight: '60vh',
                    }}
                  >
                    <div className="flex">
                      {/* Numérotation des lignes */}
                      <div className="flex-shrink-0 bg-muted/30 border-r border-border sticky left-0 z-10">
                        <div className="px-3 py-4">
                          {details.content.split('\n').map((_, index) => {
                            const lineNumber = index + 1
                            const isSelected = selectedLines.has(lineNumber)

                            return (
                              <button
                                type="button"
                                key={`line-${lineNumber}`}
                                className={`text-right text-sm font-mono select-none cursor-pointer transition-colors hover:bg-muted/50 px-1 rounded w-full ${
                                  isSelected
                                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                                style={{
                                  lineHeight: '1.5rem',
                                  height: '1.5rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                }}
                                onClick={(e) => handleLineClick(lineNumber, e)}
                                onKeyDown={(e) =>
                                  (e.key === 'Enter' || e.key === ' ') &&
                                  handleLineClick(lineNumber, e as unknown)
                                }
                                tabIndex={0}
                                aria-label={`Toggle selection for line ${lineNumber}`}
                                title={t('lineTooltip', { number: lineNumber })}
                              >
                                {lineNumber.toString().padStart(3, ' ')}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Contenu du code */}
                      <div className="flex-1 bg-background/50">
                        <div className="px-4 py-4">
                          {details.content.split('\n').map((line, index) => {
                            const lineNumber = index + 1
                            const isSelected = selectedLines.has(lineNumber)

                            return (
                              <div
                                key={`line-${lineNumber}`}
                                className={`text-sm font-mono transition-colors ${
                                  isSelected
                                    ? 'bg-blue-500/10 text-foreground border-l-2 border-blue-500 pl-2 -ml-2'
                                    : 'text-foreground'
                                }`}
                                style={{
                                  lineHeight: '1.5rem',
                                  height: '1.5rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  whiteSpace: 'pre',
                                }}
                              >
                                {line || '\u00A0'}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CodeViewerDialog
