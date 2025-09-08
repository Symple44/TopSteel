import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Entity Decorator Indexes Migration for TopSteel Project
 *
 * This migration creates indexes that were added directly to TypeORM entities via @Index decorators.
 * These indexes complement the existing comprehensive indexes and focus on:
 * - TypeORM decorator-based indexes
 * - JSONB GIN indexes for PostgreSQL
 * - Partial indexes for better performance
 * - Multi-column composite indexes
 * - Full-text search indexes where applicable
 *
 * Entities covered:
 * - User authentication and sessions
 * - Menu and admin entities
 * - Marketplace orders and customers
 * - Notifications and licensing
 * - Partners and materials
 * - Query builder and audit logs
 */
export class CreateEntityDecoratorIndexes1740000003000 implements MigrationInterface {
  name = 'CreateEntityDecoratorIndexes1740000003000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =============================================================================
    // 1. USER ENTITY INDEXES
    // =============================================================================

    // Users table - Enhanced indexes from entity decorators
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_role_actif_createdat" 
      ON "users" ("role", "actif", "created_at") 
      WHERE "deleted_at" IS NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_dernier_login_not_null" 
      ON "users" ("dernier_login") 
      WHERE "dernier_login" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_refresh_token_partial" 
      ON "users" ("refreshToken") 
      WHERE "refreshToken" IS NOT NULL;
    `)

    // GIN index for JSONB metadata
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_metadata_gin" 
      ON "users" USING gin("metadata") 
      WHERE "metadata" IS NOT NULL;
    `)

    // =============================================================================
    // 2. USER SESSION ENTITY INDEXES
    // =============================================================================

    // User Sessions - Enhanced composite indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_userid_status_activity" 
      ON "user_sessions" ("userId", "status", "lastActivity");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_userid_isactive" 
      ON "user_sessions" ("userId", "isActive");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_status_activity" 
      ON "user_sessions" ("status", "lastActivity");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_ip_createdat" 
      ON "user_sessions" ("ipAddress", "created_at") 
      WHERE "ipAddress" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_refresh_token_partial" 
      ON "user_sessions" ("refreshToken") 
      WHERE "refreshToken" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_forced_logout_by" 
      ON "user_sessions" ("forcedLogoutBy") 
      WHERE "forcedLogoutBy" IS NOT NULL;
    `)

    // GIN indexes for JSONB fields
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_device_info_gin" 
      ON "user_sessions" USING gin("deviceInfo") 
      WHERE "deviceInfo" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_location_gin" 
      ON "user_sessions" USING gin("location") 
      WHERE "location" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_metadata_gin" 
      ON "user_sessions" USING gin("metadata") 
      WHERE "metadata" IS NOT NULL;
    `)

    // =============================================================================
    // 3. AUDIT LOG ENTITY INDEXES
    // =============================================================================

    // Enhanced audit log indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_userid_eventtype_success" 
      ON "audit_logs" ("userId", "eventType", "success");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_ip_timestamp" 
      ON "audit_logs" ("ipAddress", "timestamp") 
      WHERE "ipAddress" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_success_timestamp" 
      ON "audit_logs" ("success", "timestamp");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_sessionid" 
      ON "audit_logs" ("sessionId") 
      WHERE "sessionId" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_error_code" 
      ON "audit_logs" ("errorCode") 
      WHERE "errorCode" IS NOT NULL;
    `)

    // =============================================================================
    // 4. ROLE ENTITY INDEXES
    // =============================================================================

    // Role entity enhanced indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_roles_name_societeid" 
      ON "roles" ("name", "societeId");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_roles_societeid_isactive" 
      ON "roles" ("societeId", "isActive");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_roles_issystemrole_isactive" 
      ON "roles" ("isSystemRole", "isActive");
    `)

    // =============================================================================
    // 5. MENU ITEM ENTITY INDEXES
    // =============================================================================

    // Menu items enhanced composite indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_menu_items_configid_parentid" 
      ON "menu_items" ("configId", "parentId");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_menu_items_configid_orderindex" 
      ON "menu_items" ("configId", "orderIndex");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_menu_items_configid_visible_order" 
      ON "menu_items" ("configId", "isVisible", "orderIndex");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_menu_items_parentid_orderindex" 
      ON "menu_items" ("parentId", "orderIndex");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_menu_items_programid_partial" 
      ON "menu_items" ("programId") 
      WHERE "programId" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_menu_items_querybuild_partial" 
      ON "menu_items" ("queryBuilderId") 
      WHERE "queryBuilderId" IS NOT NULL;
    `)

    // =============================================================================
    // 6. MENU CONFIGURATION ENTITY INDEXES
    // =============================================================================

    // Menu configuration enhanced indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_menu_configs_isactive_issystem" 
      ON "menu_configurations" ("isactive", "issystem");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_menu_configs_metadata_gin" 
      ON "menu_configurations" USING gin("metadata") 
      WHERE "metadata" IS NOT NULL;
    `)

    // =============================================================================
    // 7. MARKETPLACE ORDER ENTITY INDEXES
    // =============================================================================

    // Marketplace orders enhanced indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_customerid_status" 
      ON "marketplace_orders" ("customer_id", "status");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_status_createdat" 
      ON "marketplace_orders" ("status", "created_at");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_payment_status_paid" 
      ON "marketplace_orders" ("payment_status", "paid_at");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_moderation_assigned" 
      ON "marketplace_orders" ("moderation_status", "assigned_moderator");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_tenant_status_created" 
      ON "marketplace_orders" ("tenant_id", "status", "created_at");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_customerid_createdat" 
      ON "marketplace_orders" ("customer_id", "created_at");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_payment_intent_partial" 
      ON "marketplace_orders" ("payment_intent_id") 
      WHERE "payment_intent_id" IS NOT NULL;
    `)

    // GIN indexes for JSONB fields
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_promotions_gin" 
      ON "marketplace_orders" USING gin("applied_promotions") 
      WHERE "applied_promotions" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_metadata_gin" 
      ON "marketplace_orders" USING gin("metadata") 
      WHERE "metadata" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_orders_status_history_gin" 
      ON "marketplace_orders" USING gin("status_history") 
      WHERE "status_history" IS NOT NULL;
    `)

    // =============================================================================
    // 8. MARKETPLACE CUSTOMER ENTITY INDEXES
    // =============================================================================

    // Marketplace customers enhanced indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_tenantid_isactive" 
      ON "marketplace_customers" ("tenant_id", "is_active");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_group_tier" 
      ON "marketplace_customers" ("customer_group", "loyalty_tier");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_marketplace_customers_email_verified_active" 
      ON "marketplace_customers" ("email_verified", "is_active");
    `)

    // =============================================================================
    // 9. NOTIFICATION RULE ENTITY INDEXES
    // =============================================================================

    // Notification rules enhanced indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notification_rules_active_trigger" 
      ON "notification_rules" ("isActive", "trigger");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notification_rules_createdby_active" 
      ON "notification_rules" ("createdBy", "isActive");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notification_rules_modifiedby_modified" 
      ON "notification_rules" ("modifiedBy", "lastModified");
    `)

    // GIN indexes for JSONB fields
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notification_rules_trigger_gin" 
      ON "notification_rules" USING gin("trigger");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notification_rules_conditions_gin" 
      ON "notification_rules" USING gin("conditions");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notification_rules_config_gin" 
      ON "notification_rules" USING gin("notification");
    `)

    // =============================================================================
    // 10. LICENSE ENTITY INDEXES
    // =============================================================================

    // License entity enhanced indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_licenses_societeid_status" 
      ON "licenses" ("societeId", "status");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_licenses_status_expiresat" 
      ON "licenses" ("status", "expiresAt");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_licenses_billing_renewal" 
      ON "licenses" ("billingCycle", "nextRenewalAt");
    `)

    // GIN indexes for JSONB fields
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_licenses_restrictions_gin" 
      ON "licenses" USING gin("restrictions");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_licenses_metadata_gin" 
      ON "licenses" USING gin("metadata");
    `)

    // =============================================================================
    // 11. MATERIAL ENTITY INDEXES
    // =============================================================================

    // Materials enhanced indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_type_status" 
      ON "materials" ("type", "status");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_forme_type" 
      ON "materials" ("forme", "type");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_status_stock" 
      ON "materials" ("status", "stockPhysique");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_societeid_status_type" 
      ON "materials" ("societeId", "status", "type");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_stock_level" 
      ON "materials" ("stockMini", "stockPhysique");
    `)

    // GIN indexes for JSONB fields
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_dimensions_gin" 
      ON "materials" USING gin("dimensions");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_mechanical_props_gin" 
      ON "materials" USING gin("proprietesMecaniques");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_physical_props_gin" 
      ON "materials" USING gin("proprietesPhysiques");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_chemical_props_gin" 
      ON "materials" USING gin("proprietesChimiques");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_certifications_gin" 
      ON "materials" USING gin("certifications");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_supply_info_gin" 
      ON "materials" USING gin("informationsApprovisionnement");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_production_info_gin" 
      ON "materials" USING gin("informationsProduction");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_metadonnees_gin" 
      ON "materials" USING gin("metadonnees") 
      WHERE "metadonnees" IS NOT NULL;
    `)

    // =============================================================================
    // 12. PARTNER ENTITY INDEXES
    // =============================================================================

    // Partners enhanced indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_partners_type_status" 
      ON "partners" ("type", "status");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_partners_category_status" 
      ON "partners" ("category", "status");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_partners_societeid_type_status" 
      ON "partners" ("societeId", "type", "status");
    `)

    // GIN indexes for JSONB fields
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_partners_notes_gin" 
      ON "partners" USING gin("notes");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_partners_donnees_techniques_gin" 
      ON "partners" USING gin("donneesTechniques");
    `)

    // =============================================================================
    // 13. QUERY BUILDER ENTITY INDEXES
    // =============================================================================

    // Query builder enhanced indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_query_builders_createdby_public" 
      ON "query_builders" ("createdById", "isPublic");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_query_builders_database_maintable" 
      ON "query_builders" ("database", "mainTable");
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_query_builders_public_created" 
      ON "query_builders" ("isPublic", "created_at");
    `)

    // GIN indexes for JSONB fields
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_query_builders_settings_gin" 
      ON "query_builders" USING gin("settings") 
      WHERE "settings" IS NOT NULL;
    `)

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_query_builders_layout_gin" 
      ON "query_builders" USING gin("layout") 
      WHERE "layout" IS NOT NULL;
    `)

    // =============================================================================
    // 14. PERFORMANCE MONITORING VIEWS (Optional)
    // =============================================================================

    // Create a view for index usage monitoring
    await queryRunner.query(`
      CREATE OR REPLACE VIEW vw_index_usage_stats AS
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC, idx_tup_read DESC;
    `)

    // biome-ignore lint/suspicious/noConsole: Migration progress logging is necessary
    console.log('✅ Entity decorator indexes created successfully')
    // biome-ignore lint/suspicious/noConsole: Migration progress logging is necessary
    console.log('📊 To monitor index usage, query: SELECT * FROM vw_index_usage_stats;')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // biome-ignore lint/suspicious/noConsole: Migration progress logging is necessary
    console.log('🔄 Dropping entity decorator indexes...')

    // Drop monitoring view
    await queryRunner.query(`DROP VIEW IF EXISTS vw_index_usage_stats;`)

    // Drop Query Builder indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_query_builders_layout_gin";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_query_builders_settings_gin";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_query_builders_public_created";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_query_builders_database_maintable";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_query_builders_createdby_public";`
    )

    // Drop Partner indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_partners_donnees_techniques_gin";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_partners_notes_gin";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_partners_societeid_type_status";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_partners_category_status";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_partners_type_status";`)

    // Drop Material indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_metadonnees_gin";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_production_info_gin";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_supply_info_gin";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_certifications_gin";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_chemical_props_gin";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_physical_props_gin";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_mechanical_props_gin";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_dimensions_gin";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_stock_level";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_societeid_status_type";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_status_stock";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_forme_type";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_materials_type_status";`)

    // Drop License indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_licenses_metadata_gin";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_licenses_restrictions_gin";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_licenses_billing_renewal";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_licenses_status_expiresat";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_licenses_societeid_status";`)

    // Drop Notification Rule indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_notification_rules_config_gin";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_notification_rules_conditions_gin";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_notification_rules_trigger_gin";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_notification_rules_modifiedby_modified";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_notification_rules_createdby_active";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_notification_rules_active_trigger";`
    )

    // Drop Marketplace Customer indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_email_verified_active";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_group_tier";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_customers_tenantid_isactive";`
    )

    // Drop Marketplace Order indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_status_history_gin";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_metadata_gin";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_promotions_gin";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_payment_intent_partial";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_customerid_createdat";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_tenant_status_created";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_moderation_assigned";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_payment_status_paid";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_status_createdat";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_marketplace_orders_customerid_status";`
    )

    // Drop Menu Configuration indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_menu_configs_metadata_gin";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_menu_configs_isactive_issystem";`
    )

    // Drop Menu Item indexes
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_menu_items_querybuild_partial";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_menu_items_programid_partial";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_menu_items_parentid_orderindex";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_menu_items_configid_visible_order";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_menu_items_configid_orderindex";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_menu_items_configid_parentid";`)

    // Drop Role indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_roles_issystemrole_isactive";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_roles_societeid_isactive";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_roles_name_societeid";`)

    // Drop Audit Log indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_error_code";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_sessionid";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_success_timestamp";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_ip_timestamp";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_userid_eventtype_success";`
    )

    // Drop User Session indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_metadata_gin";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_location_gin";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_device_info_gin";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_forced_logout_by";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_refresh_token_partial";`
    )
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_ip_createdat";`)
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_status_activity";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_userid_isactive";`
    )
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "idx_user_sessions_userid_status_activity";`
    )

    // Drop User indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_users_metadata_gin";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_users_refresh_token_partial";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_users_dernier_login_not_null";`)
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_users_role_actif_createdat";`)

    // biome-ignore lint/suspicious/noConsole: Migration progress logging is necessary
    console.log('✅ Entity decorator indexes dropped successfully')
  }
}
