'use client'

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eye,
  Italic,
  Link,
  List,
  ListOrdered,
  PaintBucket,
  Palette,
  Quote,
  Save,
  Strikethrough,
  Type,
  Underline,
  X,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'
import { Label, Separator } from '../../primitives'
import { Button } from '../../primitives/button'
import { Input } from '../../primitives/input'

// Nettoyage HTML basique pour la sécurité
const sanitizeHtml = (html: string): string => {
  if (!html) return ''

  // Supprimer les scripts et événements dangereux
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

interface RichTextEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialContent?: string
  onSave: (content: string) => void
  placeholder?: string
  compact?: boolean
}

const TEXT_COLORS = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#800000',
  '#008000',
  '#000080',
  '#808000',
  '#800080',
  '#008080',
  '#C0C0C0',
  '#808080',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FECA57',
  '#FF9FF3',
  '#54A0FF',
  '#5F27CD',
]

const BACKGROUND_COLORS = [
  'transparent',
  '#FFEBCD',
  '#E6F3FF',
  '#F0FFF0',
  '#FFF0F5',
  '#F0F8FF',
  '#FFFACD',
  '#F5F5DC',
  '#FFE4E1',
  '#E0FFFF',
  '#F0FFFF',
  '#FAFAD2',
  '#FFE4B5',
  '#FFEFD5',
  '#F5FFFA',
  '#F0F0F0',
  '#FFCCCB',
  '#ADD8E6',
  '#90EE90',
  '#FFB6C1',
  '#87CEEB',
  '#DDA0DD',
  '#98FB98',
  '#F0E68C',
]

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']

