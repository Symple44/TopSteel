import { useCallback, useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  category: string
}

export interface KeyboardShortcutsConfig {
  // Navigation
  arrowKeys: boolean
  homeEnd: boolean
  pageUpDown: boolean

  // Sélection
  selectAll: boolean
  selectRow: boolean
  selectColumn: boolean

  // Édition
  copy: boolean
  paste: boolean
  cut: boolean
  delete: boolean
  fillDown: boolean
  fillRight: boolean

  // Tableau
  editCell: boolean
  cancelEdit: boolean

  // Actions
  create: boolean
  export: boolean
}

export const DEFAULT_SHORTCUTS_CONFIG: KeyboardShortcutsConfig = {
  arrowKeys: true,
  homeEnd: true,
  pageUpDown: true,
  selectAll: true,
  selectRow: true,
  selectColumn: true,
  copy: true,
  paste: true,
  cut: true,
  delete: true,
  fillDown: true,
  fillRight: true,
  editCell: true,
  cancelEdit: true,
  create: true,
  export: true,
}

export interface KeyboardShortcutsActions {
  // Navigation
  onArrowKey?: (direction: 'up' | 'down' | 'left' | 'right', shiftKey: boolean) => void
  onHome?: (ctrlKey: boolean) => void
  onEnd?: (ctrlKey: boolean) => void
  onPageUp?: () => void
  onPageDown?: () => void

  // Sélection
  onSelectAll?: () => void
  onSelectRow?: (rowIndex: number) => void
  onSelectColumn?: (columnId: string) => void

  // Édition
  onCopy?: () => void
  onPaste?: () => void
  onCut?: () => void
  onDelete?: () => void
  onFillDown?: () => void
  onFillRight?: () => void

  // Tableau
  onEditCell?: (rowIndex: number, columnId: string) => void
  onCancelEdit?: () => void

  // Actions
  onCreate?: () => void
  onExport?: () => void

  // Navigation avancée
  onTabNavigation?: (forward: boolean) => void
  onEnterNavigation?: () => void
}

