import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  useFormFieldIds,
} from '@erp/ui'
import { Check, Edit, Info, Loader2, RotateCcw as Reset } from 'lucide-react'
import { TranslationFieldWrapper } from '../../../../../components/wrappers/translation-field-wrapper'
import { useTranslation } from '../../../../../lib/i18n/hooks'
import { translator } from '../../../../../lib/i18n/translator'
import { postTyped } from '../../../../../lib/api-typed'
import { getTranslatedTitle } from '../../../../../utils/menu-translations'
import { getIconComponent } from '../utils/icon-utils'
import { getTypeBadgeColor, getTypeIcon, getTypeLabel } from '../utils/menu-type-utils'
import { IconSelector } from './IconSelector'
import { ColorSelector } from './ColorSelector'
import type { UserMenuItem } from '../types/menu.types'

interface MenuItemEditModalProps {
  isOpen: boolean
  onClose: () => void
  editingItem: UserMenuItem | null
  userMenu: UserMenuItem[]
  onMenuUpdate: (updatedMenu: UserMenuItem[]) => void
}

export function MenuItemEditModal({
  isOpen,
  onClose,
  editingItem,
  userMenu,
  onMenuUpdate,
}: MenuItemEditModalProps) {
  const ids = useFormFieldIds(['edit-url', 'edit-query-id'])
  const { t } = useTranslation('settings')
  const [editTitle, setEditTitle] = useState('')
  const [editTitleTranslations, setEditTitleTranslations] = useState<Record<string, string>>({})
  const [editIcon, setEditIcon] = useState('')
  const [editIconColor, setEditIconColor] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editQueryId, setEditQueryId] = useState('')
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    if (editingItem) {
      setEditTitle(getTranslatedTitle(editingItem))
      setEditTitleTranslations(editingItem.titleTranslations || {})
      setEditIcon(editingItem.customIcon || editingItem.icon || '')
      setEditIconColor(editingItem.customIconColor || '')
      setEditUrl(editingItem.externalUrl || '')
      setEditQueryId(editingItem.queryBuilderId || '')
      setShowIconSelector(false)
      setIsSaving(false)
      setShowInfo(false)
    }
  }, [editingItem])

  const resetItemEdit = useCallback(() => {
    if (!editingItem) return
    setEditTitle(getTranslatedTitle(editingItem))
    setEditTitleTranslations(editingItem.titleTranslations || {})
    setEditIcon(editingItem.customIcon || editingItem.icon || '')
    setEditIconColor(editingItem.customIconColor || '')
    setEditUrl(editingItem.externalUrl || '')
    setEditQueryId(editingItem.queryBuilderId || '')
  }, [editingItem])

  const saveItemEdit = useCallback(async () => {
    if (!editingItem || isSaving) return

    setIsSaving(true)

    try {
      // Simule un délai de sauvegarde pour montrer l'animation
      await new Promise((resolve) => setTimeout(resolve, 800))

      const updateItemRecursively = (items: UserMenuItem[]): UserMenuItem[] => {
        return items?.map((item) => {
          if (item.id === editingItem.id) {
            const currentLanguage = translator?.getCurrentLanguage()
            const updatedTranslations = { ...editTitleTranslations }

            // Sauvegarder le titre dans la langue courante
            if (editTitle?.trim()) {
              updatedTranslations[currentLanguage] = editTitle?.trim()
            }

            return {
              ...item,
              customTitle: editTitle?.trim() || item.title, // Garder pour compatibilité
              titleTranslations: updatedTranslations,
              customIcon: editIcon || item.icon,
              customIconColor: editIconColor || undefined,
              externalUrl: editingItem.type === 'L' ? editUrl : item.externalUrl,
              queryBuilderId: editingItem.type === 'D' ? editQueryId : item.queryBuilderId,
            }
          }
          if (item.children && item?.children?.length > 0) {
            return {
              ...item,
              children: updateItemRecursively(item.children),
            }
          }
          return item
        })
      }

      const updatedMenu = updateItemRecursively(userMenu)
      onMenuUpdate(updatedMenu)

      // Sauvegarder automatiquement en BDD après modification
      try {
        const response = await postTyped('/user/menu-preferences/custom-menu', {
          menuItems: updatedMenu,
        })

        if ((response as unknown as { data?: { success?: boolean } }).data?.success) {
          // Envoyer un événement pour notifier la sidebar
          const event = new CustomEvent('menuPreferencesChanged', {
            detail: {
              fromEdit: true,
              editedItemId: editingItem.id,
              savedAt: new Date().toISOString(),
              menuItems: updatedMenu,
            },
          })
          window.dispatchEvent(event)
        }
      } catch {
        // Erreur lors de la sauvegarde automatique
        // Ne pas bloquer l'interface même si la sauvegarde échoue
      }

      // Fermeture avec délai pour voir la confirmation
      setTimeout(() => {
        onClose()
        setShowIconSelector(false)
        setIsSaving(false)
      }, 300)
    } catch {
      // Erreur lors de la sauvegarde
      setIsSaving(false)
    }
  }, [
    editingItem,
    isSaving,
    editTitleTranslations,
    editTitle,
    editIcon,
    editIconColor,
    editUrl,
    editQueryId,
    userMenu,
    onMenuUpdate,
    onClose,
  ])

  // Raccourcis clavier optimisés
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      // Escape pour fermer le sélecteur ou la modale (sauf si sauvegarde en cours)
      if (e.key === 'Escape' && !isSaving) {
        if (showIconSelector) {
          setShowIconSelector(false)
        } else {
          onClose()
        }
        return
      }

      // Ctrl+S pour sauvegarder (sauf si déjà en cours)
      if (e.ctrlKey && e.key === 's' && !isSaving) {
        e?.preventDefault()
        saveItemEdit()
      }

      // Ctrl+R pour reset (sauf si sauvegarde en cours)
      if (e.ctrlKey && e.key === 'r' && !isSaving) {
        e?.preventDefault()
        resetItemEdit()
      }

      // Ctrl+Escape pour forcer la fermeture (urgence)
      if (e.ctrlKey && e.key === 'Escape') {
        e?.preventDefault()
        onClose()
        setIsSaving(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
    return undefined
  }, [isOpen, showIconSelector, isSaving, resetItemEdit, saveItemEdit, onClose])

  if (!editingItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && !open && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden relative">
        {/* Overlay de loading */}
        {isSaving && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg shadow-lg border">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <p className="text-sm font-medium text-green-600">Sauvegarde en cours...</p>
            </div>
          </div>
        )}
        <DialogHeader
          className={`pb-3 border-b transition-opacity duration-300 ${isSaving ? 'opacity-60' : 'opacity-100'}`}
        >
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Edit
              className={`h-5 w-5 transition-colors duration-300 ${
                isSaving ? 'text-green-600' : 'text-foreground'
              }`}
            />
            <span className="transition-colors duration-300">
              {isSaving ? t('menu.savingInProgress') : t('menu.edit')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div
          className={`pt-6 space-y-6 transition-all duration-300 ${
            isSaving ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        >
          {/* Interface principale - Icône à gauche, titre à droite */}
          <div className="flex items-center gap-4">
            {/* Icône cliquable */}
            <div className="flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowIconSelector(!showIconSelector)}
                className="group relative p-4 border-2 border-dashed rounded-lg hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                {(() => {
                  const IconComponent = editIcon
                    ? getIconComponent(editIcon)
                    : editingItem.customIcon
                      ? getIconComponent(editingItem.customIcon)
                      : getTypeIcon(editingItem.type)
                  const iconStyle = editIconColor
                    ? { color: editIconColor }
                    : editingItem.customIconColor
                      ? { color: editingItem.customIconColor }
                      : {}
                  return IconComponent ? (
                    <IconComponent className="h-8 w-8 transition-all duration-300" style={iconStyle} />
                  ) : null
                })()}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/30 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Edit className="h-4 w-4 text-white drop-shadow-lg" />
                </div>
              </Button>
            </div>

            {/* Titre personnalisable */}
            <div className="flex-1 space-y-3">
              <div>
                <TranslationFieldWrapper
                  value={editTitle}
                  onChange={(value) =>
                    setEditTitle(typeof value === 'string' ? value : Object.values(value)[0] || '')
                  }
                  translations={editTitleTranslations}
                  onTranslationsChange={setEditTitleTranslations}
                  placeholder={editingItem.title}
                  className="text-lg font-medium"
                  disabled={isSaving}
                  label={t('menu.title')}
                />
              </div>

              {/* Champs spécifiques selon le type */}
              {editingItem.type === 'L' && (
                <Input
                  id={ids['edit-url']}
                  value={editUrl}
                  onChange={(e) => setEditUrl(e?.target?.value)}
                  placeholder="https://example.com"
                  className="transition-all duration-200"
                  disabled={isSaving}
                />
              )}

              {editingItem.type === 'D' && (
                <Input
                  id={ids['edit-query-id']}
                  value={editQueryId}
                  onChange={(e) => setEditQueryId(e?.target?.value)}
                  placeholder="query-123"
                  className="transition-all duration-200"
                  disabled={isSaving}
                />
              )}
            </div>
          </div>

          {/* Sélecteur d'icône et couleur (affiché conditionnellement) */}
          {showIconSelector && (
            <div className="space-y-4 border-t pt-4">
              {/* Sélecteur de couleurs */}
              <ColorSelector
                selectedColor={editIconColor}
                onColorSelect={setEditIconColor}
                t={t}
                disabled={isSaving}
              />

              {/* Sélecteur d'icônes */}
              <IconSelector
                selectedIcon={editIcon}
                onIconSelect={setEditIcon}
                t={t}
                disabled={isSaving}
              />
            </div>
          )}

          {/* Aperçu amélioré */}
          <div
            className={`p-4 rounded-lg transition-all duration-300 ${
              isSaving
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                : 'bg-gradient-to-r from-muted/30 to-muted/60 border border-muted'
            }`}
          >
            <div className="flex items-center gap-3">
              {(() => {
                const IconComponent = editIcon
                  ? getIconComponent(editIcon)
                  : editingItem.customIcon
                    ? getIconComponent(editingItem.customIcon)
                    : getTypeIcon(editingItem.type)
                const previewIconStyle = editIconColor
                  ? { color: editIconColor }
                  : editingItem.customIconColor
                    ? { color: editingItem.customIconColor }
                    : {}
                return IconComponent ? (
                  <IconComponent
                    className="h-5 w-5 transition-all duration-300"
                    style={previewIconStyle}
                  />
                ) : null
              })()}
              <span className="font-medium transition-all duration-300">
                {editTitle?.trim() || editingItem.title}
              </span>
              <Badge
                className={`text-xs ${getTypeBadgeColor(editingItem.type)} text-white transition-all duration-300`}
              >
                {getTypeLabel(editingItem.type, t)}
              </Badge>
              {isSaving && (
                <div className="flex items-center gap-2 ml-auto">
                  <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Sauvegarde...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panneau d'information */}
        {showInfo && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Guide d'édition</h4>
                <ul className="space-y-1 text-blue-800 list-disc list-inside">
                  <li key="icon">
                    <strong>Icône :</strong> Cliquez sur l'icône pour ouvrir les sélecteurs
                  </li>
                  <li key="colors">
                    <strong>Couleurs :</strong> 16 couleurs disponibles + couleur par défaut
                  </li>
                  <li key="icons">
                    <strong>Icônes :</strong> 38 icônes organisées par catégorie
                  </li>
                  <li key="shortcuts">
                    <strong>Raccourcis :</strong> Ctrl+S (sauver), Ctrl+R (reset), Escape (fermer)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-3 pt-3 border-t bg-muted/20">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetItemEdit}
              disabled={isSaving}
              className="transition-all duration-200"
              title="Annuler les modifications"
            >
              <Reset className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="transition-all duration-200"
              title="Informations sur l'édition"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-3 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => !isSaving && onClose()}
              disabled={isSaving}
              className="transition-all duration-200 min-w-[100px]"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={saveItemEdit}
              disabled={isSaving}
              className={`transition-all duration-300 min-w-[140px] ${
                isSaving ? 'bg-green-600 hover:bg-green-700 shadow-lg' : 'hover:shadow-md'
              }`}
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Sauvegarde...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Check className="h-4 w-4 mr-2" />
                  <span>Sauvegarder</span>
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
