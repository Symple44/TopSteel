import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Marketplace-Specific Optimization Indexes Migration
 *
 * This migration creates highly specialized indexes for:
 * - E-commerce catalog browsing and filtering
 * - Order processing and fulfillment
 * - Customer behavior tracking
 * - Product search and recommendations
 * - Multi-tenant marketplace operations
 * - Payment and shipping workflows
 *
 * Focus: Marketplace performance and customer experience optimization
 */
export class CreateMarketplaceOptimizationIndexes1740000002000 implements MigrationInterface {
  name = 'CreateMarketplaceOptimizationIndexes1740000002000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =============================================================================
    // 1. PRODUCT CATALOG OPTIMIZATION
    // =============================================================================

    // Product catalog browsing with faceted search
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_catalog_browse" 
      ON "marketplace_products" ("societeId", "isActive", "isVisible", "categoryId", "price" ASC) 
      WHERE "isActive" = true AND "isVisible" = true AND "deleted_at" IS NULL;
    `)

    // Product sorting by popularity and ratings
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_popularity" 
      ON "marketplace_products" ("societeId", "isActive", "viewCount" DESC, "orderCount" DESC, "rating" DESC) 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Product inventory integration with ERP
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_inventory_sync" 
      ON "marketplace_products" ("erpArticleId", "societeId", "stockQuantity", "isActive") 
      WHERE "erpArticleId" IS NOT NULL AND "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Product price range filtering
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_price_range" 
      ON "marketplace_products" ("societeId", "categoryId", "price", "isActive") 
      WHERE "isActive" = true AND "price" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // Product availability and stock status
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_availability" 
      ON "marketplace_products" ("societeId", "isActive", "stockStatus", "stockQuantity") 
      WHERE "isActive" = true AND "stockStatus" IN ('IN_STOCK', 'LOW_STOCK') AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 2. ORDER PROCESSING OPTIMIZATION
    // =============================================================================

    // Order processing workflow optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_workflow" 
      ON "marketplace_orders" ("societeId", "status", "orderDate" DESC, "priority") 
      WHERE "status" NOT IN ('CANCELLED', 'REFUNDED') AND "deleted_at" IS NULL;
    `)

    // Order fulfillment tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_fulfillment" 
      ON "marketplace_orders" ("societeId", "status", "shippingDate", "trackingNumber") 
      WHERE "status" IN ('PROCESSING', 'SHIPPED', 'IN_TRANSIT') AND "deleted_at" IS NULL;
    `)

    // Order items with product correlation
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_order_items_product_analysis" 
      ON "marketplace_order_items" ("productId", "quantity", "unitPrice", "created_at" DESC) 
      WHERE "deleted_at" IS NULL;
    `)

    // Payment processing correlation
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_payment_status" 
      ON "marketplace_orders" ("societeId", "paymentStatus", "paymentMethod", "totalAmount") 
      WHERE "paymentStatus" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // Order timeline and SLA tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_sla_tracking" 
      ON "marketplace_orders" ("orderDate", "expectedDeliveryDate", "status", "priority") 
      WHERE "expectedDeliveryDate" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 3. CUSTOMER EXPERIENCE OPTIMIZATION
    // =============================================================================

    // Customer order history and patterns
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_order_patterns" 
      ON "marketplace_orders" ("customerId", "orderDate" DESC, "totalAmount", "status") 
      WHERE "customerId" IS NOT NULL AND "status" = 'COMPLETED' AND "deleted_at" IS NULL;
    `)

    // Customer loyalty and segmentation
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_loyalty" 
      ON "marketplace_customers" ("societeId", "totalOrders", "totalSpent", "lastOrderDate" DESC) 
      WHERE "isActive" = true AND "totalOrders" > 0 AND "deleted_at" IS NULL;
    `)

    // Customer address and shipping optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customer_addresses_shipping" 
      ON "marketplace_customer_addresses" ("customerId", "isDefault", "type", "city", "postalCode") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Customer preference tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_preferences" 
      ON "marketplace_customers" ("societeId", "preferredLanguage", "preferredCurrency", "isActive") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 4. SEARCH AND RECOMMENDATION OPTIMIZATION
    // =============================================================================

    // Product search with full-text capabilities
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_search" 
      ON "marketplace_products" USING gin(
        to_tsvector('french', 
          COALESCE("title", '') || ' ' || 
          COALESCE("description", '') || ' ' || 
          COALESCE("tags", '') || ' ' ||
          COALESCE("sku", '')
        )
      ) 
      WHERE "isActive" = true AND "isVisible" = true AND "deleted_at" IS NULL;
    `)

    // Category-based product recommendations
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_recommendations" 
      ON "marketplace_products" ("categoryId", "rating" DESC, "orderCount" DESC, "price") 
      WHERE "isActive" = true AND "isVisible" = true AND "rating" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // Recently viewed products tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_product_views_tracking" 
      ON "marketplace_product_views" ("customerId", "viewedAt" DESC, "productId") 
      WHERE "viewedAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days' AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 5. PRICING AND PROMOTION OPTIMIZATION
    // =============================================================================

    // Dynamic pricing rules application
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_price_rules_application" 
      ON "marketplace_price_rules" ("societeId", "isActive", "priority" DESC, "validFrom", "validTo") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Product-specific pricing
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_price_rules_product_specific" 
      ON "marketplace_price_rules" ("productId", "customerSegment", "isActive", "priority" DESC) 
      WHERE "productId" IS NOT NULL AND "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Promotional campaigns tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_promotions_campaigns" 
      ON "marketplace_promotions" ("societeId", "isActive", "startDate", "endDate", "discountType") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Coupon usage optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_coupons_usage" 
      ON "marketplace_coupons" ("code", "isActive", "usageCount", "maxUsage", "expiresAt") 
      WHERE "isActive" = true AND "expiresAt" > CURRENT_TIMESTAMP AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 6. MULTI-TENANT MARKETPLACE OPERATIONS
    // =============================================================================

    // Tenant-specific marketplace configuration
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_themes_tenant_config" 
      ON "marketplace_themes" ("societeId", "isActive", "themeName", "version") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Cross-tenant product comparison
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_cross_tenant" 
      ON "marketplace_products" ("erpArticleId", "price", "isActive", "societeId") 
      WHERE "erpArticleId" IS NOT NULL AND "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Tenant marketplace analytics
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_tenant_analytics" 
      ON "marketplace_orders" ("societeId", "orderDate", "status", "totalAmount") 
      WHERE "orderDate" >= CURRENT_TIMESTAMP - INTERVAL '1 year' AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 7. SHIPPING AND LOGISTICS OPTIMIZATION
    // =============================================================================

    // Shipping method optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_shipments_logistics" 
      ON "marketplace_shipments" ("orderId", "status", "shippingMethod", "trackingNumber") 
      WHERE "status" NOT IN ('CANCELLED', 'RETURNED') AND "deleted_at" IS NULL;
    `)

    // Geographic shipping optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_geographic" 
      ON "marketplace_orders" ("shippingCity", "shippingPostalCode", "shippingCountry", "orderDate") 
      WHERE "shippingCity" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // Delivery performance tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_shipments_performance" 
      ON "marketplace_shipments" ("estimatedDeliveryDate", "actualDeliveryDate", "status") 
      WHERE "actualDeliveryDate" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 8. MARKETPLACE ANALYTICS AND REPORTING
    // =============================================================================

    // Sales performance analytics
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_analytics_sales" 
      ON "marketplace_orders" ("societeId", "orderDate", "totalAmount", "status") 
      WHERE "status" = 'COMPLETED' AND "orderDate" >= CURRENT_TIMESTAMP - INTERVAL '2 years' AND "deleted_at" IS NULL;
    `)

    // Product performance metrics
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_analytics_products" 
      ON "marketplace_order_items" ("productId", "created_at", "quantity", "unitPrice") 
      WHERE "created_at" >= CURRENT_TIMESTAMP - INTERVAL '1 year' AND "deleted_at" IS NULL;
    `)

    // Customer acquisition tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_acquisition" 
      ON "marketplace_customers" ("societeId", "created_at", "acquisitionSource", "firstOrderDate") 
      WHERE "created_at" >= CURRENT_TIMESTAMP - INTERVAL '2 years' AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 9. MARKETPLACE SECURITY AND FRAUD PREVENTION
    // =============================================================================

    // Fraud detection patterns
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_fraud_detection" 
      ON "marketplace_orders" ("customerId", "ipAddress", "totalAmount", "orderDate") 
      WHERE "ipAddress" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // Suspicious activity monitoring
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_suspicious_activity" 
      ON "marketplace_customers" ("email", "ipAddress", "created_at", "isActive") 
      WHERE "ipAddress" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 10. MARKETPLACE PERFORMANCE MONITORING
    // =============================================================================

    // API performance monitoring
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_api_performance" 
      ON "marketplace_products" ("societeId", "updated_at", "isActive") 
      WHERE "updated_at" >= CURRENT_TIMESTAMP - INTERVAL '1 hour' AND "deleted_at" IS NULL;
    `)

    // Cache warming patterns
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_cache_warming" 
      ON "marketplace_products" ("categoryId", "isActive", "isFeatured", "rating" DESC) 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all marketplace optimization indexes in reverse order

    // Performance monitoring indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_cache_warming";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_api_performance";`
    )

    // Security indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_suspicious_activity";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_fraud_detection";`
    )

    // Analytics indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_acquisition";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_analytics_products";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_analytics_sales";`)

    // Shipping and logistics indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_shipments_performance";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_geographic";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_shipments_logistics";`
    )

    // Multi-tenant indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_tenant_analytics";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_cross_tenant";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_themes_tenant_config";`
    )

    // Pricing and promotion indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_coupons_usage";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_promotions_campaigns";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_price_rules_product_specific";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_price_rules_application";`
    )

    // Search and recommendation indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_product_views_tracking";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_recommendations";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_search";`)

    // Customer experience indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_preferences";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customer_addresses_shipping";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_loyalty";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_order_patterns";`
    )

    // Order processing indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_sla_tracking";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_payment_status";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_order_items_product_analysis";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_fulfillment";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_workflow";`)

    // Product catalog indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_availability";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_price_range";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_inventory_sync";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_popularity";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_catalog_browse";`
    )
  }
}
