import { useCallback, useEffect } from 'react'
import { fetchTyped, postTyped } from '../../../../../lib/api-typed'
import { mapMenuItemRecursively } from '../utils/menu-transformers'
import type { MenuItemConfig, UserMenuItem } from '../types/menu.types'

/**
 * Custom hook for managing menu API operations.
 *
 * This hook handles all server communication for the menu editor:
 * - Loading standard menu from system configuration
 * - Loading user's custom menu preferences
 * - Saving user menu changes
 * - Broadcasting menu updates via custom events
 *
 * The hook automatically loads both standard and user menus on mount.
 * When saving, it dispatches a 'menuPreferencesChanged' event that other
 * components (like the sidebar) can listen to for real-time updates.
 *
 * @param {Function} setStandardMenu - Function to update standard menu state
 * @param {Function} setUserMenu - Function to update user menu state
 * @param {Function} setLoading - Function to update loading state
 * @param {Function} setSaving - Function to update saving state
 *
 * @returns {Object} API operation functions:
 *   - loadStandardMenu: Async function to reload standard menu
 *   - loadUserMenu: Async function to reload user menu
 *   - saveUserMenu: Async function to save user menu changes
 *
 * @example
 * ```tsx
 * function MenuEditor() {
 *   const [standardMenu, setStandardMenu] = useState([])
 *   const [userMenu, setUserMenu] = useState([])
 *   const [loading, setLoading] = useState(true)
 *   const [saving, setSaving] = useState(false)
 *
 *   const { saveUserMenu, loadUserMenu } = useMenuApi(
 *     setStandardMenu,
 *     setUserMenu,
 *     setLoading,
 *     setSaving
 *   )
 *
 *   const handleSave = async () => {
 *     await saveUserMenu(userMenu)
 *     toast.success('Menu saved!')
 *   }
 *
 *   const handleReset = async () => {
 *     await loadUserMenu()
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleSave}>Save</button>
 *       <button onClick={handleReset}>Reset</button>
 *       {/* Menu editor UI *\/}
 *     </div>
 *   )
 * }
 * ```
 */
export function useMenuApi(
  setStandardMenu: (menu: MenuItemConfig[]) => void,
  setUserMenu: (menu: UserMenuItem[]) => void,
  setLoading: (loading: boolean) => void,
  setSaving: (saving: boolean) => void
) {
  const loadStandardMenu = useCallback(async () => {
    try {
      const response = await fetchTyped('/admin/menu-raw/configurations/active')
      if (
        (response as unknown as { data?: { success?: boolean; data?: { menuTree?: unknown[] } } })
          .data?.success &&
        (response as unknown as { data?: { data?: unknown } }).data?.data
      ) {
        const menuItems = Array.isArray(
          (response as unknown as { data: { data: { menuTree?: unknown[] } } }).data?.data?.menuTree
        )
          ? (response as unknown as { data: { data: { menuTree: unknown[] } } }).data?.data
              ?.menuTree
          : []
        setStandardMenu(menuItems as MenuItemConfig[])
      }
    } catch {
      // Erreur lors du chargement du menu standard
    } finally {
      setLoading(false)
    }
  }, [setStandardMenu, setLoading])

  const loadUserMenu = useCallback(async () => {
    try {
      const response = await fetchTyped('/user/menu-preferences/custom-menu')

      if (
        (response as unknown as { data?: { success?: boolean; data?: unknown[] } }).data?.success &&
        Array.isArray((response as unknown as { data: { data: unknown[] } }).data.data)
      ) {
        // Convertir les données API vers le format UserMenuItem requis avec mapping récursif
        const menuItems = (response as unknown as { data: { data: unknown[] } }).data?.data?.map(
          (item: unknown, index: number) => mapMenuItemRecursively(item, index)
        )

        setUserMenu(menuItems)
      } else {
        setUserMenu([])
      }
    } catch {
      // Erreur lors du chargement du menu utilisateur
      setUserMenu([])
    }
  }, [setUserMenu])

  const saveUserMenu = async (userMenu: UserMenuItem[]) => {
    setSaving(true)
    try {
      const response = await postTyped('/user/menu-preferences/custom-menu', {
        menuItems: userMenu,
      })

      if ((response as unknown as { data?: { success?: boolean } }).data?.success) {
        // Envoyer un événement personnalisé pour notifier la sidebar
        const event = new CustomEvent('menuPreferencesChanged', {
          detail: {
            fromCustomizationPage: true,
            savedAt: new Date().toISOString(),
            menuItemsCount: userMenu.length,
            menuItems: userMenu,
          },
        })
        window.dispatchEvent(event)
      }
    } catch {
      // Erreur lors de la sauvegarde
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadStandardMenu()
    loadUserMenu()
  }, [loadStandardMenu, loadUserMenu])

  return {
    loadStandardMenu,
    loadUserMenu,
    saveUserMenu,
  }
}
