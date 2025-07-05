/**
 * 🎯 SÉLECTEURS APP OPTIMISÉS - TopSteel ERP
 * Sélecteurs granulaires et robustes pour le store principal
 * Fichier: apps/web/src/stores/selectors/app.selectors.ts
 */
import { createMemoizedSelector, createOptimizedSelectors } from '@/lib/optimized-selectors'
import type { AppState, Projet } from '@erp/types'
import { useAppStore } from '../app.store'

// ===== CRÉATION DES SÉLECTEURS OPTIMISÉS =====
const selectors = createOptimizedSelectors(useAppStore)

// ===== SÉLECTEURS DE BASE =====
/**
 * Sélecteur pour le thème actuel
 */
export const useTheme = () => selectors.useSimple(
  state => state.ui.theme,
  'theme'
)

/**
 * Sélecteur pour l'utilisateur connecté
 */
export const useUser = () => selectors.useSafe(
  state => state.user,
  null,
  'user'
)

/**
 * Sélecteur pour l'état de chargement global
 */
export const useLoading = () => selectors.useSimple(
  state => state.loading,
  'loading'
)

/**
 * Sélecteur pour l'erreur globale
 */
export const useError = () => selectors.useSafe(
  state => state.error,
  null,
  'error'
)

// ===== SÉLECTEURS UI OPTIMISÉS =====
/**
 * Sélecteur optimisé pour les paramètres UI
 * Utilise shallow comparison pour éviter les re-renders inutiles
 */
export const useUISettings = () => selectors.useShallow(
  state => ({
    sidebarCollapsed: state.ui.sidebarCollapsed,
    sidebarPinned: state.ui.sidebarPinned,
    layoutMode: state.ui.layoutMode,
    activeModule: state.ui.activeModule,
    showTooltips: state.ui.showTooltips,
    theme: state.ui.theme,
    language: state.ui.language
  }),
  'ui-settings'
)

/**
 * Sélecteur pour la barre latérale uniquement
 */
export const useSidebarSettings = () => selectors.useShallow(
  state => ({
    collapsed: state.ui.sidebarCollapsed,
    pinned: state.ui.sidebarPinned
  }),
  'sidebar-settings'
)

/**
 * Sélecteur pour le module actif et le mode layout
 */
export const useLayoutSettings = () => selectors.useShallow(
  state => ({
    activeModule: state.ui.activeModule,
    layoutMode: state.ui.layoutMode
  }),
  'layout-settings'
)

// ===== SÉLECTEURS AUTHENTIFICATION =====
/**
 * Sélecteur pour l'état d'authentification complet
 */
export const useAuthState = () => selectors.useShallow(
  state => ({
    user: state.user,
    session: state.session,
    isAuthenticated: !!(state.user && state.session),
    permissions: state.permissions,
    isSessionValid: !!(
      state.session && 
      state.session.expiresAt && 
      state.session.expiresAt > Date.now()
    )
  }),
  'auth-state'
)

/**
 * Sélecteur simple pour l'état d'authentification
 */
export const useIsAuthenticated = () => selectors.useSimple(
  state => !!(state.user && state.session),
  'is-authenticated'
)

/**
 * Sélecteur pour les permissions utilisateur
 */
export const useUserPermissions = () => selectors.useSafe(
  state => state.permissions,
  [],
  'user-permissions'
)

// ===== SÉLECTEURS PROJETS OPTIMISÉS =====
/**
 * Sélecteur pour la liste des projets avec valeur par défaut
 */
export const useProjets = () => selectors.useSafe(
  state => state.projets,
  [],
  'projets'
)

/**
 * Sélecteur pour le projet sélectionné
 */
export const useSelectedProjet = () => selectors.useSafe(
  state => state.selectedProjet,
  null,
  'selected-projet'
)

/**
 * Sélecteur mémoïsé pour les projets actifs
 */
const activeProjetsSelector = createMemoizedSelector(
  (state: AppState) => state.projets.filter(p => 
    p.statut === 'EN_COURS' || p.statut === 'ACCEPTE'
  ),
  { ttl: 2000 }
)

export const useActiveProjets = () => selectors.useShallow(
  activeProjetsSelector,
  'active-projets'
)

/**
 * Sélecteur pour les projets terminés
 */
export const useCompletedProjets = () => selectors.useFiltered(
  state => state.projets,
  (projet: Projet) => projet.statut === 'TERMINE',
  'completed-projets'
)

/**
 * Sélecteur pour les projets en attente
 */
export const usePendingProjets = () => selectors.useFiltered(
  state => state.projets,
  (projet: Projet) => projet.statut === 'EN_ATTENTE' || projet.statut === 'DEVIS',
  'pending-projets'
)

