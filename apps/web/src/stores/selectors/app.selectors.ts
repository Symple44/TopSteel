/**
 * 🎯 SÉLECTEURS APP OPTIMISÉS - TopSteel ERP
 * Sélecteurs granulaires et optimisés pour le store principal
 * Fichier: apps/web/src/stores/selectors/app.selectors.ts
 */
import { createOptimizedSelectors } from '@/lib/optimized-selectors'
import { useAppStore } from '../app.store'

// ===== CRÉATION DES SÉLECTEURS OPTIMISÉS =====
const selectors = createOptimizedSelectors(useAppStore)

// ===== SÉLECTEURS DE BASE =====
/**
 * Sélecteur pour le thème actuel
 */
export const useTheme = () => selectors.useSimple(state => state.theme)

/**
 * Sélecteur pour l'utilisateur connecté
 */
export const useUser = () => selectors.useSimple(state => state.user)

/**
 * Sélecteur pour l'état de chargement global
 */
export const useLoading = () => selectors.useSimple(state => state.loading)

/**
 * Sélecteur pour l'erreur globale
 */
export const useError = () => selectors.useSimple(state => state.error)

// ===== SÉLECTEURS UI AVEC SHALLOW COMPARISON =====
/**
 * Sélecteur optimisé pour les paramètres UI
 * Utilise shallow comparison pour éviter les re-renders inutiles
 */
export const useUISettings = () => selectors.useShallow(state => ({
  sidebarCollapsed: state.ui.sidebarCollapsed,
  sidebarPinned: state.ui.sidebarPinned,
  layoutMode: state.ui.layoutMode,
  activeModule: state.ui.activeModule,
  showTooltips: state.ui.showTooltips
}))

/**
 * Sélecteur pour la barre latérale uniquement
 */
export const useSidebarSettings = () => selectors.useShallow(state => ({
  collapsed: state.ui.sidebarCollapsed,
  pinned: state.ui.sidebarPinned
}))

/**
 * Sélecteur pour le module actif et le mode layout
 */
export const useLayoutSettings = () => selectors.useShallow(state => ({
  activeModule: state.ui.activeModule,
  layoutMode: state.ui.layoutMode
}))

// ===== SÉLECTEURS DE DONNÉES AVEC OPTIMISATIONS =====
/**
 * Sélecteur pour la liste des projets
 * Avec valeur par défaut sécurisée
 */
export const useProjets = () => selectors.useSafe(
  state => state.projets,
  [] // Valeur par défaut
)

/**
 * Sélecteur pour les projets actifs uniquement
 * Avec shallow comparison pour la performance
 */
export const useActiveProjects = () => selectors.useShallow(state => 
  state.projets?.filter(p => p.statut === 'EN_COURS') || []
)

/**
 * Sélecteur pour les projets terminés
 */
export const useCompletedProjects = () => selectors.useShallow(state => 
  state.projets?.filter(p => p.statut === 'TERMINE') || []
)

/**
 * Sélecteur pour les projets en attente
 */
export const usePendingProjects = () => selectors.useShallow(state => 
  state.projets?.filter(p => p.statut === 'EN_ATTENTE') || []
)

// ===== SÉLECTEURS DE COMPTAGE =====
/**
 * Sélecteur pour le nombre total de projets
 */
export const useProjectsCount = () => selectors.useSimple(state => 
  state.projets?.length || 0
)

/**
 * Sélecteur pour le nombre de projets actifs
 */
export const useActiveProjectsCount = () => selectors.useSimple(state => 
  state.projets?.filter(p => p.statut === 'EN_COURS').length || 0
)

/**
 * Sélecteur pour le nombre de projets terminés
 */
export const useCompletedProjectsCount = () => selectors.useSimple(state => 
  state.projets?.filter(p => p.statut === 'TERMINE').length || 0
)

/**
 * Sélecteur pour les statistiques de projets
 */
