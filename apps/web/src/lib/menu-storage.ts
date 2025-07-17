// Stockage persistant utilisant localStorage comme fallback
import { syncChecker } from './sync-checker'

// Clés de stockage
const SELECTED_PAGES_KEY = 'topsteel-selected-pages'
const USER_PREFERENCES_KEY = 'topsteel-user-preferences'

// Stockage en mémoire (fallback)
let memorySelectedPages: Record<string, string[]> = {
  'current-user': ['main-dashboard', 'production-overview'] // Données de test par défaut
}
let memoryPreferences: Record<string, any> = {}

// Fonctions de stockage hybride (mémoire + localStorage)
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue // Côté serveur, utiliser la valeur par défaut
  }
  
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const parsed = JSON.parse(stored)
      console.log(`[MenuStorage] Chargé depuis localStorage:`, key, parsed)
      return parsed
    }
  } catch (error) {
    console.warn(`[MenuStorage] Erreur lecture localStorage ${key}:`, error)
    syncChecker.addIssue({
      type: 'storage',
      severity: 'medium',
      message: `Impossible de lire ${key} depuis localStorage`,
      details: { key, error: error.message }
    })
  }
  
  return defaultValue
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return // Côté serveur, ne pas sauvegarder
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value))
    console.log(`[MenuStorage] Sauvé dans localStorage:`, key, value)
  } catch (error) {
    console.warn(`[MenuStorage] Erreur écriture localStorage ${key}:`, error)
    syncChecker.addIssue({
      type: 'storage',
      severity: 'high',
      message: `Impossible de sauvegarder ${key} dans localStorage`,
      details: { key, value, error: error.message }
    })
  }
}

// Initialiser depuis localStorage au démarrage
if (typeof window !== 'undefined') {
  memorySelectedPages = loadFromStorage(SELECTED_PAGES_KEY, memorySelectedPages)
  memoryPreferences = loadFromStorage(USER_PREFERENCES_KEY, memoryPreferences)
}

// Fonctions utilitaires pour gérer le stockage
export const menuStorage = {
  // Pages sélectionnées
  getSelectedPages: (userId: string): string[] => {
    const pages = memorySelectedPages[userId] || []
    console.log(`[MenuStorage] Récupération pages pour ${userId}:`, pages)
    return pages
  },
  
  setSelectedPages: (userId: string, pages: string[]): void => {
    memorySelectedPages[userId] = pages
    saveToStorage(SELECTED_PAGES_KEY, memorySelectedPages)
    console.log(`[MenuStorage] Pages sélectionnées mises à jour pour ${userId}:`, pages)
    
    // Vérifier la synchronisation
    const stored = loadFromStorage(SELECTED_PAGES_KEY, {})
    syncChecker.checkStorageConsistency('selected-pages', memorySelectedPages, stored)
  },
  
  // Préférences utilisateur
  getUserPreferences: (userId: string): any => {
    const prefs = memoryPreferences[userId] || getDefaultPreferences()
    console.log(`[MenuStorage] Récupération préférences pour ${userId}:`, prefs)
    return prefs
  },
  
  setUserPreferences: (userId: string, prefs: any): void => {
    memoryPreferences[userId] = prefs
    saveToStorage(USER_PREFERENCES_KEY, memoryPreferences)
    console.log(`[MenuStorage] Préférences mises à jour pour ${userId}:`, prefs)
    
    // Vérifier la synchronisation
    const stored = loadFromStorage(USER_PREFERENCES_KEY, {})
    syncChecker.checkStorageConsistency('user-preferences', memoryPreferences, stored)
  },
  
  // Réinitialiser pour un utilisateur
  resetUser: (userId: string): void => {
    memorySelectedPages[userId] = []
    memoryPreferences[userId] = getDefaultPreferences()
    
    // Sauvegarder les changements
    saveToStorage(SELECTED_PAGES_KEY, memorySelectedPages)
    saveToStorage(USER_PREFERENCES_KEY, memoryPreferences)
    
    console.log(`[MenuStorage] Données réinitialisées pour ${userId}`)
    
    syncChecker.addIssue({
      type: 'menu',
      severity: 'low',
      message: `Données réinitialisées pour l'utilisateur ${userId}`,
      details: { userId, action: 'reset' }
    })
  }
}

