'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePermissions } from './use-permissions-v2'
import { useMenuMode } from './use-menu-mode'
import { syncChecker } from '@/lib/sync-checker'

export interface MenuItemConfig {
  id: string
  parentId?: string
  title: string
  titleKey?: string
  href?: string
  icon?: string
  gradient?: string
  badge?: string
  orderIndex: number
  isVisible: boolean
  moduleId?: string
  target?: string
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
  const { hasPermission, hasRole, canAccessModule } = usePermissions()
  const { mode, loading: modeLoading } = useMenuMode()

  const loadActiveMenuConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/menu-config/active')
      
      // Vérifier si la réponse est bien du JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('API response is not JSON:', await response.text())
        setError('Format de réponse invalide')
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setMenuConfig(data.data)
      } else {
        setError('Erreur lors du chargement du menu')
      }
    } catch (err) {
      console.error('Erreur lors du chargement du menu:', err)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUserCustomizedMenu = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/menu-preferences/menu')
      
      // Vérifier le statut de la réponse
      if (!response.ok) {
        // API error loading user menu (silenced)
        setCustomMenu([])
        return
      }
      
      // Vérifier si la réponse est bien du JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.warn('API response is not JSON for user menu:', responseText.substring(0, 200))
        setCustomMenu([])
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setCustomMenu(data.data || [])
        
        // Vérifier si le menu a l'air synchronisé
        if (data.data.length === 0 && mode === 'custom') {
          syncChecker.addIssue({
            type: 'menu',
            severity: 'medium',
            message: 'Menu personnalisé vide alors qu\'il devrait contenir des éléments',
            details: { context: 'useDynamicMenu', mode, itemCount: data.data.length }
          })
        }
      } else {
        console.warn('API returned success: false for user menu:', data.message)
        setCustomMenu([])
        
        syncChecker.addIssue({
          type: 'api',
          severity: 'high',
          message: 'Échec du chargement du menu personnalisé',
          details: { message: data.message, context: 'loadUserCustomizedMenu' }
        })
      }
    } catch (err) {
      console.error('Erreur lors du chargement du menu personnalisé:', err)
      setCustomMenu([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStandardMenu = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/menu-config/tree/filtered')
      
      // Vérifier si la réponse est bien du JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        // API response not JSON for standard menu (silenced)
        setStandardMenu([])
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setStandardMenu(data.data)
        setMenuConfig(prev => prev ? {
          ...prev,
          filteredItems: data.data
        } : null)
      }
    } catch (err) {
      console.error('Erreur lors du chargement du menu standard:', err)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtrage côté client pour une meilleure performance
  const filterMenuByPermissions = useCallback((items: MenuItemConfig[]): MenuItemConfig[] => {
    return items
      .filter(item => canUserAccessItem(item))
      .map(item => ({
        ...item,
        children: filterMenuByPermissions(item.children)
      }))
      .filter(item => item.children.length > 0 || item.href) // Garder seulement les items avec enfants ou avec lien
  }, [hasPermission, hasRole, canAccessModule])

  const canUserAccessItem = useCallback((item: MenuItemConfig): boolean => {
    // Si l'item n'est pas visible, ne pas l'afficher
    if (!item.isVisible) {
      return false
    }

    // Si aucune restriction, autoriser l'accès
    if ((!item.roles || item.roles.length === 0) && (!item.permissions || item.permissions.length === 0)) {
      return true
    }

    // Vérifier les rôles
    if (item.roles && item.roles.length > 0) {
      const hasRequiredRole = item.roles.some(role => hasRole(role))
      if (!hasRequiredRole) {
        return false
      }
    }

    // Vérifier les permissions
    if (item.permissions && item.permissions.length > 0) {
      const hasRequiredPermission = item.permissions.some(permission => 
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
  }, [hasPermission, hasRole, canAccessModule])

  // Charger les deux types de menu au montage du composant
  useEffect(() => {
    if (!modeLoading) {
      Promise.all([
        loadStandardMenu(),
        loadUserCustomizedMenu()
      ])
    }
  }, [modeLoading, loadStandardMenu, loadUserCustomizedMenu])

  // Recharger le menu quand le mode change
  useEffect(() => {
    if (!modeLoading && mode) {
      if (mode === 'custom') {
        loadUserCustomizedMenu()
      } else {
        loadStandardMenu()
      }
    }
  }, [mode, modeLoading, loadUserCustomizedMenu, loadStandardMenu])

  // Écouter les changements de préférences de menu
  useEffect(() => {
    const handleMenuPreferencesChange = () => {
      if (mode === 'custom') {
        loadUserCustomizedMenu()
      } else {
        loadStandardMenu()
      }
    }

    window.addEventListener('menuPreferencesChanged', handleMenuPreferencesChange)
    
    return () => {
      window.removeEventListener('menuPreferencesChanged', handleMenuPreferencesChange)
    }
  }, [mode, loadUserCustomizedMenu, loadStandardMenu])

  // Menu utilisé basé sur le mode sélectionné
  const currentMenu = mode === 'custom' ? customMenu : standardMenu
  const filteredMenu = currentMenu


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
    canUserAccessItem
  }
}

// Hook simplifié pour obtenir uniquement le menu filtré
export function useMenu() {
  const { filteredMenu, loading, error, refreshMenu } = useDynamicMenu()
  
  return {
    menu: filteredMenu,
    loading,
    error,
    refreshMenu
  }
}

// Utilitaires pour convertir les items de menu en format compatible avec la sidebar existante
export function convertToNavItems(menuItems: MenuItemConfig[]): any[] {
  return menuItems.map(item => ({
    title: item.titleKey || item.title,
    href: item.href,
    icon: item.icon,
    badge: item.badge,
    gradient: item.gradient,
    children: item.children.length > 0 ? convertToNavItems(item.children) : undefined,
    roles: item.roles
  }))
}

// Hook pour la compatibilité avec l'ancien système
export function useNavigation() {
  const { filteredMenu, loading, error } = useDynamicMenu()
  
  return {
    navigation: convertToNavItems(filteredMenu),
    loading,
    error
  }
}