export const useProjectStats = () => selectors.useShallow(state => {
  const projets = state.projets || []
  const total = projets.length
  const active = projets.filter(p => p.statut === 'EN_COURS').length
  const completed = projets.filter(p => p.statut === 'TERMINE').length
  const pending = projets.filter(p => p.statut === 'EN_ATTENTE').length
  
  return {
    total,
    active,
    completed,
    pending,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  }
})

// ===== SÉLECTEURS DE NOTIFICATIONS =====
/**
 * Sélecteur pour toutes les notifications
 */
export const useNotifications = () => selectors.useShallow(state => 
  state.notifications || []
)

/**
 * Sélecteur pour les notifications non lues
 */
export const useUnreadNotifications = () => selectors.useShallow(state => 
  state.notifications?.filter(n => !n.read) || []
)

/**
 * Sélecteur pour le nombre de notifications non lues
 */
export const useUnreadNotificationsCount = () => selectors.useSimple(state => 
  state.notifications?.filter(n => !n.read).length || 0
)

/**
 * Sélecteur pour les notifications par type
 */
export const useNotificationsByType = (type: string) => selectors.useShallow(state => 
  state.notifications?.filter(n => n.type === type) || []
)

// ===== SÉLECTEURS DE FILTRES =====
/**
 * Sélecteur pour les filtres de projets
 */
export const useProjectFilters = () => selectors.useShallow(state => 
  state.filters?.projets || {}
)

/**
 * Sélecteur pour les filtres de stocks
 */
export const useStockFilters = () => selectors.useShallow(state => 
  state.filters?.stocks || {}
)

/**
 * Sélecteur pour les filtres de production
 */
export const useProductionFilters = () => selectors.useShallow(state => 
  state.filters?.production || {}
)

// ===== SÉLECTEURS D'AUTHENTIFICATION =====
/**
 * Sélecteur pour vérifier si l'utilisateur est connecté
 */
export const useIsAuthenticated = () => selectors.useSimple(state => 
  !!state.user && !!state.session?.token
)

/**
 * Sélecteur pour les permissions utilisateur
 */
export const useUserPermissions = () => selectors.useShallow(state => 
  state.user?.permissions || []
)

/**
 * Sélecteur pour vérifier une permission spécifique
 */
export const useHasPermission = (permission: string) => selectors.useSimple(state => 
  state.user?.permissions?.includes(permission) || false
)

/**
 * Sélecteur pour les informations de session
 */
export const useSessionInfo = () => selectors.useShallow(state => ({
  isValid: !!state.session?.token && Date.now() < (state.session?.expiresAt || 0),
  expiresAt: state.session?.expiresAt,
  token: state.session?.token,
  timeLeft: state.session?.expiresAt ? Math.max(0, state.session.expiresAt - Date.now()) : 0
}))

// ===== SÉLECTEURS MÉTRIQUES =====
/**
 * Sélecteur pour les métriques d'utilisation
 */
export const useUsageMetrics = () => selectors.useShallow(state => ({
  pageViews: state.metrics.pageViews,
  actionCount: state.metrics.actionCount,
  lastActivity: state.metrics.lastActivity,
  sessionDuration: Date.now() - state.metrics.sessionStart
}))

/**
 * Sélecteur pour l'activité récente
 */
export const useRecentActivity = () => selectors.useSimple(state => {
  const timeSinceLastActivity = Date.now() - state.metrics.lastActivity
  return {
    isActive: timeSinceLastActivity < 300000, // 5 minutes
    timeSinceLastActivity,
    lastActivity: state.metrics.lastActivity
  }
})

// ===== SÉLECTEURS TRANSFORMÉS =====
/**
 * Sélecteur avec transformation pour le nom d'affichage de l'utilisateur
 */
export const useUserDisplayName = () => selectors.useTransformed(
  state => state.user,
  user => user ? `${user.prenom} ${user.nom}` : 'Utilisateur inconnu'
)

/**
 * Sélecteur avec transformation pour les projets urgents
 */