export function useKeyboardShortcuts(
  config: Partial<KeyboardShortcutsConfig> = {},
  actions: KeyboardShortcutsActions = {},
  enabled: boolean = true,
  targetRef?: React.RefObject<HTMLElement>
) {
  const finalConfig = { ...DEFAULT_SHORTCUTS_CONFIG, ...config }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const { key, ctrlKey, shiftKey, altKey, metaKey } = event
      const isModifierPressed = ctrlKey || metaKey

      // Empêcher les raccourcis si l'utilisateur tape dans un input
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Permettre seulement certains raccourcis dans les inputs
        if (isModifierPressed) {
          switch (key.toLowerCase()) {
            case 'a':
              if (finalConfig.selectAll && actions.onSelectAll) {
                // Dans ce cas, on laisse le comportement natif de sélection du texte
                return
              }
              break
            case 'c':
              if (finalConfig.copy) return // Laisser le copy natif
            case 'v':
              if (finalConfig.paste) return // Laisser le paste natif
            case 'x':
              if (finalConfig.cut) return // Laisser le cut natif
          }
        }
        return
      }

      let handled = false

      // Raccourcis avec Ctrl/Cmd
      if (isModifierPressed) {
        switch (key.toLowerCase()) {
          case 'a':
            if (finalConfig.selectAll && actions.onSelectAll) {
              event.preventDefault()
              actions.onSelectAll()
              handled = true
            }
            break

          case 'c':
            if (finalConfig.copy && actions.onCopy) {
              event.preventDefault()
              actions.onCopy()
              handled = true
            }
            break

          case 'v':
            if (finalConfig.paste && actions.onPaste) {
              event.preventDefault()
              actions.onPaste()
              handled = true
            }
            break

          case 'x':
            if (finalConfig.cut && actions.onCut) {
              event.preventDefault()
              actions.onCut()
              handled = true
            }
            break

          case 'd':
            if (finalConfig.fillDown && actions.onFillDown) {
              event.preventDefault()
              actions.onFillDown()
              handled = true
            }
            break

          case 'r':
            if (finalConfig.fillRight && actions.onFillRight) {
              event.preventDefault()
              actions.onFillRight()
              handled = true
            }
            break

          case 'n':
            if (finalConfig.create && actions.onCreate) {
              event.preventDefault()
              actions.onCreate()
              handled = true
            }
            break

          case 'e':
            if (finalConfig.export && actions.onExport) {
              event.preventDefault()
              actions.onExport()
              handled = true
            }
            break

          case 'home':
            if (finalConfig.homeEnd && actions.onHome) {
              event.preventDefault()
              actions.onHome(true)
              handled = true
            }
            break

          case 'end':
            if (finalConfig.homeEnd && actions.onEnd) {
              event.preventDefault()
              actions.onEnd(true)
              handled = true
            }
            break
        }
      } else {
        // Raccourcis sans modificateur
        switch (key) {
          case 'ArrowUp':
          case 'ArrowDown':
          case 'ArrowLeft':
          case 'ArrowRight':
            if (finalConfig.arrowKeys && actions.onArrowKey) {
              event.preventDefault()
              const direction = key.replace('Arrow', '').toLowerCase() as
                | 'up'
                | 'down'
                | 'left'
                | 'right'
              actions.onArrowKey(direction, shiftKey)
              handled = true
            }
            break

          case 'Home':
            if (finalConfig.homeEnd && actions.onHome) {
              event.preventDefault()
              actions.onHome(false)
              handled = true
            }
            break

          case 'End':
            if (finalConfig.homeEnd && actions.onEnd) {
              event.preventDefault()
              actions.onEnd(false)
              handled = true
            }
            break

          case 'PageUp':
            if (finalConfig.pageUpDown && actions.onPageUp) {
              event.preventDefault()
              actions.onPageUp()
              handled = true
            }
            break

          case 'PageDown':
            if (finalConfig.pageUpDown && actions.onPageDown) {
              event.preventDefault()
              actions.onPageDown()
              handled = true
            }
            break

          case 'Delete':
          case 'Backspace':
            if (finalConfig.delete && actions.onDelete) {
              event.preventDefault()
              actions.onDelete()
              handled = true
            }
            break

          case 'F2':
            if (finalConfig.editCell && actions.onEditCell) {
              event.preventDefault()
              // TODO: Déterminer quelle cellule éditer
              // actions.onEditCell(rowIndex, columnId)
              handled = true
            }
            break

          case 'Escape':
            if (finalConfig.cancelEdit && actions.onCancelEdit) {
              event.preventDefault()
              actions.onCancelEdit()
              handled = true
            }
            break

          case 'Enter':
            if (actions.onEnterNavigation) {
              event.preventDefault()
              actions.onEnterNavigation()
              handled = true
            }
            break

          case 'Tab':
            if (actions.onTabNavigation) {
              event.preventDefault()
              actions.onTabNavigation(!shiftKey) // true pour suivant, false pour précédent
              handled = true
            }
            break
        }
      }

      return handled
    },
    [finalConfig, actions, enabled]
  )

  useEffect(() => {
    const element = targetRef?.current || document

    element.addEventListener('keydown', handleKeyDown as EventListener)
    return () => {
      element.removeEventListener('keydown', handleKeyDown as EventListener)
    }
  }, [handleKeyDown, targetRef])

  // Retourner les raccourcis disponibles pour l'affichage dans l'aide
  const getAvailableShortcuts = useCallback((): KeyboardShortcut[] => {
    const shortcuts: KeyboardShortcut[] = []

    if (finalConfig.selectAll && actions.onSelectAll) {
      shortcuts.push({
        key: 'Ctrl+A',
        action: actions.onSelectAll,
        description: 'Sélectionner tout',
        category: 'Sélection',
      })
    }

    if (finalConfig.copy && actions.onCopy) {
      shortcuts.push({
        key: 'Ctrl+C',
        action: actions.onCopy,
        description: 'Copier',
        category: 'Édition',
      })
    }

    if (finalConfig.paste && actions.onPaste) {
      shortcuts.push({
        key: 'Ctrl+V',
        action: actions.onPaste,
        description: 'Coller',
        category: 'Édition',
      })
    }

    if (finalConfig.fillDown && actions.onFillDown) {
      shortcuts.push({
        key: 'Ctrl+D',
        action: actions.onFillDown,
        description: 'Remplir vers le bas',
        category: 'Édition',
      })
    }

    if (finalConfig.fillRight && actions.onFillRight) {
      shortcuts.push({
        key: 'Ctrl+R',
        action: actions.onFillRight,
        description: 'Remplir vers la droite',
        category: 'Édition',
      })
    }

    if (finalConfig.create && actions.onCreate) {
      shortcuts.push({
        key: 'Ctrl+N',
        action: actions.onCreate,
        description: 'Nouvel élément',
        category: 'Actions',
      })
    }

    if (finalConfig.export && actions.onExport) {
      shortcuts.push({
        key: 'Ctrl+E',
        action: actions.onExport,
        description: 'Exporter',
        category: 'Actions',
      })
    }

    if (finalConfig.arrowKeys && actions.onArrowKey) {
      shortcuts.push({
        key: '↑↓←→',
        action: () => {},
        description: 'Naviguer dans le tableau',
        category: 'Navigation',
      })
    }

    if (finalConfig.editCell && actions.onEditCell) {
      shortcuts.push({
        key: 'F2',
        action: () => {},
        description: 'Éditer la cellule',
        category: 'Édition',
      })
    }

    if (finalConfig.cancelEdit && actions.onCancelEdit) {
      shortcuts.push({
        key: 'Échap',
        action: actions.onCancelEdit,
        description: "Annuler l'édition",
        category: 'Édition',
      })
    }

    if (finalConfig.delete && actions.onDelete) {
      shortcuts.push({
        key: 'Suppr',
        action: actions.onDelete,
        description: 'Supprimer',
        category: 'Édition',
      })
    }

    return shortcuts
  }, [finalConfig, actions])

  return {
    shortcuts: getAvailableShortcuts(),
    config: finalConfig,
  }
}
