import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Comprehensive Database Indexing Strategy for TopSteel Project
 *
 * This migration creates performance-optimized indexes for:
 * - Authentication & Authorization (users, roles, permissions, sessions)
 * - Business Operations (articles, societes, partners)
 * - Multi-tenant queries and filters
 * - Common search and filter patterns
 * - Foreign key relationships
 *
 * Priority: Performance-critical tables and frequently queried columns
 */
export class CreateComprehensiveIndexes1740000000000 implements MigrationInterface {
  name = 'CreateComprehensiveIndexes1740000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =============================================================================
    // 1. AUTHENTICATION & AUTHORIZATION INDEXES
    // =============================================================================

    // Users table - Critical for auth operations
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email_active" 
      ON "users" ("email", "actif") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_role_active" 
      ON "users" ("role", "actif") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_last_login" 
      ON "users" ("dernier_login") 
      WHERE "dernier_login" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_refresh_token" 
      ON "users" ("refreshToken") 
      WHERE "refreshToken" IS NOT NULL;
    `)

    // User Sessions - Critical for session management
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_userid_status" 
      ON "user_sessions" ("userId", "status") 
      WHERE "isActive" = true;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_last_activity" 
      ON "user_sessions" ("lastActivity") 
      WHERE "isActive" = true;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_login_time" 
      ON "user_sessions" ("loginTime", "userId");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_ip_useragent" 
      ON "user_sessions" ("ipAddress", "userAgent") 
      WHERE "ipAddress" IS NOT NULL;
    `)

    // Roles table - Critical for RBAC
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_roles_societe_active" 
      ON "roles" ("societeId", "isActive") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_roles_parent_type_active" 
      ON "roles" ("parentRoleType", "isActive") 
      WHERE "parentRoleType" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_roles_system_priority" 
      ON "roles" ("isSystemRole", "priority") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Permissions table - Critical for RBAC
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_permissions_resource_action" 
      ON "permissions" ("resource", "action") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_permissions_societe_scope" 
      ON "permissions" ("societeId", "scope") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_permissions_resource_scope" 
      ON "permissions" ("resource", "scope", "isActive") 
      WHERE "deleted_at" IS NULL;
    `)

    // User-Role relationships
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_roles_created_at" 
      ON "user_roles" ("created_at", "userId");
    `)

    // Role-Permission relationships
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_role_permissions_role_perm" 
      ON "role_permissions" ("roleId", "permissionId", "isActive") 
      WHERE "deleted_at" IS NULL;
    `)

    // User-Societe-Role relationships (multi-tenant RBAC)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_societe_roles_user_societe" 
      ON "user_societe_roles" ("userId", "societeId") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_societe_roles_societe_role" 
      ON "user_societe_roles" ("societeId", "roleId") 
      WHERE "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 2. BUSINESS ENTITIES INDEXES - SOCIETES (TENANTS)
    // =============================================================================

    // Societes table - Critical for multi-tenant operations
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_societes_status_plan" 
      ON "societes" ("status", "plan") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_societes_expiration" 
      ON "societes" ("dateExpiration") 
      WHERE "dateExpiration" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_societes_activation" 
      ON "societes" ("dateActivation", "status") 
      WHERE "dateActivation" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_societes_database_config" 
      ON "societes" ("databaseName", "status") 
      WHERE "deleted_at" IS NULL;
    `)

    // Societe Users relationships
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_societe_users_societe_active" 
      ON "societe_users" ("societeId", "isActive") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_societe_users_user_active" 
      ON "societe_users" ("userId", "isActive") 
      WHERE "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 3. BUSINESS ENTITIES INDEXES - ARTICLES (INVENTORY)
    // =============================================================================

    // Articles table - Critical for inventory operations
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_reference_active" 
      ON "articles" ("reference", "status") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_type_status" 
      ON "articles" ("type", "status") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_famille_sousfamille" 
      ON "articles" ("famille", "sous_famille") 
      WHERE "famille" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_stock_management" 
      ON "articles" ("gere_en_stock", "stock_physique") 
      WHERE "gere_en_stock" = true AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_low_stock" 
      ON "articles" ("stock_disponible", "stock_mini") 
      WHERE "gere_en_stock" = true AND "stock_mini" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_supplier" 
      ON "articles" ("fournisseur_principal_id") 
      WHERE "fournisseur_principal_id" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_ean_code" 
      ON "articles" ("code_ean") 
      WHERE "code_ean" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_marketplace" 
      ON "articles" ("is_marketplace_enabled") 
      WHERE "is_marketplace_enabled" = true AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_last_movement" 
      ON "articles" ("date_dernier_mouvement") 
      WHERE "date_dernier_mouvement" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_designation_search" 
      ON "articles" USING gin(to_tsvector('french', "designation")) 
      WHERE "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 4. PRICING & BUSINESS RULES INDEXES
    // =============================================================================

    // Price Rules
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_price_rules_societe_active" 
      ON "price_rules" ("societeId", "isActive") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_price_rules_priority" 
      ON "price_rules" ("priority", "isActive") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_price_rules_validity" 
      ON "price_rules" ("validFrom", "validTo") 
      WHERE "deleted_at" IS NULL;
    `)

    // Sector Coefficients
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_sector_coefficients_societe_active" 
      ON "sector_coefficients" ("societeId", "isActive") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_sector_coefficients_sector_type" 
      ON "sector_coefficients" ("sector", "coefficientType") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // Customer Sector Assignments
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_customer_sector_assignments_societe" 
      ON "customer_sector_assignments" ("societeId", "sector") 
      WHERE "isActive" = true AND "deleted_at" IS NULL;
    `)

    // BTP Indices
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_btp_indices_type_period" 
      ON "btp_indices" ("indexType", "year", "month") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_btp_indices_societe_current" 
      ON "btp_indices" ("societeId", "year", "month") 
      WHERE "isCurrent" = true AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 5. MARKETPLACE INDEXES
    // =============================================================================

    // Marketplace Orders
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_societe_status" 
      ON "marketplace_orders" ("societeId", "status") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_customer" 
      ON "marketplace_orders" ("customerId", "orderDate") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_date_status" 
      ON "marketplace_orders" ("orderDate", "status") 
      WHERE "deleted_at" IS NULL;
    `)

    // Marketplace Customers
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_societe_email" 
      ON "marketplace_customers" ("societeId", "email") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_status" 
      ON "marketplace_customers" ("status", "isActive") 
      WHERE "deleted_at" IS NULL;
    `)

    // Marketplace Products
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_societe_active" 
      ON "marketplace_products" ("societeId", "isActive") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_products_erp_article" 
      ON "marketplace_products" ("erpArticleId", "societeId") 
      WHERE "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 6. NOTIFICATIONS & SETTINGS INDEXES
    // =============================================================================

    // Notifications
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_user_read" 
      ON "notifications" ("userId", "isRead") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_type_created" 
      ON "notifications" ("type", "created_at") 
      WHERE "deleted_at" IS NULL;
    `)

    // Notification Rules
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notification_rules_active" 
      ON "notification_rules" ("isActive", "triggerType") 
      WHERE "deleted_at" IS NULL;
    `)

    // Parameters
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_parameter_system_key_active" 
      ON "parameter_system" ("key", "isActive") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_parameter_application_societe" 
      ON "parameter_application" ("societeId", "key") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_parameter_client_user" 
      ON "parameter_client" ("userId", "key") 
      WHERE "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 7. UI PREFERENCES & MENU INDEXES
    // =============================================================================

    // User Menu Preferences
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_menu_preferences_user_context" 
      ON "user_menu_preference_items" ("userId", "menuId") 
      WHERE "deleted_at" IS NULL;
    `)

    // Datatable Preferences
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_datatable_hierarchical_prefs_user" 
      ON "datatable_hierarchical_preferences" ("user_id", "table_id") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_datatable_hierarchy_order_user_table" 
      ON "datatable_hierarchy_order" ("user_id", "table_id") 
      WHERE "deleted_at" IS NULL;
    `)

    // UI Preferences Reorderable Lists
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ui_preferences_reorderable_user" 
      ON "ui_preferences_reorderable_list" ("user_id", "component_id") 
      WHERE "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 8. AUDIT & LOGGING INDEXES
    // =============================================================================

    // Audit Logs
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_user_date" 
      ON "audit_logs" ("userId", "timestamp") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_entity_action" 
      ON "audit_logs" ("entityType", "action") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_entity_id" 
      ON "audit_logs" ("entityId") 
      WHERE "entityId" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // Email Logs
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_email_logs_recipient_type" 
      ON "email_logs" ("recipient", "type") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_email_logs_status_sent" 
      ON "email_logs" ("status", "sentAt") 
      WHERE "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 9. SHARED DATA & REGISTRY INDEXES
    // =============================================================================

    // Shared Data Registry
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_shared_data_registry_type_owner" 
      ON "shared_data_registry" ("type", "ownerSocieteId") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_shared_data_registry_shared_with" 
      ON "shared_data_registry" ("sharedWithSocieteIds") 
      WHERE "sharedWithSocieteIds" IS NOT NULL AND "deleted_at" IS NULL;
    `)

    // =============================================================================
    // 10. PERFORMANCE MONITORING INDEXES
    // =============================================================================

    // Common multi-tenant pattern indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_common_tenant_id_created" 
      ON "user_sessions" ("userId", "created_at") 
      WHERE "deleted_at" IS NULL;
    `)

    // Cleanup old/inactive records pattern
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cleanup_inactive_sessions" 
      ON "user_sessions" ("isActive", "updated_at") 
      WHERE "isActive" = false;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cleanup_old_audit_logs" 
      ON "audit_logs" ("timestamp") 
      WHERE "timestamp" < (CURRENT_TIMESTAMP - INTERVAL '1 year');
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all created indexes in reverse order

    // Performance monitoring indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_cleanup_old_audit_logs";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_cleanup_inactive_sessions";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_common_tenant_id_created";`)

    // Shared data indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_shared_data_registry_shared_with";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_shared_data_registry_type_owner";`
    )

    // Audit & logging indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_email_logs_status_sent";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_email_logs_recipient_type";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_entity_id";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_entity_action";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_user_date";`)

    // UI preferences indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_ui_preferences_reorderable_user";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_datatable_hierarchy_order_user_table";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_datatable_hierarchical_prefs_user";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_menu_preferences_user_context";`
    )

    // Parameters indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_parameter_client_user";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_parameter_application_societe";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_parameter_system_key_active";`)

    // Notifications indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_notification_rules_active";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_notifications_type_created";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_notifications_user_read";`)

    // Marketplace indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_erp_article";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_products_societe_active";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_status";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_societe_email";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_date_status";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_customer";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_societe_status";`
    )

    // Pricing indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_btp_indices_societe_current";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_btp_indices_type_period";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_customer_sector_assignments_societe";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_sector_coefficients_sector_type";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_sector_coefficients_societe_active";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_price_rules_validity";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_price_rules_priority";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_price_rules_societe_active";`)

    // Articles indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_designation_search";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_last_movement";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_marketplace";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_ean_code";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_supplier";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_low_stock";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_stock_management";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_famille_sousfamille";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_type_status";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_articles_reference_active";`)

    // Societes indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_societe_users_user_active";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_societe_users_societe_active";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_societes_database_config";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_societes_activation";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_societes_expiration";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_societes_status_plan";`)

    // User-Societe-Role indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_societe_roles_societe_role";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_societe_roles_user_societe";`
    )

    // Role-Permission indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_role_permissions_role_perm";`)

    // User-Role indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_user_roles_created_at";`)

    // Permissions indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_permissions_resource_scope";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_permissions_societe_scope";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_permissions_resource_action";`)

    // Roles indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_roles_system_priority";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_roles_parent_type_active";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_roles_societe_active";`)

    // User sessions indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_ip_useragent";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_login_time";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_last_activity";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_userid_status";`)

    // Users indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_users_refresh_token";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_users_last_login";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_users_role_active";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_users_email_active";`)
  }
}
