// packages/ui/src/index.ts - Export principal
// Cards métier
export { ProjetCard } from './components/projet-card/projet-card'
export { StockCard } from './components/stock-card/stock-card'
export { ClientCard } from './components/client-card/client-card'
export { OrdreFabricationCard } from './components/ordre-fabrication-card/ordre-fabrication-card'

// Dashboard
export { StatsCard } from './components/dashboard/stats-card'
export { ActivityFeed } from './components/dashboard/activity-feed'

// Forms
export { ProjetForm } from './components/forms/projet-form'

// Tables
export { DataTable } from './components/tables/data-table'

// Layout
export { PageHeader } from './components/layout/page-header'

// Charts
export { RevenueChart } from './components/charts/revenue-chart'

// Base components (re-exports from shadcn/ui)
export * from './components/base/button'
export * from './components/base/card'
export * from './components/base/input'
export * from './components/base/label'
export * from './components/base/textarea'
export * from './components/base/select'
export * from './components/base/table'
export * from './components/base/badge'
export * from './components/base/progress'
export * from './components/base/avatar'
export * from './components/base/alert'
export * from './components/base/breadcrumb'

// Types pour les composants
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

// Utilitaire cn
export { cn } from '@erp/utils'