/**
 * Sélecteur pour le nombre de projets actifs
 */
export const useActiveProjectsCount = () => selectors.useTransformed(
  activeProjetsSelector,
  projets => projets.length,
  { debugLabel: 'active-projects-count' }
)

/**
 * Sélecteur pour le nombre total de projets
 */
export const useProjectsCount = () => selectors.useTransformed(
  state => state.projets,
  projets => projets.length,
  { debugLabel: 'projects-count' }
)

/**
 * Sélecteur pour les projets avec filtres appliqués
 */
export const useFilteredProjets = () => {
  const projets = useProjets()
  const filters = useProjectFilters()
  
  return selectors.useMemoized(
    (state: AppState) => {
      let filteredProjets = state.projets

      if (!filters || Object.keys(filters).length === 0) {
        return filteredProjets
      }

      // Filtre par statut
      if (filters.statut?.length) {
        filteredProjets = filteredProjets.filter(p => 
          filters.statut!.includes(p.statut)
        )
      }

      // Filtre par priorité
      if (filters.priorite?.length) {
        filteredProjets = filteredProjets.filter(p => 
          filters.priorite!.includes(p.priorite)
        )
      }

      // Filtre par recherche textuelle
      if (filters.search?.trim()) {
        const searchTerm = filters.search.toLowerCase().trim()
        filteredProjets = filteredProjets.filter(p => 
          p.nom?.toLowerCase().includes(searchTerm) ||
          p.description?.toLowerCase().includes(searchTerm) ||
          p.reference?.toLowerCase().includes(searchTerm) ||
          p.client?.nom?.toLowerCase().includes(searchTerm)
        )
      }

      // Filtre par responsable
      if (filters.responsable?.length) {
        filteredProjets = filteredProjets.filter(p => 
          p.responsable && filters.responsable!.includes(p.responsable.id)
        )
      }

      // Filtre par dates
      if (filters.dateDebut?.from) {
        const fromDate = new Date(filters.dateDebut.from)
        filteredProjets = filteredProjets.filter(p => 
          p.dateDebut && new Date(p.dateDebut) >= fromDate
        )
      }

      if (filters.dateDebut?.to) {
        const toDate = new Date(filters.dateDebut.to)
        filteredProjets = filteredProjets.filter(p => 
          p.dateDebut && new Date(p.dateDebut) <= toDate
        )
      }

      return filteredProjets
    },
    'filtered-projets',
    { ttl: 1000 }
  )
}

// ===== SÉLECTEURS NOTIFICATIONS =====
/**
 * Sélecteur pour les notifications
 */
export const useNotifications = () => selectors.useSafe(
  state => state.notifications.notifications,
  [],
  'notifications'
)

/**
 * Sélecteur pour le nombre de notifications non lues
 */
export const useUnreadNotificationsCount = () => selectors.useSimple(
  state => state.notifications.unreadCount,
  'unread-notifications-count'
)

/**
 * Sélecteur pour les notifications critiques
 */
export const useCriticalNotifications = () => selectors.useFiltered(
  state => state.notifications.notifications,
  notification => !notification.read && 
    (notification.priority === 'high' || notification.priority === 'urgent'),
  'critical-notifications'
)

/**
 * Sélecteur pour les paramètres de notifications
 */
export const useNotificationSettings = () => selectors.useShallow(
  state => state.notifications.settings,
  'notification-settings'
)

// ===== SÉLECTEURS FILTRES =====
/**
 * Sélecteur pour les filtres de projets
 */
export const useProjectFilters = () => selectors.useSafe(
  state => state.filters.projets,
  {},
  'project-filters'
)

/**
 * Sélecteur pour les filtres globaux
 */
export const useGlobalFilters = () => selectors.useSafe(
  state => state.filters.global,
  { activeFilters: [] },
  'global-filters'
)

/**
 * Sélecteur pour la recherche globale
 */
export const useGlobalSearch = () => selectors.useSafe(
  state => state.filters.global?.search,
  '',
  'global-search'
)

// ===== SÉLECTEURS MÉTRIQUES =====
/**
 * Sélecteur pour les métriques de base
 */
export const useBasicMetrics = () => selectors.useShallow(
  state => ({
    pageViews: state.metrics.pageViews,
    actionCount: state.metrics.actionCount,
    errorCount: state.metrics.errorCount,
    sessionDuration: Date.now() - state.metrics.sessionStart
  }),
  'basic-metrics'
)

/**
 * Sélecteur pour les métriques de performance
 */
