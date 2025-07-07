/**
 * 🎯 SÉLECTEURS APP OPTIMISÉS CORRIGÉS - TopSteel ERP
 * Sélecteurs granulaires et robustes pour le store principal avec typage strict
 * Fichier: apps/web/src/stores/selectors/app.selectors.ts
 */
import { createMemoizedSelector, createOptimizedSelectors } from '@/lib/optimized-selectors'
import type { AppState, StoreProjet } from '@erp/types'
import { useAppStore } from '../app.store'

// ===== CRÉATION DES SÉLECTEURS OPTIMISÉS TYPÉS =====
const selectors = createOptimizedSelectors<AppState>(useAppStore)

// ===== SÉLECTEURS DE BASE =====
/**
 * Sélecteur pour le thème actuel
 */
export const useTheme = () => selectors.useSimple(
  (state: AppState) => state.theme,
  'theme'
)

/**
 * Sélecteur pour l'utilisateur connecté
 */
export const useUser = () => selectors.useSafe(
  (state: AppState) => state.user,
  null,
  'user'
)

/**
 * Sélecteur pour l'état de chargement global
 */
export const useLoading = () => selectors.useSimple(
  (state: AppState) => state.loading,
  'loading'
)

/**
 * Sélecteur pour l'erreur globale
 */
export const useError = () => selectors.useSafe(
  (state: AppState) => state.error,
  null,
  'error'
)

// ===== SÉLECTEURS UI OPTIMISÉS =====
/**
 * Sélecteur optimisé pour les paramètres UI
 * Utilise shallow comparison pour éviter les re-renders inutiles
 */
export const useUISettings = () => selectors.useShallow(
  (state: AppState) => ({
    sidebarCollapsed: state.ui?.sidebarCollapsed ?? false,
    sidebarPinned: state.ui?.sidebarPinned ?? true,
    layoutMode: state.ui?.layoutMode ?? 'default',
    activeModule: state.ui?.activeModule ?? null,
    showTooltips: state.ui?.showTooltips ?? true,
    theme: state.theme,
  }),
  'ui-settings'
)

/**
 * Sélecteur pour la barre latérale uniquement
 */
export const useSidebarSettings = () => selectors.useShallow(
  (state: AppState) => ({
    collapsed: state.ui?.sidebarCollapsed ?? false,
    pinned: state.ui?.sidebarPinned ?? true
  }),
  'sidebar-settings'
)

/**
 * Sélecteur pour le module actif et le mode layout
 */
export const useLayoutSettings = () => selectors.useShallow(
  (state: AppState) => ({
    activeModule: state.ui?.activeModule ?? null,
    layoutMode: state.ui?.layoutMode ?? 'default'
  }),
  'layout-settings'
)

// ===== SÉLECTEURS AUTHENTIFICATION =====
/**
 * Sélecteur pour l'état d'authentification complet
 */
export const useAuthState = () => selectors.useShallow(
  (state: AppState) => ({
    user: state.user,
    session: state.session,
    isAuthenticated: !!(state.user && state.session),
    permissions: state.permissions || [],
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
  (state: AppState) => !!(state.user && state.session),
  'is-authenticated'
)

/**
 * Sélecteur pour les permissions utilisateur
 */
export const useUserPermissions = () => selectors.useSafe(
  (state: AppState) => state.permissions,
  [],
  'user-permissions'
)

// ===== SÉLECTEURS PROJETS OPTIMISÉS =====
/**
 * Sélecteur pour la liste des projets avec valeur par défaut
 */
export const useProjets = () => selectors.useSafe(
  (state: AppState) => state.projets,
  [],
  'projets'
)

/**
 * Sélecteur pour le projet sélectionné
 */
export const useSelectedProjet = () => selectors.useSafe(
  (state: AppState) => state.selectedProjet,
  null,
  'selected-projet'
)

/**
 * Sélecteur mémoïsé pour les projets actifs
 */
const activeProjetsSelector = createMemoizedSelector(
  (state: AppState) => state.projets?.filter(p => 
    p.statut === 'en_cours' || p.statut === 'accepte'
  ) || [],
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
  (state: AppState) => state.projets || [],
  (projet: StoreProjet) => projet.statut === 'termine',
  'completed-projets'
)

/**
 * Sélecteur pour les projets en attente
 */
export const usePendingProjets = () => selectors.useFiltered(
  (state: AppState) => state.projets || [],
  (projet: StoreProjet) => projet.statut === 'en_attente' || projet.statut === 'devis',
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
  (state: AppState) => state.projets || [],
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
      const allProjets = state.projets || []
      const currentFilters = state.filters?.projets || {}
      
      if (Object.keys(currentFilters).length === 0) {
        return allProjets
      }
      
      return allProjets.filter(projet => {
        // Appliquer les filtres
        if (currentFilters.statut && projet.statut !== currentFilters.statut) {
          return false
        }
        if (currentFilters.priorite && projet.priorite !== currentFilters.priorite) {
          return false
        }
        if (currentFilters.type && projet.type !== currentFilters.type) {
          return false
        }
        if (currentFilters.search) {
          const searchTerm = currentFilters.search.toLowerCase()

          return projet.reference?.toLowerCase().includes(searchTerm) ||
                 projet.description?.toLowerCase().includes(searchTerm)
        }

        return true
      })
    },
    {
      ttl: 1000,
      debugLabel: 'filtered-projets'
    }
  )
}

// ===== SÉLECTEURS NOTIFICATIONS =====
/**
 * Sélecteur pour le nombre de notifications non lues
 */
