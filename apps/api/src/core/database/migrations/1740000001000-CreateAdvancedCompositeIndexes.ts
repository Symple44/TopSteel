import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Advanced Composite Indexes Migration for TopSteel Project
 *
 * This migration creates specialized composite indexes for:
 * - Complex business queries with multiple conditions
 * - Advanced filtering and sorting patterns
 * - Cross-table relationship queries
 * - Performance-critical dashboard queries
 * - Elasticsearch synchronization patterns
 *
 * Focus: Multi-column indexes for specific business use cases
 */
export class CreateAdvancedCompositeIndexes1740000001000 implements MigrationInterface {
  name = 'CreateAdvancedCompositeIndexes1740000001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =============================================================================
    // 1. ADVANCED AUTHENTICATION & SESSION MANAGEMENT
    // =============================================================================

    // Multi-session management per user with status filtering
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_user_status_activity" 
      ON "user_sessions" ("userId", "status", "lastActivity" DESC) 
      WHERE "isActive" = true;
    `)

    // Security monitoring: track suspicious login patterns
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_ip_user_time" 
      ON "user_sessions" ("ipAddress", "userId", "loginTime" DESC) 
      WHERE "ipAddress" IS NOT NULL;
    `)

    // Session cleanup and maintenance patterns
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_cleanup_expired" 
      ON "user_sessions" ("isActive", "lastActivity", "status") 
      WHERE "isActive" = false OR "status" IN ('expired', 'ended');
    `)

    // =============================================================================
    // 2. ADVANCED RBAC (Role-Based Access Control)
    // =============================================================================

    // Complex permission resolution queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_role_permissions_resource_action_active" 
      ON "role_permissions" ("roleId", "permissionId", "isActive", "created_at") 
      WHERE "deleted_at" IS NULL;
    `)

    // User permission inheritance through multiple roles
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_roles_user_created_active" 
      ON "user_roles" ("userId", "created_at" DESC, "roleId") 
      WHERE EXISTS (
        SELECT 1 FROM roles r 
        WHERE r.id = user_roles."roleId" 
        AND r."isActive" = true 
        AND r."deleted_at" IS NULL
      );
    `)

    // Multi-tenant role resolution
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_societe_roles_permission_resolution" 
      ON "user_societe_roles" ("userId", "societeId", "roleId", "isActive") 
      WHERE "deleted_at" IS NULL AND "isActive" = true;
    `)

    // =============================================================================
    // 3. ADVANCED BUSINESS QUERIES - ARTICLES & INVENTORY
    // =============================================================================

    // Inventory management dashboard queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_inventory_dashboard" 
      ON "articles" ("type", "status", "gere_en_stock", "famille", "updated_at" DESC) 
      WHERE "deleted_at" IS NULL AND "status" = 'ACTIF';
    `)

    // Stock level monitoring and alerts
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_stock_alerts" 
      ON "articles" ("gere_en_stock", "stock_disponible", "stock_mini", "famille") 
      WHERE "gere_en_stock" = true 
      AND "stock_mini" IS NOT NULL 
      AND "stock_disponible" <= "stock_mini" 
      AND "deleted_at" IS NULL;
    `)

    // Supplier-based inventory queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_supplier_management" 
      ON "articles" ("fournisseur_principal_id", "type", "status", "date_dernier_mouvement") 
      WHERE "fournisseur_principal_id" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // Marketplace product synchronization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_marketplace_sync" 
      ON "articles" ("is_marketplace_enabled", "status", "type", "updated_at") 
      WHERE "is_marketplace_enabled" = true AND "deleted_at" IS NULL;
    `)

    // Advanced product search (family + subfamily + status)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_hierarchical_search" 
      ON "articles" ("famille", "sous_famille", "status", "designation") 
      WHERE "famille" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // Financial reporting: stock valuation
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_valuation" 
      ON "articles" ("gere_en_stock", "methode_valorisation", "stock_physique", "prix_achat_moyen") 
      WHERE "gere_en_stock" = true 
      AND "stock_physique" > 0 
      AND "prix_achat_moyen" IS NOT NULL 
      AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 4. ADVANCED SOCIETE (TENANT) MANAGEMENT
    // =============================================================================

    // Multi-tenant dashboard queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_societes_dashboard_overview" 
      ON "societes" ("status", "plan", "dateActivation", "maxUsers", "created_at") 
      WHERE "deleted_at" IS NULL;
    `)

    // License and subscription management
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_societes_subscription_management" 
      ON "societes" ("status", "dateExpiration", "plan", "dateActivation") 
      WHERE "dateExpiration" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // Database sharding and connection management
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_societes_database_routing" 
      ON "societes" ("databaseName", "databaseHost", "status") 
      WHERE "status" IN ('ACTIVE', 'TRIAL') AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 5. ADVANCED PRICING & BUSINESS RULES
    // =============================================================================

    // Dynamic pricing resolution
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_price_rules_resolution" 
      ON "price_rules" ("societeId", "isActive", "priority" DESC, "validFrom", "validTo") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Sector-based pricing calculations
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_sector_coefficients_calculation" 
      ON "sector_coefficients" ("societeId", "sector", "coefficientType", "priority" DESC, "isActive") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Customer pricing assignments
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_customer_sector_pricing" 
      ON "customer_sector_assignments" ("societeId", "customerId", "sector", "isActive") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Market index tracking for pricing
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_btp_indices_market_tracking" 
      ON "btp_indices" ("societeId", "indexType", "year" DESC, "month" DESC, "isCurrent") 
      WHERE "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 6. ADVANCED MARKETPLACE OPERATIONS
    // =============================================================================

    // Order processing pipeline
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_processing" 
      ON "marketplace_orders" ("societeId", "status", "orderDate" DESC, "totalAmount") 
      WHERE "deleted_at" IS NULL;
    `)

    // Customer order history and analytics
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_customer_history" 
      ON "marketplace_orders" ("customerId", "orderDate" DESC, "status", "totalAmount") 
      WHERE "customerId" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // Product performance tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_performance" 
      ON "marketplace_products" ("societeId", "isActive", "erpArticleId", "updated_at" DESC) 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Customer segmentation and marketing
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_segmentation" 
      ON "marketplace_customers" ("societeId", "status", "isActive", "created_at" DESC) 
      WHERE "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 7. ADVANCED NOTIFICATION & COMMUNICATION
    // =============================================================================

    // Real-time notification delivery
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_delivery" 
      ON "notifications" ("userId", "isRead", "priority", "created_at" DESC) 
      WHERE "deleted_at" IS NULL;
    `)

    // Notification rule execution tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notification_rules_execution" 
      ON "notification_rule_executions" ("ruleId", "executedAt" DESC, "success") 
      WHERE "deleted_at" IS NULL;
    `)

    // Bulk notification processing
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_bulk_processing" 
      ON "notifications" ("type", "created_at", "isRead", "userId") 
      WHERE "created_at" >= CURRENT_TIMESTAMP - INTERVAL '7 days' 
      AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 8. ADVANCED AUDIT & COMPLIANCE
    // =============================================================================

    // Comprehensive audit trail
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_comprehensive" 
      ON "audit_logs" ("entityType", "entityId", "action", "timestamp" DESC, "userId") 
      WHERE "deleted_at" IS NULL;
    `)

    // Compliance reporting
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_compliance" 
      ON "audit_logs" ("timestamp", "entityType", "action", "userId") 
      WHERE "timestamp" >= CURRENT_TIMESTAMP - INTERVAL '2 years' 
      AND "deleted_at" IS NULL;
    `)

    // Security monitoring
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_security" 
      ON "audit_logs" ("userId", "action", "timestamp" DESC, "ipAddress") 
      WHERE "action" IN ('LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PASSWORD_CHANGE') 
      AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 9. ADVANCED SEARCH & ELASTICSEARCH SYNC
    // =============================================================================

    // Full-text search preparation
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_fulltext_search" 
      ON "articles" USING gin(
        to_tsvector('french', 
          COALESCE("designation", '') || ' ' || 
          COALESCE("description", '') || ' ' || 
          COALESCE("reference", '') || ' ' ||
          COALESCE("famille", '') || ' ' ||
          COALESCE("sous_famille", '')
        )
      ) 
      WHERE "status" = 'ACTIF' AND "deleted_at" IS NULL;
    `)

    // Elasticsearch synchronization tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_es_sync" 
      ON "articles" ("updated_at", "status", "is_marketplace_enabled") 
      WHERE "deleted_at" IS NULL;
    `)

    // Search analytics and performance
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_societes_search_analytics" 
      ON "societes" ("code", "status", "plan", "updated_at") 
      WHERE "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 10. ADVANCED PERFORMANCE & MAINTENANCE
    // =============================================================================

    // Database maintenance patterns
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_maintenance_old_sessions" 
      ON "user_sessions" ("updated_at", "isActive") 
      WHERE "updated_at" < CURRENT_TIMESTAMP - INTERVAL '30 days';
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_maintenance_old_audit_logs" 
      ON "audit_logs" ("timestamp", "entityType") 
      WHERE "timestamp" < CURRENT_TIMESTAMP - INTERVAL '2 years';
    `)

    // Performance monitoring indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_performance_user_activity" 
      ON "user_sessions" ("userId", "lastActivity" DESC, "isActive") 
      WHERE "lastActivity" >= CURRENT_TIMESTAMP - INTERVAL '24 hours';
    `)

    // Cross-reference performance optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cross_reference_optimization" 
      ON "user_societe_roles" ("userId", "societeId", "created_at" DESC) 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all advanced composite indexes in reverse order

    // Performance & maintenance indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_cross_reference_optimization";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_performance_user_activity";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_maintenance_old_audit_logs";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_maintenance_old_sessions";`)

    // Search & Elasticsearch indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_societes_search_analytics";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_es_sync";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_fulltext_search";`)

    // Audit & compliance indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_security";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_compliance";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_comprehensive";`)

    // Notification indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_notifications_bulk_processing";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_notification_rules_execution";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_notifications_delivery";`)

    // Marketplace indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_segmentation";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_performance";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_customer_history";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_processing";`
    )

    // Pricing indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_btp_indices_market_tracking";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_customer_sector_pricing";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_sector_coefficients_calculation";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_price_rules_resolution";`)

    // Societe management indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_societes_database_routing";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_societes_subscription_management";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_societes_dashboard_overview";`)

    // Articles indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_valuation";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_hierarchical_search";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_marketplace_sync";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_supplier_management";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_stock_alerts";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_inventory_dashboard";`)

    // RBAC indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_societe_roles_permission_resolution";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_roles_user_created_active";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_role_permissions_resource_action_active";`
    )

    // Session management indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_cleanup_expired";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_ip_user_time";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_user_status_activity";`
    )
  }
}