export const useUrgentProjects = () => selectors.useTransformed(
  state => state.projets,
  projets => projets?.filter(p => {
    if (p.statut === 'TERMINE') return false
    if (p.priorite === 'urgente') return true
    
    // Projets proches de l'échéance (moins de 7 jours)
    const echeance = new Date(p.dateEcheance).getTime()
    const maintenant = Date.now()
    const septJours = 7 * 24 * 60 * 60 * 1000
    
    return (echeance - maintenant) < septJours && (echeance - maintenant) > 0
  }) || []
)

/**
 * Sélecteur avec transformation pour les projets en retard
 */
export const useOverdueProjects = () => selectors.useTransformed(
  state => state.projets,
  projets => projets?.filter(p => {
    if (p.statut === 'TERMINE') return false
    const echeance = new Date(p.dateEcheance).getTime()
    return Date.now() > echeance
  }) || []
)

// ===== SÉLECTEURS COMPOSITES =====
/**
 * Sélecteur composite pour le tableau de bord
 */
export const useDashboardData = () => selectors.useShallow(state => {
  const projets = state.projets || []
  const notifications = state.notifications || []
  
  return {
    // Données utilisateur
    user: state.user,
    isAuthenticated: !!state.user && !!state.session?.token,
    
    // Statistiques projets
    projectStats: {
      total: projets.length,
      active: projets.filter(p => p.statut === 'EN_COURS').length,
      completed: projets.filter(p => p.statut === 'TERMINE').length,
      overdue: projets.filter(p => 
        p.statut !== 'TERMINE' && new Date(p.dateEcheance).getTime() < Date.now()
      ).length
    },
    
    // Notifications
    unreadNotifications: notifications.filter(n => !n.read).length,
    
    // État UI
    ui: {
      sidebarCollapsed: state.ui.sidebarCollapsed,
      activeModule: state.ui.activeModule,
      theme: state.theme
    },
    
    // Dernière activité
    lastActivity: state.metrics.lastActivity
  }
})

/**
 * Sélecteur composite pour la navigation
 */
export const useNavigationData = () => selectors.useShallow(state => ({
  activeModule: state.ui.activeModule,
  sidebarCollapsed: state.ui.sidebarCollapsed,
  sidebarPinned: state.ui.sidebarPinned,
  userPermissions: state.user?.permissions || [],
  unreadNotifications: state.notifications?.filter(n => !n.read).length || 0
}))

// ===== HOOKS COMPOSÉS POUR ACTIONS FRÉQUENTES =====
/**
 * Hook composé pour la gestion de la sidebar
 */
export const useSidebar = () => {
  const { collapsed, pinned } = useSidebarSettings()
  const setSidebarCollapsed = useAppStore(state => state.setSidebarCollapsed)
  const setSidebarPinned = useAppStore(state => state.setSidebarPinned)
  
  return {
    collapsed,
    pinned,
    toggle: () => setSidebarCollapsed(!collapsed),
    pin: () => setSidebarPinned(true),
    unpin: () => setSidebarPinned(false),
    togglePin: () => setSidebarPinned(!pinned)
  }
}

/**
 * Hook composé pour la gestion du thème
 */
export const useThemeManager = () => {
  const theme = useTheme()
  const setTheme = useAppStore(state => state.setTheme)
  
  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light'),
    setLight: () => setTheme('light'),
    setDark: () => setTheme('dark'),
    setAuto: () => setTheme('auto')
  }
}

/**
 * Hook composé pour la gestion des notifications
 */
export const useNotificationManager = () => {
  const notifications = useNotifications()
  const unreadCount = useUnreadNotificationsCount()
  const addNotification = useAppStore(state => state.addNotification)
  const removeNotification = useAppStore(state => state.removeNotification)
  const clearNotifications = useAppStore(state => state.clearNotifications)
  
  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    clearNotifications,
    markAsRead: (id: string) => {
      // Cette fonctionnalité pourrait être ajoutée au store
      console.log('Mark as read:', id)
    }
  }
}