function getDefaultPreferences() {
  return {
    id: '1',
    userId: 'current-user',
    useCustomLayout: false,
    layoutType: 'standard',
    showIcons: true,
    showBadges: true,
    allowCollapse: true,
    theme: 'auto',
    favoriteItems: [],
    hiddenItems: [],
    pinnedItems: [],
    customOrder: {},
    shortcuts: []
  }
}

// Toutes les pages disponibles (structure simplifiée)
export const allAvailablePages = [
  // Dashboard
  { id: 'main-dashboard', title: 'Accueil', href: '/dashboard', icon: 'Home', category: 'dashboard' },
  { id: 'analytics-dashboard', title: 'Analyses', href: '/dashboard/analytics', icon: 'BarChart3', category: 'dashboard' },
  
  // Production
  { id: 'production-overview', title: 'Production', href: '/production', icon: 'Factory', category: 'production' },
  { id: 'production-planning', title: 'Planification', href: '/production/planning', icon: 'Calendar', category: 'production' },
  { id: 'quality-control', title: 'Contrôle qualité', href: '/production/quality', icon: 'Shield', category: 'production' },
  
  // Inventory
  { id: 'inventory-overview', title: 'Inventaire', href: '/inventory', icon: 'Package', category: 'inventory' },
  { id: 'inventory-movements', title: 'Mouvements', href: '/inventory/movements', icon: 'ArrowUpDown', category: 'inventory' },
  { id: 'suppliers', title: 'Fournisseurs', href: '/inventory/suppliers', icon: 'Truck', category: 'inventory' },
  
  // Sales
  { id: 'sales-overview', title: 'Ventes', href: '/sales', icon: 'TrendingUp', category: 'sales' },
  { id: 'customers', title: 'Clients', href: '/sales/customers', icon: 'Users', category: 'sales' },
  { id: 'orders', title: 'Commandes', href: '/sales/orders', icon: 'FileText', category: 'sales' },
  { id: 'quotations', title: 'Devis', href: '/sales/quotations', icon: 'FileBarChart', category: 'sales' },
  
  // Finance
  { id: 'finance-overview', title: 'Finance', href: '/finance', icon: 'PieChart', category: 'finance' },
  { id: 'invoicing', title: 'Facturation', href: '/finance/invoicing', icon: 'Receipt', category: 'finance' },
  { id: 'payments', title: 'Paiements', href: '/finance/payments', icon: 'CreditCard', category: 'finance' },
  
  // HR
  { id: 'employees', title: 'Employés', href: '/hr/employees', icon: 'Users', category: 'hr' },
  { id: 'attendance', title: 'Présences', href: '/hr/attendance', icon: 'Clock', category: 'hr' },
  { id: 'training', title: 'Formations', href: '/hr/training', icon: 'GraduationCap', category: 'hr' },
  
  // Administration
  { id: 'users', title: 'Utilisateurs', href: '/admin/users', icon: 'Users', category: 'administration' },
  { id: 'roles', title: 'Rôles', href: '/admin/roles', icon: 'Shield', category: 'administration' },
  { id: 'system-settings', title: 'Paramètres', href: '/admin/settings', icon: 'Cog', category: 'administration' },
  { id: 'notifications', title: 'Notifications', href: '/admin/notifications', icon: 'Bell', category: 'administration' },
  
  // Reports
  { id: 'production-reports', title: 'Rapports Production', href: '/reports/production', icon: 'Factory', category: 'reports' },
  { id: 'sales-reports', title: 'Rapports Ventes', href: '/reports/sales', icon: 'TrendingUp', category: 'reports' },
  { id: 'financial-reports', title: 'Rapports Finance', href: '/reports/finance', icon: 'PieChart', category: 'reports' }
]