export const useUnreadNotificationsCount = () => selectors.useTransformed(
  (state: AppState) => state.notifications || [],
  notifications => notifications.filter(n => !n.read).length,
  { debugLabel: 'unread-notifications-count' }
)

/**
 * Sélecteur pour les notifications critiques
 */
export const useCriticalNotifications = () => selectors.useFiltered(
  (state: AppState) => state.notifications || [],
  notification => !notification.read && notification.type === 'error',
  'critical-notifications'
)

// ===== SÉLECTEURS FILTRES =====
/**
 * Sélecteur pour les filtres de projets
 */
export const useProjectFilters = () => selectors.useSafe(
  (state: AppState) => state.filters?.projets || {},
  {},
  'project-filters'
)

/**
 * Sélecteur pour les filtres globaux
 */
export const useGlobalFilters = () => selectors.useSafe(
  (state: AppState) => state.filters || {},
  {},
  'global-filters'
)

// ===== SÉLECTEURS MÉTRIQUES =====
/**
 * Sélecteur pour les métriques de base
 */
export const useBasicMetrics = () => selectors.useShallow(
  (state: AppState) => ({
    pageViews: state.metrics?.pageViews || 0,
    actionCount: state.metrics?.actionCount || 0,
    lastActivity: state.metrics?.lastActivity || Date.now(),
    sessionDuration: Date.now() - (state.metrics?.sessionStart || Date.now())
  }),
  'basic-metrics'
)

/**
 * Sélecteur pour les métriques de performance
 */
export const usePerformanceMetrics = () => selectors.useShallow(
  (state: AppState) => {
    const metrics = state.metrics

    if (!metrics) {
      return {
        loadTime: 0,
        errorRate: 0,
        uptime: 100,
        sessionDuration: 0,
        activityScore: 0
      }
    }
    
    return {
      loadTime: metrics.performance?.loadTime || 0,
      errorRate: metrics.performance?.errorRate || 0,
      uptime: metrics.performance?.uptime || 100,
      sessionDuration: Date.now() - metrics.sessionStart,
      activityScore: metrics.actionCount / Math.max(1, metrics.pageViews)
    }
  },
  'performance-metrics'
)

// ===== SÉLECTEURS SYNCHRONISATION =====
/**
 * Sélecteur pour l'état de synchronisation
 */
export const useSyncState = () => selectors.useShallow(
  (state: AppState) => state.sync || {
    isOnline: navigator?.onLine ?? true,
    pendingChanges: 0,
    lastSync: Date.now(),
    conflictCount: 0,
    syncInProgress: false,
    autoSyncEnabled: true
  },
  'sync-state'
)

/**
 * Sélecteur pour l'état en ligne
 */
export const useOnlineStatus = () => selectors.useSimple(
  (state: AppState) => state.sync?.isOnline ?? navigator?.onLine ?? true,
  'online-status'
)

/**
 * Sélecteur pour les changements en attente
 */
export const usePendingChanges = () => selectors.useSimple(
  (state: AppState) => state.sync?.pendingChanges || 0,
  'pending-changes'
)

// ===== SÉLECTEURS COMBINÉS AVANCÉS =====
/**
 * Sélecteur pour le tableau de bord principal
 */
export const useDashboardData = () => selectors.useShallow(
  (state: AppState) => {
    const projets = state.projets || []
    const notifications = state.notifications || []
    
    const activeProjets = projets.filter(p => 
      p.statut === 'en_cours' || p.statut === 'accepte'
    )
    const criticalNotifications = notifications.filter(n => 
      !n.read && n.type === 'error'
    )

    return {
      user: state.user,
      activeProjectsCount: activeProjets.length,
      totalProjectsCount: projets.length,
      criticalNotificationsCount: criticalNotifications.length,
      unreadNotificationsCount: notifications.filter(n => !n.read).length,
      isOnline: state.sync?.isOnline ?? true,
      pendingChanges: state.sync?.pendingChanges || 0,
      theme: state.theme,
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
    const projets = state.projets || []
    
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
      if (projet.montantTTC) {
        stats.montantTotal += projet.montantTTC
      }
      
      // Calculer avancement moyen
      if (projet.avancement !== undefined) {
        stats.avancementMoyen += projet.avancement
      }
    })

    // Finaliser l'avancement moyen
    if (projets.length > 0) {
      stats.avancementMoyen = stats.avancementMoyen / projets.length
    }

    return stats
  },
  {
    ttl: 10000, // 10 secondes
    debugLabel: 'projects-stats'
  }
)

// ===== EXPORTS COLLECTIFS =====
export const appSelectors = {
  // Base
  useTheme,
  useUser,
  useLoading,
  useError,
  
  // UI
  useUISettings,
  useSidebarSettings,
  useLayoutSettings,
  
  // Auth
  useAuthState,
  useIsAuthenticated,
  useUserPermissions,
  
  // Projets
  useProjets,
  useSelectedProjet,
  useActiveProjets,
  useCompletedProjets,
  usePendingProjets,
  useActiveProjectsCount,
  useProjectsCount,
  useFilteredProjets,
  
  // Notifications
  useUnreadNotificationsCount,
  useCriticalNotifications,
  
  // Filtres
  useProjectFilters,
  useGlobalFilters,
  
  // Métriques
  useBasicMetrics,
  usePerformanceMetrics,
  
  // Sync
  useSyncState,
  useOnlineStatus,
  usePendingChanges,
  
  // Combinés
  useDashboardData,
  useProjectsStats
}

export default appSelectors