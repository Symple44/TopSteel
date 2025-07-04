// ===== EXPORTS UI PACKAGE - SANS CONFLITS NAMESPACE =====
// packages/ui/src/index.ts

// ===== COMPOSANTS PRINCIPAUX =====
// Export des composants sans leurs variants pour éviter les conflits
export { Badge } from './components/badge'
export { Button } from './components/button'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/card'
export { DataTable } from './components/data-table'
export { Input } from './components/input'
export { PageHeader } from './components/page-header'
export { ProjetCard } from './components/projet-card'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/select'
export { Slider } from './components/slider'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs'
export { ToastProvider } from './components/toast-provider'
export { Toaster } from './components/toaster'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/tooltip'

// ===== HOOKS =====
export * from './hooks'

// ===== TYPES UI =====
export * from './types'

// ===== UTILITAIRES STYLES =====
export { cn, formatCurrency, formatDate, formatPercent } from './lib/utils'

// ===== DESIGN SYSTEM COMPLET =====
// Export unique depuis design-system pour éviter les doublons
export {
    animationClasses, badgeVariants,
    // Variants (source autoritaire)
    buttonVariants, cardVariants, combineVariants,
    // Helpers avancés
    createVariants, formResponsiveClasses, getAlertClasses, getAmountClasses,
    getLoadingClasses, getPriorityClasses,
    // Helpers métier
    getProjectStatusClasses, inputVariants,

    // Classes de base
    interactiveClasses, layoutClasses,
    tableResponsiveClasses
} from './lib/design-system'

// ===== TYPES POUR CONSUMERS =====
export type {
    BaseComponentProps, ComponentSize, ComponentVariant, FormFieldProps, ToastProps
} from './types'
