// apps/web/src/stores/index.ts - EXPORTS SIMPLIFIES
export { useAuth, useCurrentUser, useIsAuthenticated } from '@/hooks/use-auth'
export { useProjets, useProjet } from '@/hooks/use-projets'
export { useUI, useToasts, useSidebar } from '@/hooks/use-ui'

// Mock exports pour compatibilité
export const useAuthStore = () => ({ user: null })
export const useProjetStore = () => ({ projets: [] })
export const useUIStore = () => ({ dataView: 'table' })