export function RichTextEditor({
  open,
  onOpenChange,
  initialContent = '',
  onSave,
  placeholder = 'Commencez à taper...',
  compact = false,
}: RichTextEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [showPreview, setShowPreview] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkData, setLinkData] = useState({ url: '', text: '' })
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setContent(initialContent)
    if (editorRef.current && open) {
      editorRef.current.innerHTML = initialContent || ''
      // Focus l'éditeur quand il s'ouvre
      setTimeout(() => {
        editorRef.current?.focus()
      }, 100)
    }
  }, [initialContent, open])

  const updateContent = useCallback(() => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML
      setContent(htmlContent)
    }
  }, [])

  const executeCommand = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value)
      editorRef.current?.focus()
      updateContent()
    },
    [updateContent]
  )

  const handleSave = useCallback(() => {
    const sanitizedContent = sanitizeHtml(content)
    onSave(sanitizedContent)
    onOpenChange(false)
  }, [content, onSave, onOpenChange])

  const insertLink = useCallback(() => {
    // S'assurer que l'éditeur a le focus
    editorRef.current?.focus()

    const selection = window.getSelection()
    const selectedText = selection?.toString() || ''

    setLinkData({
      url: '',
      text: selectedText,
    })
    setShowLinkDialog(true)
  }, [])

  const handleInsertLink = useCallback(() => {
    if (!linkData.url || !editorRef.current) {
      return
    }

    // S'assurer que l'éditeur a le focus
    editorRef.current.focus()

    const linkText = linkData.text || linkData.url
    const linkHtml = `<a href="${linkData.url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`

    try {
      // Méthode 1: Utiliser execCommand
      const inserted = document.execCommand('insertHTML', false, linkHtml)

      if (!inserted) {
        // Méthode 2: Insertion manuelle avec Selection API
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()

          // Créer le lien
          const linkElement = document.createElement('a')
          linkElement.href = linkData.url
          linkElement.textContent = linkText
          linkElement.target = '_blank'
          linkElement.rel = 'noopener noreferrer'

          range.insertNode(linkElement)

          // Placer le curseur après le lien
          range.setStartAfter(linkElement)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          // Méthode 3: Ajouter à la fin
          const linkElement = document.createElement('a')
          linkElement.href = linkData.url
          linkElement.textContent = linkText
          linkElement.target = '_blank'
          linkElement.rel = 'noopener noreferrer'

          editorRef.current.appendChild(linkElement)
        }
      }

      updateContent()
    } catch (_error) {}

    setShowLinkDialog(false)
    setLinkData({ url: '', text: '' })
    setTimeout(() => editorRef.current?.focus(), 100)
  }, [linkData, updateContent])

  const setTextColor = useCallback(
    (color: string) => {
      executeCommand('foreColor', color)
    },
    [executeCommand]
  )

  const setBackgroundColor = useCallback(
    (color: string) => {
      executeCommand('backColor', color)
    },
    [executeCommand]
  )

  const setFontSize = useCallback(
    (size: string) => {
      executeCommand('fontSize', '3') // Reset first
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const span = document.createElement('span')
        span.style.fontSize = size
        span.appendChild(range.extractContents())
        range.insertNode(span)
      }
      updateContent()
    },
    [updateContent, executeCommand]
  )

  const clearFormatting = useCallback(() => {
    executeCommand('removeFormat')
  }, [executeCommand])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()

      // Obtenir le contenu du presse-papier
      const clipboardData = e.clipboardData
      if (clipboardData) {
        // Essayer d'obtenir le HTML en premier, puis le texte
        const htmlData = clipboardData.getData('text/html')
        const textData = clipboardData.getData('text/plain')

        if (htmlData) {
          // Nettoyer le HTML collé
          const cleanHtml = sanitizeHtml(htmlData)
          document.execCommand('insertHTML', false, cleanHtml)
        } else if (textData) {
          // Insérer le texte brut
          document.execCommand('insertText', false, textData)
        }

        updateContent()
      }
    },
    [updateContent]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Gérer les raccourcis clavier
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault()
            executeCommand('bold')
            break
          case 'i':
            e.preventDefault()
            executeCommand('italic')
            break
          case 'u':
            e.preventDefault()
            executeCommand('underline')
            break
          case 'k':
            e.preventDefault()
            insertLink()
            break
          case 'v':
            // Ne pas empêcher Ctrl+V, laisser l'événement paste se déclencher naturellement
            break
        }
      }
    },
    [executeCommand, insertLink]
  )

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    title,
    isActive = false,
  }: {
    onClick: () => void
    icon: React.ComponentType<any>
    title: string
    isActive?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn('p-2 rounded hover:bg-muted transition-colors', isActive && 'bg-muted')}
    >
      <Icon className="h-4 w-4" />
    </button>
  )

  const ColorPicker = ({
    colors,
    onColorSelect,
    title,
    icon,
  }: {
    colors: string[]
    onColorSelect: (color: string) => void
    title: string
    icon: React.ComponentType<any>
  }) => {
    const [isOpen, setIsOpen] = useState(false)
    const IconComponent = icon

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={title}
          className="p-2 rounded hover:bg-muted transition-colors"
        >
          <IconComponent className="h-4 w-4" />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 z-50 bg-white border rounded-md shadow-xl p-3 w-64">
            <p className="text-xs font-medium mb-2">{title}</p>
            <div className="grid grid-cols-8 gap-1">
              {colors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  type="button"
                  onClick={() => {
                    onColorSelect(color)
                    setIsOpen(false)
                  }}
                  className="w-7 h-7 rounded border-2 border-gray-300 hover:border-blue-500 hover:scale-110 transition-all shadow-sm"
                  style={{
                    backgroundColor: color === 'transparent' ? '#ffffff' : color,
                    backgroundImage:
                      color === 'transparent'
                        ? 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px'
                        : 'none',
                  }}
                  title={color === 'transparent' ? 'Transparent' : color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (compact) {
    // Version compacte pour l'édition inline
    return (
      <div className="border rounded-md">
        <style>{`
          [contenteditable] a {
            color: #2563eb;
            text-decoration: underline;
            cursor: pointer;
            transition: color 0.2s;
            font-weight: 500;
          }
          [contenteditable] a:hover {
            color: #1d4ed8;
            text-decoration: underline;
            background-color: #f0f9ff;
            padding: 1px 2px;
            border-radius: 2px;
          }
        `}</style>
        <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
          <ToolbarButton onClick={() => executeCommand('bold')} icon={Bold} title="Gras" />
          <ToolbarButton onClick={() => executeCommand('italic')} icon={Italic} title="Italique" />
          <ToolbarButton
            onClick={() => executeCommand('underline')}
            icon={Underline}
            title="Souligné"
          />
          <Separator orientation="vertical" className="h-4" />
          <ColorPicker
            colors={TEXT_COLORS}
            onColorSelect={setTextColor}
            title="Couleur du texte"
            icon={Palette}
          />
          <ToolbarButton onClick={clearFormatting} icon={X} title="Effacer le formatage" />
        </div>
        <div
          ref={editorRef}
          contentEditable
          className="p-3 min-h-[100px] focus:outline-none"
          style={{ fontSize: '14px', lineHeight: '1.4' }}
          data-placeholder={placeholder}
          onInput={updateContent}
          onBlur={updateContent}
          dangerouslySetInnerHTML={{ __html: initialContent }}
          role="textbox"
          aria-label={placeholder || 'Rich text editor'}
          aria-multiline="true"
          tabIndex={0}
        />
      </div>
    )
  }

  // Version complète - test sans Dialog
  if (open) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] flex flex-col w-full mx-4">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Type className="h-5 w-5" />
                Éditeur de texte riche
              </h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 p-6">
            <style>{`
              [contenteditable][data-placeholder]:empty::before {
                content: attr(data-placeholder);
                color: #9ca3af;
                cursor: text;
              }
              [contenteditable]:focus {
                outline: none;
              }
              [contenteditable] ul {
                list-style-type: disc;
                margin-left: 20px;
                padding-left: 10px;
              }
              [contenteditable] ol {
                list-style-type: decimal;
                margin-left: 20px;
                padding-left: 10px;
              }
              [contenteditable] li {
                margin: 4px 0;
                list-style-position: outside;
              }
              [contenteditable] blockquote {
                border-left: 4px solid #ddd;
                margin: 10px 0;
                padding: 10px 15px;
                background: #f9f9f9;
                font-style: italic;
              }
              [contenteditable] p {
                margin: 8px 0;
              }
              [contenteditable] a {
                color: #2563eb;
                text-decoration: underline;
                cursor: pointer;
                transition: color 0.2s;
                font-weight: 500;
              }
              [contenteditable] a:hover {
                color: #1d4ed8;
                text-decoration: underline;
                background-color: #f0f9ff;
                padding: 1px 2px;
                border-radius: 2px;
              }
              /* Styles pour les liens dans la prévisualisation */
              .preview-content a {
                color: #2563eb;
                text-decoration: underline;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 500;
                padding: 2px 4px;
                border-radius: 3px;
                display: inline-block;
                position: relative;
              }
              .preview-content a:hover {
                color: #1d4ed8;
                background-color: #dbeafe;
                text-decoration: none;
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
              }
              .preview-content a::after {
                content: "↗";
                font-size: 0.75em;
                margin-left: 2px;
                opacity: 0;
                transition: opacity 0.2s;
              }
              .preview-content a:hover::after {
                opacity: 1;
              }
            `}</style>
            {/* Barre d'outils */}
            <div className="border rounded-md mb-4">
              <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-wrap">
                {/* Formatage de base */}
                <ToolbarButton
                  onClick={() => executeCommand('bold')}
                  icon={Bold}
                  title="Gras (Ctrl+B)"
                />
                <ToolbarButton
                  onClick={() => executeCommand('italic')}
                  icon={Italic}
                  title="Italique (Ctrl+I)"
                />
                <ToolbarButton
                  onClick={() => executeCommand('underline')}
                  icon={Underline}
                  title="Souligné (Ctrl+U)"
                />
                <ToolbarButton
                  onClick={() => executeCommand('strikeThrough')}
                  icon={Strikethrough}
                  title="Barré"
                />

                <Separator orientation="vertical" className="h-4 mx-2" />

                {/* Alignement */}
                <ToolbarButton
                  onClick={() => executeCommand('justifyLeft')}
                  icon={AlignLeft}
                  title="Aligner à gauche"
                />
                <ToolbarButton
                  onClick={() => executeCommand('justifyCenter')}
                  icon={AlignCenter}
                  title="Centrer"
                />
                <ToolbarButton
                  onClick={() => executeCommand('justifyRight')}
                  icon={AlignRight}
                  title="Aligner à droite"
                />

                <Separator orientation="vertical" className="h-4 mx-2" />

                {/* Listes */}
                <ToolbarButton
                  onClick={() => executeCommand('insertUnorderedList')}
                  icon={List}
                  title="Liste à puces"
                />
                <ToolbarButton
                  onClick={() => executeCommand('insertOrderedList')}
                  icon={ListOrdered}
                  title="Liste numérotée"
                />
                <ToolbarButton
                  onClick={() => executeCommand('formatBlock', 'blockquote')}
                  icon={Quote}
                  title="Citation"
                />

                <Separator orientation="vertical" className="h-4 mx-2" />

                {/* Couleurs */}
                <ColorPicker
                  colors={TEXT_COLORS}
                  onColorSelect={setTextColor}
                  title="Couleur du texte"
                  icon={Palette}
                />
                <ColorPicker
                  colors={BACKGROUND_COLORS}
                  onColorSelect={setBackgroundColor}
                  title="Couleur de fond"
                  icon={PaintBucket}
                />

                <Separator orientation="vertical" className="h-4 mx-2" />

                {/* Autres outils */}
                <ToolbarButton onClick={insertLink} icon={Link} title="Insérer un lien" />

                {/* Taille de police */}
                <select
                  onChange={(e: any) => setFontSize(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                  title="Taille de police"
                >
                  <option value="">Taille</option>
                  {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>

                <Separator orientation="vertical" className="h-4 mx-2" />

                <ToolbarButton onClick={clearFormatting} icon={X} title="Effacer le formatage" />

                {/* Prévisualisation */}
                <div className="ml-auto">
                  <ToolbarButton
                    onClick={() => setShowPreview(!showPreview)}
                    icon={Eye}
                    title="Prévisualisation"
                    isActive={showPreview}
                  />
                </div>
              </div>
            </div>

            {/* Zone d'édition */}
            <div className="flex-1 border rounded-md overflow-hidden flex">
              {/* Éditeur */}
              <div className={cn('flex-1 flex flex-col', showPreview && 'border-r')}>
                <div className="bg-muted/30 px-3 py-1 text-xs font-medium border-b">Édition</div>
                <div
                  ref={editorRef}
                  contentEditable
                  className="flex-1 p-4 focus:outline-none overflow-y-auto border-2 border-transparent focus:border-blue-500"
                  style={{ fontSize: '14px', lineHeight: '1.6', minHeight: '200px' }}
                  data-placeholder={placeholder}
                  onInput={updateContent}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  suppressContentEditableWarning
                  role="textbox"
                  aria-label={placeholder || 'Advanced rich text editor'}
                  aria-multiline="true"
                  tabIndex={0}
                />
              </div>

              {/* Prévisualisation */}
              {showPreview && (
                <div className="flex-1 flex flex-col">
                  <div className="bg-muted/30 px-3 py-1 text-xs font-medium border-b">
                    Prévisualisation
                  </div>
                  <div
                    className="flex-1 p-4 overflow-y-auto bg-gray-50 preview-content"
                    style={{ fontSize: '14px', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>

        {/* Dialogue d'insertion de lien */}
        {showLinkDialog && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Link className="h-5 w-5" />
                Insérer un lien
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="link-url" className="text-sm font-medium">
                    URL *
                  </Label>
                  <Input
                    id="link-url"
                    type="url"
                    placeholder="https://example.com"
                    value={linkData.url}
                    onChange={(e: any) =>
                      setLinkData((prev: any) => ({ ...prev, url: e.target.value }))
                    }
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter' && linkData.url.trim()) {
                        handleInsertLink()
                      }
                      if (e.key === 'Escape') {
                        setShowLinkDialog(false)
                        setLinkData({ url: '', text: '' })
                      }
                    }}
                    className="mt-1"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="link-text" className="text-sm font-medium">
                    Texte à afficher
                  </Label>
                  <Input
                    id="link-text"
                    placeholder="Texte du lien (optionnel)"
                    value={linkData.text}
                    onChange={(e: any) =>
                      setLinkData((prev: any) => ({ ...prev, text: e.target.value }))
                    }
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter' && linkData.url.trim()) {
                        handleInsertLink()
                      }
                      if (e.key === 'Escape') {
                        setShowLinkDialog(false)
                        setLinkData({ url: '', text: '' })
                      }
                    }}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si vide, l'URL sera utilisée comme texte
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLinkDialog(false)
                    setLinkData({ url: '', text: '' })
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleInsertLink} disabled={!linkData.url.trim()}>
                  Insérer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

export default RichTextEditor
