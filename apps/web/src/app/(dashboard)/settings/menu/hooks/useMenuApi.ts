import { useCallback, useEffect } from 'react'
import { fetchTyped, postTyped } from '../../../../../lib/api-typed'
import { mapMenuItemRecursively } from '../utils/menu-transformers'
import type { MenuItemConfig, UserMenuItem } from '../types/menu.types'

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
