import { SetMetadata } from '@nestjs/common';

export const MARKETPLACE_PERMISSIONS_KEY = 'marketplace_permissions';

export enum MarketplacePermission {
  // Order management
  VIEW_ORDERS = 'marketplace:orders:view',
  MANAGE_ORDERS = 'marketplace:orders:manage',
  CANCEL_ORDERS = 'marketplace:orders:cancel',
  MODERATE_ORDERS = 'marketplace:orders:moderate',
  
  // Payment management
  VIEW_PAYMENTS = 'marketplace:payments:view',
  PROCESS_REFUNDS = 'marketplace:payments:refund',
  VIEW_PAYMENT_DETAILS = 'marketplace:payments:details',
  
  // Customer management
  VIEW_CUSTOMERS = 'marketplace:customers:view',
  MANAGE_CUSTOMERS = 'marketplace:customers:manage',
  
  // Product management
  VIEW_PRODUCTS = 'marketplace:products:view',
  MANAGE_PRODUCTS = 'marketplace:products:manage',
  
  // Moderation
  MANAGE_MODERATORS = 'marketplace:moderators:manage',
  
  // Administrative
  VIEW_ANALYTICS = 'marketplace:analytics:view',
  MANAGE_SETTINGS = 'marketplace:settings:manage',
  SUPER_ADMIN = 'marketplace:admin:super'
}

/**
 * Decorator to require specific marketplace permissions
 */
export const RequireMarketplacePermissions = (...permissions: MarketplacePermission[]) =>
  SetMetadata(MARKETPLACE_PERMISSIONS_KEY, permissions);