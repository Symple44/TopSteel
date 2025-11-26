'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchTyped } from '../lib/api-typed'
import { translator } from '../lib/i18n/translator'
import { useMenuMode } from './use-menu-mode'
import { usePermissions } from './use-permissions-v2'

// Types pour les réponses API
interface MenuApiResponse {
  success: boolean
  data: RawMenuItemData[]
}

interface MenuConfigResponse {
  success: boolean
  data: {
    menuTree: MenuItemConfig[]
    configuration: MenuConfiguration
  }
}

// Interface pour les données brutes du menu depuis l'API
interface RawMenuItemData {
  id: string
  parentId?: string
  title: string
  titleKey?: string
  titleTranslations?: Record<string, string>
  href?: string
  icon?: string
  gradient?: string
  badge?: string
  orderIndex?: number
  isVisible?: boolean
  moduleId?: string
  target?: string
  type: 'M' | 'P' | 'L' | 'D'
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  permissions?: string[]
  roles?: string[]
  depth?: number
  // Propriétés personnalisées
  isFavorite?: boolean
  isPinned?: boolean
  customTitle?: string
  customIcon?: string
  customIconColor?: string
  customBadge?: string
  children?: RawMenuItemData[]
}

// Fonction pour mapper les données du menu personnalisé vers la structure attendue
function mapCustomMenuItemRecursively(item: RawMenuItemData): MenuItemConfig {
  return {
    id: item.id,
    parentId: item.parentId,
    title: item.title,
    titleKey: item.titleKey,
    titleTranslations: item.titleTranslations || {},
    href: item.href,
    icon: item.icon,
    gradient: item.gradient,
    badge: item.badge,
    orderIndex: item.orderIndex || 0,
    isVisible: item.isVisible ?? true,
    moduleId: item.moduleId,
    target: item.target,
    type: item.type,
    programId: item.programId,
    externalUrl: item.externalUrl,
    queryBuilderId: item.queryBuilderId,
    permissions: item.permissions,
    roles: item.roles,
    depth: item.depth || 0,
    // Mapper les propriétés personnalisées vers userPreferences
    userPreferences: {
      isVisible: item.isVisible ?? true,
      isFavorite: item.isFavorite ?? false,
      isPinned: item.isPinned ?? false,
      customTitle: item.customTitle,
      customIcon: item.customIcon,
      customColor: item.customIconColor,
      customBadge: item.customBadge,
      customOrder: item.orderIndex,
    },
    // Traiter récursivement les enfants
    children: Array.isArray(item.children)
      ? item.children.map((child) => mapCustomMenuItemRecursively(child))
      : [],
  }
}

export interface MenuItemConfig {
  id: string
  parentId?: string
  title: string
  titleKey?: string
  titleTranslations?: Record<string, string>
  href?: string
  icon?: string
  gradient?: string
  badge?: string
  orderIndex: number
  isVisible: boolean
  moduleId?: string
  target?: string
  type: 'M' | 'P' | 'L' | 'D'
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  permissions?: string[]
  roles?: string[]
  children: MenuItemConfig[]
  depth: number
  userPreferences?: {
    isVisible: boolean
    isFavorite: boolean
    isPinned: boolean
    customTitle?: string
    customIcon?: string
    customColor?: string
    customBadge?: string
    customOrder?: number
  }
}

export interface MenuConfiguration {
  id: string
  name: string
  description?: string
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
  filteredItems?: MenuItemConfig[]
}

