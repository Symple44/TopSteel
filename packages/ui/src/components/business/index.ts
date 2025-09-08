// ================================================================
// PACKAGES UI - BUSINESS COMPONENTS INDEX
// Composants métier réutilisables
// ================================================================

export { CompanyLogo } from './company-logo'

// ========== Dialogs métier ==========
export * from './dialogs'
// Autres composants d'affichage sans conflit
export {
  CompletionIndicator,
  CostBreakdownDisplay,
  CurrencyDisplay,
  DeadlineIndicator,
  KpiCard,
  PerformanceGauge,
  PriceDisplay,
  ProductionStatsCard,
  ProfitMarginDisplay,
  QualityIndicator,
  SalesStatsCard,
  StockLevelIndicator,
  TaxDisplay,
  TrendIndicator,
} from './displays'
// ========== Affichage métier (Displays) ==========
// Re-export avec alias pour éviter les conflits
export {
  type Client as ClientDisplay,
  ClientCard,
} from './displays/ClientCard'
export {
  type ClientStatus as ClientStatusDisplay,
  ClientStatusBadge,
} from './displays/ClientStatusBadge'
export {
  type Invoice as InvoiceDisplay,
  InvoiceCard,
} from './displays/InvoiceCard'
export {
  type InvoiceStatus as InvoiceStatusDisplay,
  InvoiceStatusBadge,
} from './displays/InvoiceStatusBadge'
export {
  type Material as MaterialDisplay,
  MaterialCard,
} from './displays/MaterialCard'
export {
  type ProjectStatus as ProjectStatusDisplay,
  ProjectStatusBadge,
} from './displays/ProjectStatusBadge'
export {
  type StockStatus as StockStatusDisplay,
  StockStatusBadge,
} from './displays/StockStatusBadge'
export {
  type Supplier as SupplierDisplay,
  SupplierCard,
} from './displays/SupplierCard'
export {
  type Task as TaskDisplay,
  TaskCard,
} from './displays/TaskCard'
export {
  type TaskPriority as TaskPriorityDisplay,
  TaskPriorityBadge,
} from './displays/TaskPriorityBadge'

export { ErpInfoModal } from './erp-info-modal'
// Autres filtres sans conflit
export {
  AdvancedSearchBuilder,
  BusinessSortControls,
  ClientSearch,
  DateRangeFilter,
  GlobalSearch,
  MaterialSearch,
  TableColumnManager,
} from './filters'
// ========== Filtres et recherche ==========
// Re-export avec alias pour éviter les conflits
export {
  ClientFilters,
  type ClientFiltersState,
  type ClientSegment,
  type ClientStatus as ClientStatusFilter,
  type ClientType,
  type PaymentTerms as ClientPaymentTerms,
} from './filters/ClientFilters'
export {
  InvoiceFilters,
  type InvoiceFiltersState,
  type InvoiceStatus as InvoiceStatusFilter,
} from './filters/InvoiceFilters'

export {
  type MaterialCategory as MaterialCategoryFilter,
  MaterialFilters,
  type MaterialFiltersState,
  type StockStatus as StockStatusFilter,
} from './filters/MaterialFilters'
export {
  ProjectFilters,
  type ProjectFiltersState,
  type ProjectPriority as ProjectPriorityFilter,
  type ProjectStatus as ProjectStatusFilter,
} from './filters/ProjectFilters'
// Autres formulaires - export avec alias pour éviter conflits
export {
  CategoriesMultiSelect,
  type Category as CategoryMulti,
} from './forms/CategoriesMultiSelect'
export {
  type Category as CategorySingle,
  CategorySelector,
} from './forms/CategorySelector'
export {
  type Client as ClientForm,
  ClientSelector,
} from './forms/ClientSelector'
export * from './forms/DeadlinePicker'
export * from './forms/DimensionInput'
export * from './forms/EmployeeSelector'
export * from './forms/LocationInput'
export {
  type Material as MaterialForm,
  MaterialSelector,
} from './forms/MaterialSelector'
export * from './forms/MaterialsMultiSelect'
export * from './forms/PriceInput'
// ========== Formulaires métier ==========
// Re-export avec alias pour éviter les conflits de types
export {
  type Project as ProjectForm,
  ProjectSelector,
} from './forms/ProjectSelector'
export * from './forms/QuantityInput'
export * from './forms/ReferenceInput'
export * from './forms/SchedulePicker'
export * from './forms/SkillsTagInput'
export {
  type Supplier as SupplierForm,
  SupplierSelector,
} from './forms/SupplierSelector'
export * from './forms/VatInput'
export * from './forms/WorkingHoursPicker'

export { ImageUpload } from './image-upload'

// ========== Composants métallurgie ==========
export * from './metallurgy'

// ========== Notifications métier ==========
export * from './notifications/BulkOperationConfirmation'
export * from './notifications/CancelOrderConfirmation'
export * from './notifications/DeadlineAlert'
export * from './notifications/DeleteProjectConfirmation'
export * from './notifications/ImportProgress'
export * from './notifications/InvoiceGeneratingLoader'
export * from './notifications/PaymentAlert'
export * from './notifications/PaymentConfirmation'
export * from './notifications/QualityAlert'
export * from './notifications/ReportLoading'
export * from './notifications/StockAlert'

// ========== Pricing ==========
export * from './pricing'

// ========== Projet ==========
export { ProjetCard } from './projet-card'

// ========== Tables spécialisées ==========
// Re-export avec alias pour éviter les conflits
export {
  type Client as ClientTable,
  ClientsTable,
} from './tables/ClientsTable'
// Autres tables existantes
export * from './tables/DashboardWidget'
export * from './tables/InventoryChart'
export {
  type Invoice as InvoiceTable,
  InvoicesTable,
} from './tables/InvoicesTable'
export {
  type Material as MaterialTable,
  MaterialsTable,
} from './tables/MaterialsTable'
export * from './tables/ProductionChart'
export * from './tables/ProfitabilityChart'
export {
  type Project as ProjectTable,
  ProjectsTable,
} from './tables/ProjectsTable'
export * from './tables/QuotesTable'

// ========== Upload et documents ==========
export * from './uploads'
// Autres workflows sans conflit
export * from './workflows/ApprovalWorkflow'
// ========== Workflow et processus ==========
// Re-export avec alias pour éviter les conflits
export {
  OrderProgressTracker,
  type OrderStatus as OrderStatusWorkflow,
} from './workflows/OrderProgressTracker'
export {
  type PaymentMethod as PaymentMethodWorkflow,
  PaymentTimeline,
} from './workflows/PaymentTimeline'
export * from './workflows/ProcessStepper'
export * from './workflows/ProductionTimeline'
export * from './workflows/ProjectTimeline'
export {
  type TaskPriority as TaskPriorityWorkflow,
  TaskWorkflow,
} from './workflows/TaskWorkflow'
