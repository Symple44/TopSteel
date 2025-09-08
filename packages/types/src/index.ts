/**
 * 📦 @erp/types - MAIN EXPORT INDEX
 * Tree-shaking optimized type exports for TopSteel ERP
 *
 * ORGANIZATION:
 * - Essential common types for quick access
 * - Domain-organized exports for better tree-shaking
 * - Backward compatibility maintained
 *
 * For better tree-shaking, prefer importing from specific subpaths:
 * - @erp/types/core
 * - @erp/types/infrastructure
 * - @erp/types/cross-cutting
 * - etc.
 */

// ===== ESSENTIAL TYPES (Most commonly used) =====
export type {
  // Common essentials
  Address,
  // Article essentials
  Article,
  ArticleFilters,
  ArticleStatistics,
  CreateArticleDto,
  CreateProjectDto,
  CreateUserDto,
  Currency,
  // Utilities essentials
  DeepPartial,
  GenericStatus,
  // Material essentials
  Material,
  MaterialDimensions,
  MaterialFilters,
  MaterialStatistics,
  Nullable,
  Optional,
  // Project essentials
  Project,
  ProjectFilters,
  ProjectStatistics,
  Projet,
  UpdateArticleDto,
  UpdateProjectDto,
  UpdateUserDto,
  // User essentials
  User,
  UserFilters,
  UserStatistics,
} from './core'
// ===== COMPLETE DOMAIN EXPORTS =====
// Re-export all types by domain for backward compatibility
export * from './core'
// ===== ENUMS (commonly needed) =====
// Note: Enums are already exported via 'export * from' below
export type {
  AuthState,
  // Auth essentials
  AuthUser,
  // Notification essentials
  CreateNotificationDto,
  LoginResponse,
  Notification,
  NotificationRule,
  UpdateNotificationDto,
} from './cross-cutting'
export * from './cross-cutting'
export type {
  // API essentials
  ApiResponse,
  // Store essentials
  AppState,
  BaseStoreActions,
  BaseStoreState,
  ErrorResponse,
  InitialState,
  PaginationResultDto,
  StoreConfig,
  StoreCreator,
  StoreProjet,
  UIState,
} from './infrastructure'
export * from './infrastructure'
// ===== PARTNER ESSENTIALS =====
export type {
  Contact,
  CreateContactDto,
  CreatePartnerAddressDto,
  CreatePartnerDto,
  CreatePartnerSiteDto,
  // Partner essentials
  Partner,
  PartnerAddress,
  PartnerFilters,
  PartnerSite,
  PartnerStatistics,
  UpdateContactDto,
  UpdatePartnerAddressDto,
  UpdatePartnerDto,
  UpdatePartnerSiteDto,
} from './partners'
export * from './partners'
export {
  AccessibiliteType,
  AddressStatus,
  AddressType,
  ContactRole,
  ContactStatus,
  PartnerStatus,
  // Partner enums (commonly needed)
  PartnerType,
  SiteStatus,
  SiteType,
} from './partners'
export * from './ui'
