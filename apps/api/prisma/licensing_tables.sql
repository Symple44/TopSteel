-- SQL Script to Create Licensing Tables Only
-- Generated from Prisma schema - Licensing domain
-- Date: 2025-11-19

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE "LicenseType" AS ENUM ('TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "LicenseStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'PERPETUAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FeatureCategory" AS ENUM ('CORE', 'INVENTORY', 'PRODUCTION', 'SALES', 'FINANCE', 'REPORTING', 'INTEGRATION', 'CUSTOMIZATION', 'SECURITY', 'SUPPORT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActivationStatus" AS ENUM ('PENDING', 'ACTIVE', 'DEACTIVATED', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UsageMetricType" AS ENUM ('USERS', 'TRANSACTIONS', 'STORAGE', 'API_CALLS', 'MODULES', 'SITES', 'DOCUMENTS', 'EMAILS', 'SMS', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- License Table
CREATE TABLE IF NOT EXISTS "licenses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "license_key" VARCHAR(255) NOT NULL UNIQUE,
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
  "price" DECIMAL(10, 2),
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

  CONSTRAINT "licenses_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- License Features Table
CREATE TABLE IF NOT EXISTS "license_features" (
  "id" TEXT NOT NULL PRIMARY KEY,
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

  CONSTRAINT "license_features_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "license_features_license_id_feature_code_key" UNIQUE ("license_id", "feature_code")
);

-- License Activations Table
CREATE TABLE IF NOT EXISTS "license_activations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "license_id" TEXT NOT NULL,
  "activation_key" VARCHAR(255) NOT NULL UNIQUE,
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

  CONSTRAINT "license_activations_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- License Usage Table
CREATE TABLE IF NOT EXISTS "license_usage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "license_id" TEXT NOT NULL,
  "metric_type" "UsageMetricType" NOT NULL,
  "metric_name" VARCHAR(100),
  "value" INTEGER NOT NULL,
  "limit" INTEGER,
  "percentage" DECIMAL(5, 2),
  "recorded_at" TIMESTAMP(3) NOT NULL,
  "date" DATE NOT NULL,
  "hour" INTEGER,
  "week" INTEGER,
  "month" INTEGER,
  "year" INTEGER,
  "breakdown" JSONB,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "license_usage_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

-- License indexes
CREATE INDEX IF NOT EXISTS "licenses_license_key_idx" ON "licenses"("license_key");
CREATE INDEX IF NOT EXISTS "licenses_societe_id_idx" ON "licenses"("societe_id");
CREATE INDEX IF NOT EXISTS "licenses_status_idx" ON "licenses"("status");
CREATE INDEX IF NOT EXISTS "licenses_expires_at_idx" ON "licenses"("expires_at");
CREATE INDEX IF NOT EXISTS "licenses_type_idx" ON "licenses"("type");
CREATE INDEX IF NOT EXISTS "licenses_societe_id_status_idx" ON "licenses"("societe_id", "status");
CREATE INDEX IF NOT EXISTS "licenses_status_expires_at_idx" ON "licenses"("status", "expires_at");
CREATE INDEX IF NOT EXISTS "licenses_customer_email_idx" ON "licenses"("customer_email");
CREATE INDEX IF NOT EXISTS "licenses_billing_cycle_next_renewal_at_idx" ON "licenses"("billing_cycle", "next_renewal_at");
CREATE INDEX IF NOT EXISTS "licenses_activated_at_idx" ON "licenses"("activated_at");
CREATE INDEX IF NOT EXISTS "licenses_suspended_at_idx" ON "licenses"("suspended_at");
CREATE INDEX IF NOT EXISTS "licenses_created_by_idx" ON "licenses"("created_by");

-- License Features indexes
CREATE INDEX IF NOT EXISTS "license_features_license_id_idx" ON "license_features"("license_id");
CREATE INDEX IF NOT EXISTS "license_features_feature_code_idx" ON "license_features"("feature_code");
CREATE INDEX IF NOT EXISTS "license_features_category_idx" ON "license_features"("category");

-- License Activations indexes
CREATE INDEX IF NOT EXISTS "license_activations_license_id_machine_id_idx" ON "license_activations"("license_id", "machine_id");
CREATE INDEX IF NOT EXISTS "license_activations_activation_key_idx" ON "license_activations"("activation_key");
CREATE INDEX IF NOT EXISTS "license_activations_status_idx" ON "license_activations"("status");
CREATE INDEX IF NOT EXISTS "license_activations_machine_id_idx" ON "license_activations"("machine_id");

-- License Usage indexes
CREATE INDEX IF NOT EXISTS "license_usage_license_id_recorded_at_idx" ON "license_usage"("license_id", "recorded_at");
CREATE INDEX IF NOT EXISTS "license_usage_license_id_metric_type_idx" ON "license_usage"("license_id", "metric_type");
CREATE INDEX IF NOT EXISTS "license_usage_recorded_at_idx" ON "license_usage"("recorded_at");

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Licensing tables created successfully!';
  RAISE NOTICE '   - licenses';
  RAISE NOTICE '   - license_features';
  RAISE NOTICE '   - license_activations';
  RAISE NOTICE '   - license_usage';
  RAISE NOTICE '   + 6 enums';
  RAISE NOTICE '   + 24 indexes';
END $$;