export const usePerformanceMetrics = () => selectors.useShallow(
  state => ({
    ...state.metrics.performanceMetrics,
    sessionDuration: Date.now() - state.metrics.sessionStart,
    activityScore: state.metrics.actionCount / Math.max(1, state.metrics.pageViews),
    errorRate: state.metrics.errorCount / Math.max(1, state.metrics.actionCount)
  }),
  'performance-metrics'
)

// ===== SÉLECTEURS SYNCHRONISATION =====
/**
 * Sélecteur pour l'état de synchronisation
 */
export const useSyncState = () => selectors.useShallow(
  state => state.sync,
  'sync-state'
)

/**
 * Sélecteur pour l'état en ligne
 */
export const useOnlineStatus = () => selectors.useSimple(
  state => state.sync.isOnline,
  'online-status'
)

/**
 * Sélecteur pour les changements en attente
 */
export const usePendingChanges = () => selectors.useSimple(
  state => state.sync.pendingChanges,
  'pending-changes'
)

// ===== SÉLECTEURS COMBINÉS AVANCÉS =====
/**
 * Sélecteur pour le tableau de bord principal
 */
export const useDashboardData = () => selectors.useShallow(
  state => {
    const activeProjets = state.projets.filter(p => 
      p.statut === 'EN_COURS' || p.statut === 'ACCEPTE'
    )
    const criticalNotifications = state.notifications.notifications.filter(n => 
      !n.read && (n.priority === 'high' || n.priority === 'urgent')
    )

    return {
      user: state.user,
      activeProjectsCount: activeProjets.length,
      totalProjectsCount: state.projets.length,
      criticalNotificationsCount: criticalNotifications.length,
      unreadNotificationsCount: state.notifications.unreadCount,
      isOnline: state.sync.isOnline,
      pendingChanges: state.sync.pendingChanges,
      theme: state.ui.theme,
      loading: state.loading,
      error: state.error
    }
  },
  'dashboard-data'
)

/**
 * Sélecteur pour les statistiques des projets
 */
export const useProjectsStats = () => selectors.useMemoized(
  (state: AppState) => {
    const projets = state.projets
    
    const stats = {
      total: projets.length,
      parStatut: {} as Record<string, number>,
      parPriorite: {} as Record<string, number>,
      montantTotal: 0,
      avancementMoyen: 0
    }

    projets.forEach(projet => {
      // Compter par statut
      stats.parStatut[projet.statut] = (stats.parStatut[projet.statut] || 0) + 1
      
      // Compter par priorité
      stats.parPriorite[projet.priorite] = (stats.parPriorite[projet.priorite] || 0) + 1
      
      // Calculer montant total
      stats.montantTotal += projet.montantHT || 0
      
      // Calculer avancement moyen
      stats.avancementMoyen += projet.avancement || 0
    })

    if (projets.length > 0) {
      stats.avancementMoyen = stats.avancementMoyen / projets.length
    }

    return stats
  },
  'projects-stats',
  { ttl: 5000 }
)

// ===== HOOKS DE CONVENANCE =====
/**
 * Hook pour vérifier une permission spécifique
 */
export const useHasPermission = (permission: string): boolean => {
  const permissions = useUserPermissions()
  return permissions.includes(permission) || permissions.includes('admin')
}

/**
 * Hook pour vérifier plusieurs permissions
 */
export const useHasPermissions = (requiredPermissions: string[]): boolean => {
  const permissions = useUserPermissions()
  const isAdmin = permissions.includes('admin')
  
  if (isAdmin) return true
  
  return requiredPermissions.every(permission => 
    permissions.includes(permission)
  )
}

/**
 * Hook pour obtenir les projets accessibles selon les permissions
 */
export const useAccessibleProjets = () => {
  const projets = useProjets()
  const user = useUser()
  const permissions = useUserPermissions()
  
  return selectors.useMemoized(
    () => {
      if (!user) return []
      
      // Admin a accès à tout
      if (permissions.includes('admin')) return projets
      
      // Filtrer selon les permissions
      return projets.filter(projet => {
        // Responsable du projet
        if (projet.responsable?.id === user.id) return true
        
        // Permission de lecture globale
        if (permissions.includes('projets:read')) return true
        
        return false
      })
    },
    'accessible-projets',
    { ttl: 2000 }
  )
}

// ===== CLEANUP ET DEBUGGING =====
/**
 * Fonction pour nettoyer tous les caches des sélecteurs
 */
export const clearAllSelectorCaches = () => {
  selectors.clearMemoCache()
}

/**
 * Fonction pour obtenir les statistiques des caches
 */
export const getSelectorCacheStats = () => {
  return selectors.getCacheStats()
}