import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { emitCacheInvalidationEvent, InvalidateCache } from '../services/search-cache-invalidation.service'

/**
 * Example service showing how to integrate cache invalidation with domain operations
 * This demonstrates best practices for cache invalidation in your domain services
 */
@Injectable()
export class CacheIntegrationExampleService {

  constructor(
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Example 1: Manual cache invalidation using event emitter
   */
  async updateProduct(tenantId: string, productId: string, updateData: any): Promise<any> {
    // Perform the actual update operation
    const updatedProduct = await this.performProductUpdate(productId, updateData)
    
    // Manually emit cache invalidation event
    emitCacheInvalidationEvent(
      this.eventEmitter,
      tenantId,
      'product',
      productId,
      'update',
      { fields: Object.keys(updateData) }
    )
    
    return updatedProduct
  }

  /**
   * Example 2: Using the decorator for automatic cache invalidation
   */
  @InvalidateCache('customer', 'create')
  async createCustomer(tenantId: string, customerData: any): Promise<any> {
    // The decorator will automatically emit cache invalidation events
    // after this method completes successfully
    
    const newCustomer = await this.performCustomerCreation(customerData)
    
    // Make sure the result contains the required fields for the decorator
    return {
      ...newCustomer,
      tenantId, // Required for decorator to extract tenant
      id: newCustomer.id // Required for decorator to extract entity ID
    }
  }

  /**
   * Example 3: Bulk operations with cache invalidation
   */
  async bulkUpdateOrders(tenantId: string, orderIds: string[], updateData: any): Promise<void> {
    // Perform bulk update
    await this.performBulkOrderUpdate(orderIds, updateData)
    
    // Emit bulk invalidation event
    this.eventEmitter.emit('order.bulk_updated', {
      tenantId,
      entityType: 'order',
      operation: 'bulk_update',
      count: orderIds.length,
      timestamp: new Date()
    })
  }

  /**
   * Example 4: Complex operation affecting multiple entity types
   */
  async processComplexBusinessOperation(tenantId: string, data: any): Promise<void> {
    // This operation might affect multiple entity types
    
    // Update customer
    await this.updateCustomerData(data.customerId, data.customerUpdates)
    emitCacheInvalidationEvent(this.eventEmitter, tenantId, 'customer', data.customerId, 'update')
    
    // Create orders
    for (const orderData of data.orders) {
      const order = await this.createOrder(orderData)
      emitCacheInvalidationEvent(this.eventEmitter, tenantId, 'order', order.id, 'create')
    }
    
    // Update product inventory
    for (const productUpdate of data.productUpdates) {
      await this.updateProductInventory(productUpdate.productId, productUpdate.quantity)
      emitCacheInvalidationEvent(this.eventEmitter, tenantId, 'product', productUpdate.productId, 'update')
    }
  }

  /**
   * Example 5: Conditional cache invalidation
   */
  async updateUserProfile(tenantId: string, userId: string, profileData: any): Promise<any> {
    const result = await this.performUserProfileUpdate(userId, profileData)
    
    // Only invalidate cache if significant fields were changed
    const significantFields = ['name', 'email', 'role', 'permissions']
    const hasSignificantChanges = Object.keys(profileData).some(field => 
      significantFields.includes(field)
    )
    
    if (hasSignificantChanges) {
      emitCacheInvalidationEvent(this.eventEmitter, tenantId, 'user', userId, 'update', {
        significantChange: true,
        changedFields: Object.keys(profileData)
      })
    }
    
    return result
  }

  /**
   * Example 6: Tenant-wide operation
   */
  async updateTenantSettings(tenantId: string, settings: any): Promise<void> {
    await this.performTenantSettingsUpdate(tenantId, settings)
    
    // Emit tenant-wide invalidation event
    this.eventEmitter.emit('tenant.settings_changed', {
      tenantId,
      changedSettings: Object.keys(settings),
      timestamp: new Date()
    })
  }

  /**
   * Example 7: Error handling with cache invalidation
   */
  async deleteProductWithErrorHandling(tenantId: string, productId: string): Promise<void> {
    try {
      await this.performProductDeletion(productId)
      
      // Only emit invalidation event if deletion was successful
      emitCacheInvalidationEvent(this.eventEmitter, tenantId, 'product', productId, 'delete')
      
    } catch (error) {
      // Don't emit cache invalidation if operation failed
      throw error
    }
  }

  // Helper methods for extracting tenant and entity IDs (used by decorator)
  extractTenantId(args: any[], result: any): string | null {
    // Look for tenant ID in arguments first
    if (args[0] && typeof args[0] === 'string') {
      return args[0] // First argument is often tenantId
    }
    
    // Look for tenant ID in result
    if (result && result.tenantId) {
      return result.tenantId
    }
    
    return null
  }

  extractEntityId(args: any[], result: any): string | null {
    // Look for entity ID in arguments
    if (args[1] && typeof args[1] === 'string') {
      return args[1] // Second argument is often entityId
    }
    
    // Look for entity ID in result
    if (result && result.id) {
      return result.id
    }
    
    return null
  }

  // Mock implementation methods (replace with your actual business logic)
  
  private async performProductUpdate(productId: string, updateData: any): Promise<any> {
    // Your actual product update logic here
    return { id: productId, ...updateData }
  }

  private async performCustomerCreation(customerData: any): Promise<any> {
    // Your actual customer creation logic here
    return { id: 'customer-123', ...customerData }
  }

  private async performBulkOrderUpdate(orderIds: string[], updateData: any): Promise<void> {
    // Your actual bulk order update logic here
  }

  private async updateCustomerData(customerId: string, updateData: any): Promise<void> {
    // Your actual customer update logic here
  }

  private async createOrder(orderData: any): Promise<any> {
    // Your actual order creation logic here
    return { id: 'order-123', ...orderData }
  }

  private async updateProductInventory(productId: string, quantity: number): Promise<void> {
    // Your actual inventory update logic here
  }

  private async performUserProfileUpdate(userId: string, profileData: any): Promise<any> {
    // Your actual user profile update logic here
    return { id: userId, ...profileData }
  }

  private async performTenantSettingsUpdate(tenantId: string, settings: any): Promise<void> {
    // Your actual tenant settings update logic here
  }

  private async performProductDeletion(productId: string): Promise<void> {
    // Your actual product deletion logic here
  }
}