export function useDynamicMenu() {
  const [menuConfig, setMenuConfig] = useState<MenuConfiguration | null>(null)
  const [standardMenu, setStandardMenu] = useState<MenuItemConfig[]>([])
  const [customMenu, setCustomMenu] = useState<MenuItemConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // Pour forcer les re-renders
  const { hasPermission, hasRole, canAccessModule } = usePermissions()
  const { mode, loading: modeLoading, toggleMode, setMenuMode } = useMenuMode()

  const loadUserCustomizedMenu = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Charger le menu personnalisé depuis l'API
      try {
        const response = await fetchTyped<MenuApiResponse>('/user/menu-preferences/custom-menu')

        if (response.success && Array.isArray(response.data)) {
          // Mapper les données pour inclure les préférences personnalisées dans la structure attendue
          const menuItems = response.data.map((item: RawMenuItemData) =>
            mapCustomMenuItemRecursively(item)
          )
          setCustomMenu(menuItems)
        } else {
          setCustomMenu([]) // Menu vierge par défaut
        }
      } catch (_prefsError) {
        // Si les préférences ne se chargent pas, menu vierge
        setCustomMenu([])
      }
    } catch (_err) {
      // Erreur lors du chargement du menu personnalisé
      setCustomMenu([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStandardMenu = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Pour le menu standard, utiliser la configuration active de la base de données
      // MAIS sans les préférences utilisateur personnalisées
      const response = await fetchTyped<MenuConfigResponse>('/admin/menu-raw/configurations/active')

      // La réponse de fetchTyped enveloppe les données dans response.data
      const apiResponse = (response as any).data || response

      if (apiResponse.success && apiResponse.data) {
        // Utiliser le menuTree de la configuration active
        const menuItems = Array.isArray(apiResponse.data.menuTree) ? apiResponse.data.menuTree : []
        setStandardMenu(menuItems)
        setMenuConfig(apiResponse.data.configuration)
      } else {
        setStandardMenu([])
      }
    } catch (_err) {
      // Erreur lors du chargement du menu standard
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadActiveMenuConfig = useCallback(async () => {
    // Cette fonction fait maintenant la même chose que loadStandardMenu
    return loadStandardMenu()
  }, [loadStandardMenu])

  const canUserAccessItem = useCallback(
    (item: MenuItemConfig): boolean => {
      // Si l'item n'est pas visible, ne pas l'afficher
      if (!item.isVisible) {
        return false
      }

      // Si aucune restriction, autoriser l'accès
      if (
        (!item.roles || item?.roles?.length === 0) &&
        (!item.permissions || item?.permissions?.length === 0)
      ) {
        return true
      }

      // Vérifier les rôles
      if (item.roles && item?.roles?.length > 0) {
        const hasRequiredRole = item?.roles?.some((role) => hasRole(role))
        if (!hasRequiredRole) {
          return false
        }
      }

      // Vérifier les permissions
      if (item.permissions && item?.permissions?.length > 0) {
        const hasRequiredPermission = item?.permissions?.some((permission) =>
          hasPermission(permission)
        )
        if (!hasRequiredPermission) {
          return false
        }
      }

      // Vérifier l'accès au module
      if (item.moduleId) {
        const canAccess = canAccessModule(item.moduleId)
        if (!canAccess) {
          return false
        }
      }

      return true
    },
    [hasPermission, hasRole, canAccessModule]
  )

  // Filtrage côté client pour une meilleure performance
  const filterMenuByPermissions = useCallback(
    (items: MenuItemConfig[]): MenuItemConfig[] => {
      // Vérifier que items est bien un tableau
      if (!Array.isArray(items)) {
        return []
      }

      const filtered = items
        .filter((item) => canUserAccessItem(item))
        .map((item) => ({
          ...item,
          children: item.children ? filterMenuByPermissions(item.children) : [],
        }))
        .filter((item) => {
          // Pour les types de menu du nouveau système, adapter la logique
          const hasValidLink =
            item.programId ||
            item.externalUrl ||
            item.queryBuilderId ||
            (item.children && item?.children?.length > 0)
          return hasValidLink
        })

      return filtered
    },
    [canUserAccessItem]
  )

  // Charger le menu approprié seulement une fois au montage ou au changement de mode
  useEffect(() => {
    if (!modeLoading && mode) {
      if (mode === 'custom') {
        loadUserCustomizedMenu()
      } else {
        loadStandardMenu()
      }
    }
  }, [mode, modeLoading, loadStandardMenu, loadUserCustomizedMenu]) // Retirer les fonctions des dépendances pour éviter les re-exécutions

  // Écouter les changements de préférences de menu
  useEffect(() => {
    const handleMenuPreferencesChange = async (event: Event) => {
      const customEvent = event as CustomEvent
      // Si l'événement contient directement les données du menu, les utiliser
      if (customEvent?.detail?.menuItems && mode === 'custom') {
        const mappedItems = customEvent?.detail?.menuItems?.map((item: RawMenuItemData) =>
          mapCustomMenuItemRecursively(item)
        )
        setCustomMenu(mappedItems)
        setRefreshKey((prev) => prev + 1)
      } else {
        // Sinon, recharger depuis l'API uniquement si nécessaire
        if (mode === 'custom') {
          await loadUserCustomizedMenu()
        } else {
          await loadStandardMenu()
        }
        setRefreshKey((prev) => prev + 1)
      }
    }

    window.addEventListener('menuPreferencesChanged', handleMenuPreferencesChange)

    return () => {
      window.removeEventListener('menuPreferencesChanged', handleMenuPreferencesChange)
    }
  }, [mode, loadStandardMenu, loadUserCustomizedMenu]) // Simplifier les dépendances

  // Effet pour recharger les menus quand la langue change
  useEffect(() => {
    const unsubscribe = translator?.subscribe(() => {
      // Forcer un re-render quand la langue change pour mettre à jour les traductions
      setRefreshKey((prev) => prev + 1)
    })

    return unsubscribe
  }, [])

  // Menu utilisé basé sur le mode sélectionné
  const currentMenu = mode === 'custom' ? customMenu : standardMenu

  // Appliquer le filtrage par permissions seulement au menu standard
  // Le menu custom est déjà filtré côté serveur
  // TEMPORAIRE: Désactiver le filtrage pour tester
  const filteredMenu = mode === 'custom' ? currentMenu : currentMenu // Temporairement sans filtrage: filterMenuByPermissions(currentMenu)

  const refreshMenu = useCallback(() => {
    if (mode === 'custom') {
      return loadUserCustomizedMenu()
    } else {
      return loadStandardMenu()
    }
  }, [mode, loadUserCustomizedMenu, loadStandardMenu])

  return {
    menuConfig,
    filteredMenu,
    standardMenu,
    customMenu,
    currentMode: mode,
    loading: loading || modeLoading,
    error,
    refreshMenu,
    loadActiveMenuConfig,
    loadStandardMenu,
    loadUserCustomizedMenu,
    filterMenuByPermissions,
    canUserAccessItem,
    refreshKey, // Exposer la clé de refresh pour forcer les re-renders
    // Exposer les fonctions de gestion du mode depuis le hook interne
    toggleMode,
    setMenuMode,
    isStandard: mode === 'standard',
    isCustom: mode === 'custom',
  }
}

// Hook simplifié pour obtenir uniquement le menu filtré
export function useMenu() {
  const { filteredMenu, loading, error, refreshMenu } = useDynamicMenu()

  return {
    menu: filteredMenu,
    loading,
    error,
    refreshMenu,
  }
}

// Utilitaires pour convertir les items de menu en format compatible avec la sidebar existante
export function convertToNavItems(menuItems: MenuItemConfig[]): unknown[] {
  return menuItems?.map((item) => {
    // Générer l'URL basée sur le type de menu
    let href: string | undefined

    switch (item.type) {
      case 'P': // Programme
        href = item.programId || item.href
        break
      case 'L': // Lien externe
        href = item.externalUrl
        break
      case 'D': // Vue Data
        href = item.queryBuilderId ? `/query-builder/${item.queryBuilderId}/view` : undefined
        break
      default:
        href = undefined
        break
    }

    return {
      title: item.titleKey || item.title,
      href,
      icon: item.icon,
      badge: item.badge,
      gradient: item.gradient,
      target: item.type === 'L' || item.type === 'D' ? '_blank' : undefined,
      children: item?.children?.length > 0 ? convertToNavItems(item.children) : undefined,
      roles: item.roles,
      menuType: item.type,
      isFolder: item.type === 'M',
      isProgram: item.type === 'P',
      isLink: item.type === 'L',
      isDataView: item.type === 'D',
    }
  })
}

// Hook pour la compatibilité avec l'ancien système
export function useNavigation() {
  const { filteredMenu, loading, error } = useDynamicMenu()

  return {
    navigation: convertToNavItems(filteredMenu),
    loading,
    error,
  }
}
