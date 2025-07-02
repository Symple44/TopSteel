// apps/web/src/stores/index.ts
export { useAuthStore } from './auth.store'
export { useProjetStore } from './projet.store'
export { useUIStore } from './ui.store'

export { useAuth, useCurrentUser, useIsAuthenticated } from '@/hooks/use-auth'
export { useProjets, useProjet } from '@/hooks/use-projets'
export { useUI, useToasts, useSidebar } from '@/hooks/use-ui'