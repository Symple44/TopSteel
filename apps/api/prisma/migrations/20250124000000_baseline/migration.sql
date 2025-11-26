-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'PERPETUAL');

-- CreateEnum
CREATE TYPE "FeatureCategory" AS ENUM ('CORE', 'INVENTORY', 'PRODUCTION', 'SALES', 'FINANCE', 'REPORTING', 'INTEGRATION', 'CUSTOMIZATION', 'SECURITY', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ActivationStatus" AS ENUM ('PENDING', 'ACTIVE', 'DEACTIVATED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "UsageMetricType" AS ENUM ('USERS', 'TRANSACTIONS', 'STORAGE', 'API_CALLS', 'MODULES', 'SITES', 'DOCUMENTS', 'EMAILS', 'SMS', 'CUSTOM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "nom" VARCHAR(255),
    "prenom" VARCHAR(255),
    "role" VARCHAR(50) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "acronyme" VARCHAR(255),
    "dernier_login" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMP(3),
    "refreshToken" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "access_token" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(255),
    "login_time" TIMESTAMP(3) NOT NULL,
    "logout_time" TIMESTAMP(3),
    "last_activity" TIMESTAMP(3) NOT NULL,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "device_info" JSONB,
    "location" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_idle" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "warning_count" INTEGER NOT NULL DEFAULT 0,
    "forced_logout_by" TEXT,
    "forced_logout_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mfa" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "secret" VARCHAR(255),
    "backup_codes" VARCHAR(255),
    "phone_number" VARCHAR(50),
    "email" VARCHAR(255),
    "webauthn_credentials" JSONB,
    "metadata" JSONB,
    "last_used_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_mfa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mfa_type" VARCHAR(50) NOT NULL,
    "challenge" VARCHAR(255) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mfa_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "societe_id" TEXT,
    "parent_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "module" VARCHAR(100) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100),
    "societe_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_societe_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permissions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "activated_at" TIMESTAMP(3),
    "deactivated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_societe_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "societe_id" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resource_id" TEXT,
    "description" TEXT,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" TEXT NOT NULL,
    "phone_number" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "provider" VARCHAR(50),
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profile" JSONB,
    "company" JSONB,
    "preferences" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "societes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "legal_name" VARCHAR(255),
    "siret" VARCHAR(50),
    "address" TEXT,
    "city" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "database_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "societes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "societe_licenses" (
    "id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "max_users" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "restrictions" JSONB,
    "billing" JSONB,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "societe_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "societe_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "permissions" JSONB,
    "preferences" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "societe_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "societe_id" TEXT,
    "value" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_parameters" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "societe_id" TEXT,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_configurations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "societe_id" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "menu_configuration_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "label" VARCHAR(255) NOT NULL,
    "icon" VARCHAR(100),
    "path" VARCHAR(500),
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_roles" (
    "id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_permissions" (
    "id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_menu_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "societe_id" TEXT,
    "theme" VARCHAR(50),
    "layout" VARCHAR(50),
    "custom_colors" JSONB,
    "shortcuts" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_menu_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_menu_item_preferences" (
    "id" TEXT NOT NULL,
    "user_menu_preferences_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER,
    "custom_label" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_menu_item_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_configurations_simple" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "societe_id" TEXT,
    "config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_configurations_simple_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_menu_preference" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "societe_id" TEXT,
    "menu_data" JSONB NOT NULL,
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_menu_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovered_pages" (
    "id" TEXT NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "icon" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovered_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parameter_system" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "societe_id" TEXT,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "value" TEXT,
    "default_value" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "validation" TEXT,
    "metadata" JSONB,
    "array_values" JSONB,
    "object_values" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parameter_system_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parameter_application" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "societe_id" TEXT,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "value" TEXT,
    "default_value" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "business_rules" JSONB,
    "metadata" JSONB,
    "array_values" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parameter_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parameter_client" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "societe_id" TEXT,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "value" TEXT,
    "default_value" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "constraints" JSONB,
    "metadata" JSONB,
    "array_values" JSONB,
    "object_values" JSONB,
    "custom_translations" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parameter_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "category" VARCHAR(100),
    "priority" VARCHAR(50),
    "data" JSONB,
    "action_url" VARCHAR(500),
    "action_label" VARCHAR(100),
    "read_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_events" (
    "id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "data" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "processing_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "template" TEXT NOT NULL,
    "variables" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "categories" JSONB,
    "priorities" JSONB,
    "schedules" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_rules" (
    "id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trigger" JSONB NOT NULL,
    "conditions" JSONB,
    "actions" JSONB,
    "notification" JSONB,
    "last_triggered" TEXT,
    "trigger_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_rule_executions" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "notification_id" TEXT,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "execution_time" INTEGER,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_rule_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_reads" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_builders" (
    "id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "base_table" VARCHAR(255) NOT NULL,
    "created_by" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "layout" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "query_builders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_builder_columns" (
    "id" TEXT NOT NULL,
    "query_builder_id" TEXT NOT NULL,
    "column_name" VARCHAR(255) NOT NULL,
    "alias" VARCHAR(255),
    "data_type" VARCHAR(50),
    "format" JSONB,
    "aggregation" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "query_builder_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_builder_joins" (
    "id" TEXT NOT NULL,
    "query_builder_id" TEXT NOT NULL,
    "join_table" VARCHAR(255) NOT NULL,
    "join_type" VARCHAR(50) NOT NULL,
    "condition" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "query_builder_joins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_builder_calculated_fields" (
    "id" TEXT NOT NULL,
    "query_builder_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "expression" TEXT NOT NULL,
    "data_type" VARCHAR(50) NOT NULL,
    "format" JSONB,
    "dependencies" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "query_builder_calculated_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_builder_permissions" (
    "id" TEXT NOT NULL,
    "query_builder_id" TEXT NOT NULL,
    "user_id" TEXT,
    "role_id" TEXT,
    "can_view" BOOLEAN NOT NULL DEFAULT true,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_share" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_builder_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "license_key" VARCHAR(255) NOT NULL,
    "societe_id" TEXT NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_email" VARCHAR(255) NOT NULL,
    "type" "LicenseType" NOT NULL DEFAULT 'BASIC',
    "status" "LicenseStatus" NOT NULL DEFAULT 'PENDING',
    "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'ANNUAL',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "last_renewal_at" TIMESTAMP(3),
    "next_renewal_at" TIMESTAMP(3),
    "max_users" INTEGER NOT NULL DEFAULT 1,
    "max_sites" INTEGER NOT NULL DEFAULT 1,
    "max_transactions" INTEGER NOT NULL DEFAULT -1,
    "max_storage" INTEGER NOT NULL DEFAULT -1,
    "max_api_calls" INTEGER NOT NULL DEFAULT 1,
    "allow_custom_modules" BOOLEAN NOT NULL DEFAULT false,
    "allow_api_access" BOOLEAN NOT NULL DEFAULT false,
    "allow_white_label" BOOLEAN NOT NULL DEFAULT false,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "price" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "restrictions" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "signature" VARCHAR(500),
    "activated_at" TIMESTAMP(3),
    "activated_by" TEXT,
    "suspended_at" TIMESTAMP(3),
    "suspended_reason" VARCHAR(500),
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_features" (
    "id" TEXT NOT NULL,
    "license_id" TEXT NOT NULL,
    "feature_code" VARCHAR(100) NOT NULL,
    "feature_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" "FeatureCategory" NOT NULL DEFAULT 'CORE',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "limit" INTEGER,
    "used" INTEGER NOT NULL DEFAULT 0,
    "enabled_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_activations" (
    "id" TEXT NOT NULL,
    "license_id" TEXT NOT NULL,
    "activation_key" VARCHAR(255) NOT NULL,
    "machine_id" VARCHAR(255) NOT NULL,
    "machine_name" VARCHAR(255),
    "os_type" VARCHAR(100),
    "os_version" VARCHAR(100),
    "hostname" VARCHAR(255),
    "ip_address" INET,
    "mac_address" VARCHAR(17),
    "status" "ActivationStatus" NOT NULL DEFAULT 'PENDING',
    "activated_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3),
    "deactivated_at" TIMESTAMP(3),
    "deactivation_reason" VARCHAR(500),
    "heartbeat_count" INTEGER NOT NULL DEFAULT 0,
    "max_heartbeat_interval" INTEGER,
    "hardware_info" JSONB,
    "software_info" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_activations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_usage" (
    "id" TEXT NOT NULL,
    "license_id" TEXT NOT NULL,
    "metric_type" "UsageMetricType" NOT NULL,
    "metric_name" VARCHAR(100),
    "value" INTEGER NOT NULL,
    "limit" INTEGER,
    "percentage" DECIMAL(5,2),
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER,
    "week" INTEGER,
    "month" INTEGER,
    "year" INTEGER,
    "breakdown" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_acronyme_key" ON "users"("acronyme");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_actif_idx" ON "users"("actif");

-- CreateIndex
CREATE INDEX "users_acronyme_idx" ON "users"("acronyme");

-- CreateIndex
CREATE INDEX "users_dernier_login_idx" ON "users"("dernier_login");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_role_actif_created_at_idx" ON "users"("role", "actif", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_id_key" ON "user_sessions"("session_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_status_last_activity_idx" ON "user_sessions"("user_id", "status", "last_activity");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_is_active_idx" ON "user_sessions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_sessions_status_last_activity_idx" ON "user_sessions"("status", "last_activity");

-- CreateIndex
CREATE INDEX "user_sessions_ip_address_created_at_idx" ON "user_sessions"("ip_address", "created_at");

-- CreateIndex
CREATE INDEX "user_mfa_user_id_idx" ON "user_mfa"("user_id");

-- CreateIndex
CREATE INDEX "user_mfa_type_idx" ON "user_mfa"("type");

-- CreateIndex
CREATE INDEX "user_mfa_is_enabled_idx" ON "user_mfa"("is_enabled");

-- CreateIndex
CREATE INDEX "user_mfa_is_verified_idx" ON "user_mfa"("is_verified");

-- CreateIndex
CREATE INDEX "user_mfa_last_used_at_idx" ON "user_mfa"("last_used_at");

-- CreateIndex
CREATE INDEX "mfa_sessions_user_id_idx" ON "mfa_sessions"("user_id");

-- CreateIndex
CREATE INDEX "mfa_sessions_expires_at_idx" ON "mfa_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "mfa_sessions_verified_idx" ON "mfa_sessions"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_societe_id_idx" ON "roles"("societe_id");

-- CreateIndex
CREATE INDEX "roles_is_active_idx" ON "roles"("is_active");

-- CreateIndex
CREATE INDEX "roles_is_system_idx" ON "roles"("is_system");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_name_idx" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "permissions_societe_id_idx" ON "permissions"("societe_id");

-- CreateIndex
CREATE INDEX "permissions_is_active_idx" ON "permissions"("is_active");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");

-- CreateIndex
CREATE INDEX "groups_name_idx" ON "groups"("name");

-- CreateIndex
CREATE INDEX "groups_is_active_idx" ON "groups"("is_active");

-- CreateIndex
CREATE INDEX "user_groups_user_id_idx" ON "user_groups"("user_id");

-- CreateIndex
CREATE INDEX "user_groups_group_id_idx" ON "user_groups"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_user_id_group_id_key" ON "user_groups"("user_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "modules"("name");

-- CreateIndex
CREATE INDEX "modules_name_idx" ON "modules"("name");

-- CreateIndex
CREATE INDEX "modules_order_idx" ON "modules"("order");

-- CreateIndex
CREATE INDEX "user_societe_roles_user_id_idx" ON "user_societe_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_societe_roles_societe_id_idx" ON "user_societe_roles"("societe_id");

-- CreateIndex
CREATE INDEX "user_societe_roles_role_id_idx" ON "user_societe_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_societe_roles_is_active_idx" ON "user_societe_roles"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_societe_roles_user_id_societe_id_role_id_key" ON "user_societe_roles"("user_id", "societe_id", "role_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_societe_id_idx" ON "audit_logs"("societe_id");

-- CreateIndex
CREATE INDEX "audit_logs_societe_id_created_at_idx" ON "audit_logs"("societe_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "sms_logs_phone_number_idx" ON "sms_logs"("phone_number");

-- CreateIndex
CREATE INDEX "sms_logs_status_idx" ON "sms_logs"("status");

-- CreateIndex
CREATE INDEX "sms_logs_created_at_idx" ON "sms_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "societes_code_key" ON "societes"("code");

-- CreateIndex
CREATE INDEX "societes_code_idx" ON "societes"("code");

-- CreateIndex
CREATE INDEX "societes_is_active_idx" ON "societes"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "societe_licenses_societe_id_key" ON "societe_licenses"("societe_id");

-- CreateIndex
CREATE INDEX "societe_licenses_societe_id_idx" ON "societe_licenses"("societe_id");

-- CreateIndex
CREATE INDEX "societe_licenses_status_idx" ON "societe_licenses"("status");

-- CreateIndex
CREATE INDEX "societe_users_user_id_idx" ON "societe_users"("user_id");

-- CreateIndex
CREATE INDEX "societe_users_societe_id_idx" ON "societe_users"("societe_id");

-- CreateIndex
CREATE INDEX "societe_users_is_active_idx" ON "societe_users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "societe_users_user_id_societe_id_key" ON "societe_users"("user_id", "societe_id");

-- CreateIndex
CREATE INDEX "sites_societe_id_idx" ON "sites"("societe_id");

-- CreateIndex
CREATE INDEX "sites_code_idx" ON "sites"("code");

-- CreateIndex
CREATE INDEX "sites_is_active_idx" ON "sites"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "sites_societe_id_code_key" ON "sites"("societe_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_societe_id_idx" ON "system_settings"("societe_id");

-- CreateIndex
CREATE INDEX "system_settings_societe_id_category_idx" ON "system_settings"("societe_id", "category");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "system_parameters_key_key" ON "system_parameters"("key");

-- CreateIndex
CREATE INDEX "system_parameters_key_idx" ON "system_parameters"("key");

-- CreateIndex
CREATE INDEX "system_parameters_societe_id_idx" ON "system_parameters"("societe_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_configurations_name_key" ON "menu_configurations"("name");

-- CreateIndex
CREATE INDEX "menu_configurations_is_active_idx" ON "menu_configurations"("is_active");

-- CreateIndex
CREATE INDEX "menu_configurations_societe_id_idx" ON "menu_configurations"("societe_id");

-- CreateIndex
CREATE INDEX "menu_configurations_societe_id_is_active_idx" ON "menu_configurations"("societe_id", "is_active");

-- CreateIndex
CREATE INDEX "menu_configurations_is_default_idx" ON "menu_configurations"("is_default");

-- CreateIndex
CREATE INDEX "menu_items_menu_configuration_id_idx" ON "menu_items"("menu_configuration_id");

-- CreateIndex
CREATE INDEX "menu_items_parent_id_idx" ON "menu_items"("parent_id");

-- CreateIndex
CREATE INDEX "menu_items_order_idx" ON "menu_items"("order");

-- CreateIndex
CREATE INDEX "menu_item_roles_menu_item_id_idx" ON "menu_item_roles"("menu_item_id");

-- CreateIndex
CREATE INDEX "menu_item_roles_role_id_idx" ON "menu_item_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_roles_menu_item_id_role_id_key" ON "menu_item_roles"("menu_item_id", "role_id");

-- CreateIndex
CREATE INDEX "menu_item_permissions_menu_item_id_idx" ON "menu_item_permissions"("menu_item_id");

-- CreateIndex
CREATE INDEX "menu_item_permissions_permission_id_idx" ON "menu_item_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_permissions_menu_item_id_permission_id_key" ON "menu_item_permissions"("menu_item_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_menu_preferences_user_id_key" ON "user_menu_preferences"("user_id");

-- CreateIndex
CREATE INDEX "user_menu_item_preferences_user_menu_preferences_id_idx" ON "user_menu_item_preferences"("user_menu_preferences_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_menu_item_preferences_user_menu_preferences_id_menu_it_key" ON "user_menu_item_preferences"("user_menu_preferences_id", "menu_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_configurations_simple_name_key" ON "menu_configurations_simple"("name");

-- CreateIndex
CREATE INDEX "menu_configurations_simple_societe_id_idx" ON "menu_configurations_simple"("societe_id");

-- CreateIndex
CREATE INDEX "user_menu_preference_societe_id_user_id_idx" ON "user_menu_preference"("societe_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_menu_preference_user_id_key" ON "user_menu_preference"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "discovered_pages_path_key" ON "discovered_pages"("path");

-- CreateIndex
CREATE INDEX "discovered_pages_path_idx" ON "discovered_pages"("path");

-- CreateIndex
CREATE INDEX "discovered_pages_category_idx" ON "discovered_pages"("category");

-- CreateIndex
CREATE UNIQUE INDEX "parameter_system_code_key" ON "parameter_system"("code");

-- CreateIndex
CREATE INDEX "parameter_system_code_idx" ON "parameter_system"("code");

-- CreateIndex
CREATE INDEX "parameter_system_societe_id_idx" ON "parameter_system"("societe_id");

-- CreateIndex
CREATE INDEX "parameter_system_societe_id_category_idx" ON "parameter_system"("societe_id", "category");

-- CreateIndex
CREATE INDEX "parameter_system_category_idx" ON "parameter_system"("category");

-- CreateIndex
CREATE UNIQUE INDEX "parameter_application_code_key" ON "parameter_application"("code");

-- CreateIndex
CREATE INDEX "parameter_application_code_idx" ON "parameter_application"("code");

-- CreateIndex
CREATE INDEX "parameter_application_societe_id_idx" ON "parameter_application"("societe_id");

-- CreateIndex
CREATE INDEX "parameter_application_societe_id_category_idx" ON "parameter_application"("societe_id", "category");

-- CreateIndex
CREATE INDEX "parameter_application_category_idx" ON "parameter_application"("category");

-- CreateIndex
CREATE UNIQUE INDEX "parameter_client_code_key" ON "parameter_client"("code");

-- CreateIndex
CREATE INDEX "parameter_client_code_idx" ON "parameter_client"("code");

-- CreateIndex
CREATE INDEX "parameter_client_societe_id_idx" ON "parameter_client"("societe_id");

-- CreateIndex
CREATE INDEX "parameter_client_societe_id_category_idx" ON "parameter_client"("societe_id", "category");

-- CreateIndex
CREATE INDEX "parameter_client_category_idx" ON "parameter_client"("category");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_societe_id_idx" ON "notifications"("societe_id");

-- CreateIndex
CREATE INDEX "notifications_societe_id_user_id_idx" ON "notifications"("societe_id", "user_id");

-- CreateIndex
CREATE INDEX "notifications_societe_id_type_idx" ON "notifications"("societe_id", "type");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_category_idx" ON "notifications"("category");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_read_at_idx" ON "notifications"("read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notification_events_type_idx" ON "notification_events"("type");

-- CreateIndex
CREATE INDEX "notification_events_societe_id_idx" ON "notification_events"("societe_id");

-- CreateIndex
CREATE INDEX "notification_events_societe_id_type_idx" ON "notification_events"("societe_id", "type");

-- CreateIndex
CREATE INDEX "notification_events_source_idx" ON "notification_events"("source");

-- CreateIndex
CREATE INDEX "notification_events_processed_idx" ON "notification_events"("processed");

-- CreateIndex
CREATE INDEX "notification_events_created_at_idx" ON "notification_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notification_templates_code_idx" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notification_templates_societe_id_idx" ON "notification_templates"("societe_id");

-- CreateIndex
CREATE INDEX "notification_templates_societe_id_code_idx" ON "notification_templates"("societe_id", "code");

-- CreateIndex
CREATE INDEX "notification_templates_type_idx" ON "notification_templates"("type");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_user_id_key" ON "notification_settings"("user_id");

-- CreateIndex
CREATE INDEX "notification_rules_type_idx" ON "notification_rules"("type");

-- CreateIndex
CREATE INDEX "notification_rules_societe_id_idx" ON "notification_rules"("societe_id");

-- CreateIndex
CREATE INDEX "notification_rules_societe_id_type_idx" ON "notification_rules"("societe_id", "type");

-- CreateIndex
CREATE INDEX "notification_rules_enabled_idx" ON "notification_rules"("enabled");

-- CreateIndex
CREATE INDEX "notification_rules_is_active_idx" ON "notification_rules"("is_active");

-- CreateIndex
CREATE INDEX "notification_rule_executions_rule_id_idx" ON "notification_rule_executions"("rule_id");

-- CreateIndex
CREATE INDEX "notification_rule_executions_notification_id_idx" ON "notification_rule_executions"("notification_id");

-- CreateIndex
CREATE INDEX "notification_rule_executions_triggered_idx" ON "notification_rule_executions"("triggered");

-- CreateIndex
CREATE INDEX "notification_rule_executions_created_at_idx" ON "notification_rule_executions"("created_at");

-- CreateIndex
CREATE INDEX "notification_reads_notification_id_idx" ON "notification_reads"("notification_id");

-- CreateIndex
CREATE INDEX "notification_reads_user_id_idx" ON "notification_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_reads_notification_id_user_id_key" ON "notification_reads"("notification_id", "user_id");

-- CreateIndex
CREATE INDEX "query_builders_created_by_idx" ON "query_builders"("created_by");

-- CreateIndex
CREATE INDEX "query_builders_societe_id_idx" ON "query_builders"("societe_id");

-- CreateIndex
CREATE INDEX "query_builders_societe_id_created_by_idx" ON "query_builders"("societe_id", "created_by");

-- CreateIndex
CREATE INDEX "query_builders_is_public_idx" ON "query_builders"("is_public");

-- CreateIndex
CREATE INDEX "query_builders_is_active_idx" ON "query_builders"("is_active");

-- CreateIndex
CREATE INDEX "query_builder_columns_query_builder_id_idx" ON "query_builder_columns"("query_builder_id");

-- CreateIndex
CREATE INDEX "query_builder_columns_order_idx" ON "query_builder_columns"("order");

-- CreateIndex
CREATE INDEX "query_builder_joins_query_builder_id_idx" ON "query_builder_joins"("query_builder_id");

-- CreateIndex
CREATE INDEX "query_builder_calculated_fields_query_builder_id_idx" ON "query_builder_calculated_fields"("query_builder_id");

-- CreateIndex
CREATE INDEX "query_builder_permissions_query_builder_id_idx" ON "query_builder_permissions"("query_builder_id");

-- CreateIndex
CREATE INDEX "query_builder_permissions_user_id_idx" ON "query_builder_permissions"("user_id");

-- CreateIndex
CREATE INDEX "query_builder_permissions_role_id_idx" ON "query_builder_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "query_builder_permissions_query_builder_id_user_id_key" ON "query_builder_permissions"("query_builder_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "query_builder_permissions_query_builder_id_role_id_key" ON "query_builder_permissions"("query_builder_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_license_key_key" ON "licenses"("license_key");

-- CreateIndex
CREATE INDEX "licenses_license_key_idx" ON "licenses"("license_key");

-- CreateIndex
CREATE INDEX "licenses_societe_id_idx" ON "licenses"("societe_id");

-- CreateIndex
CREATE INDEX "licenses_status_idx" ON "licenses"("status");

-- CreateIndex
CREATE INDEX "licenses_expires_at_idx" ON "licenses"("expires_at");

-- CreateIndex
CREATE INDEX "licenses_type_idx" ON "licenses"("type");

-- CreateIndex
CREATE INDEX "licenses_societe_id_status_idx" ON "licenses"("societe_id", "status");

-- CreateIndex
CREATE INDEX "licenses_status_expires_at_idx" ON "licenses"("status", "expires_at");

-- CreateIndex
CREATE INDEX "licenses_customer_email_idx" ON "licenses"("customer_email");

-- CreateIndex
CREATE INDEX "licenses_billing_cycle_next_renewal_at_idx" ON "licenses"("billing_cycle", "next_renewal_at");

-- CreateIndex
CREATE INDEX "licenses_activated_at_idx" ON "licenses"("activated_at");

-- CreateIndex
CREATE INDEX "licenses_suspended_at_idx" ON "licenses"("suspended_at");

-- CreateIndex
CREATE INDEX "licenses_created_by_idx" ON "licenses"("created_by");

-- CreateIndex
CREATE INDEX "license_features_license_id_idx" ON "license_features"("license_id");

-- CreateIndex
CREATE INDEX "license_features_feature_code_idx" ON "license_features"("feature_code");

-- CreateIndex
CREATE INDEX "license_features_category_idx" ON "license_features"("category");

-- CreateIndex
CREATE UNIQUE INDEX "license_features_license_id_feature_code_key" ON "license_features"("license_id", "feature_code");

-- CreateIndex
CREATE UNIQUE INDEX "license_activations_activation_key_key" ON "license_activations"("activation_key");

-- CreateIndex
CREATE INDEX "license_activations_license_id_machine_id_idx" ON "license_activations"("license_id", "machine_id");

-- CreateIndex
CREATE INDEX "license_activations_activation_key_idx" ON "license_activations"("activation_key");

-- CreateIndex
CREATE INDEX "license_activations_status_idx" ON "license_activations"("status");

-- CreateIndex
CREATE INDEX "license_activations_machine_id_idx" ON "license_activations"("machine_id");

-- CreateIndex
CREATE INDEX "license_usage_license_id_recorded_at_idx" ON "license_usage"("license_id", "recorded_at");

-- CreateIndex
CREATE INDEX "license_usage_license_id_metric_type_idx" ON "license_usage"("license_id", "metric_type");

-- CreateIndex
CREATE INDEX "license_usage_recorded_at_idx" ON "license_usage"("recorded_at");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_forced_logout_by_fkey" FOREIGN KEY ("forced_logout_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mfa" ADD CONSTRAINT "user_mfa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_sessions" ADD CONSTRAINT "mfa_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_societe_roles" ADD CONSTRAINT "user_societe_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_societe_roles" ADD CONSTRAINT "user_societe_roles_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_societe_roles" ADD CONSTRAINT "user_societe_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "societe_licenses" ADD CONSTRAINT "societe_licenses_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "societe_users" ADD CONSTRAINT "societe_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "societe_users" ADD CONSTRAINT "societe_users_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_parameters" ADD CONSTRAINT "system_parameters_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_configurations" ADD CONSTRAINT "menu_configurations_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_configuration_id_fkey" FOREIGN KEY ("menu_configuration_id") REFERENCES "menu_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_roles" ADD CONSTRAINT "menu_item_roles_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_roles" ADD CONSTRAINT "menu_item_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_permissions" ADD CONSTRAINT "menu_item_permissions_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_permissions" ADD CONSTRAINT "menu_item_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_menu_preferences" ADD CONSTRAINT "user_menu_preferences_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_menu_item_preferences" ADD CONSTRAINT "user_menu_item_preferences_user_menu_preferences_id_fkey" FOREIGN KEY ("user_menu_preferences_id") REFERENCES "user_menu_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_configurations_simple" ADD CONSTRAINT "menu_configurations_simple_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_menu_preference" ADD CONSTRAINT "user_menu_preference_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parameter_system" ADD CONSTRAINT "parameter_system_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parameter_application" ADD CONSTRAINT "parameter_application_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parameter_client" ADD CONSTRAINT "parameter_client_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rules" ADD CONSTRAINT "notification_rules_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule_executions" ADD CONSTRAINT "notification_rule_executions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "notification_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule_executions" ADD CONSTRAINT "notification_rule_executions_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_builders" ADD CONSTRAINT "query_builders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_builders" ADD CONSTRAINT "query_builders_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_builder_columns" ADD CONSTRAINT "query_builder_columns_query_builder_id_fkey" FOREIGN KEY ("query_builder_id") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_builder_joins" ADD CONSTRAINT "query_builder_joins_query_builder_id_fkey" FOREIGN KEY ("query_builder_id") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_builder_calculated_fields" ADD CONSTRAINT "query_builder_calculated_fields_query_builder_id_fkey" FOREIGN KEY ("query_builder_id") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_builder_permissions" ADD CONSTRAINT "query_builder_permissions_query_builder_id_fkey" FOREIGN KEY ("query_builder_id") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_builder_permissions" ADD CONSTRAINT "query_builder_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_builder_permissions" ADD CONSTRAINT "query_builder_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_features" ADD CONSTRAINT "license_features_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_activations" ADD CONSTRAINT "license_activations_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_usage" ADD CONSTRAINT "license_usage_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

