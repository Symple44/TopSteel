-- Migration SQL simple pour Query Builder
-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table principale query_builders
CREATE TABLE IF NOT EXISTS "query_builders" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" character varying NOT NULL,
    "description" character varying,
    "database" character varying NOT NULL,
    "mainTable" character varying NOT NULL,
    "isPublic" boolean NOT NULL DEFAULT false,
    "maxRows" integer,
    "settings" jsonb,
    "layout" jsonb,
    "createdById" uuid NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_query_builders" PRIMARY KEY ("id")
);

-- Table query_builder_columns
CREATE TABLE IF NOT EXISTS "query_builder_columns" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "queryBuilderId" uuid NOT NULL,
    "tableName" character varying NOT NULL,
    "columnName" character varying NOT NULL,
    "alias" character varying NOT NULL,
    "label" character varying NOT NULL,
    "description" character varying,
    "dataType" character varying NOT NULL,
    "isPrimaryKey" boolean NOT NULL DEFAULT false,
    "isForeignKey" boolean NOT NULL DEFAULT false,
    "isVisible" boolean NOT NULL DEFAULT true,
    "isFilterable" boolean NOT NULL DEFAULT true,
    "isSortable" boolean NOT NULL DEFAULT true,
    "isGroupable" boolean NOT NULL DEFAULT false,
    "displayOrder" integer NOT NULL,
    "width" integer,
    "format" jsonb,
    "aggregation" jsonb,
    CONSTRAINT "PK_query_builder_columns" PRIMARY KEY ("id")
);

-- Table query_builder_joins
CREATE TABLE IF NOT EXISTS "query_builder_joins" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "queryBuilderId" uuid NOT NULL,
    "fromTable" character varying NOT NULL,
    "fromColumn" character varying NOT NULL,
    "toTable" character varying NOT NULL,
    "toColumn" character varying NOT NULL,
    "joinType" character varying NOT NULL,
    "alias" character varying NOT NULL,
    "order" integer NOT NULL,
    CONSTRAINT "PK_query_builder_joins" PRIMARY KEY ("id")
);

-- Table query_builder_calculated_fields
CREATE TABLE IF NOT EXISTS "query_builder_calculated_fields" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "queryBuilderId" uuid NOT NULL,
    "name" character varying NOT NULL,
    "label" character varying NOT NULL,
    "description" character varying,
    "expression" text NOT NULL,
    "dataType" character varying NOT NULL,
    "isVisible" boolean NOT NULL DEFAULT true,
    "displayOrder" integer NOT NULL,
    "format" jsonb,
    "dependencies" jsonb,
    CONSTRAINT "PK_query_builder_calculated_fields" PRIMARY KEY ("id")
);

-- Table query_builder_permissions
CREATE TABLE IF NOT EXISTS "query_builder_permissions" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "queryBuilderId" uuid NOT NULL,
    "permissionType" character varying NOT NULL,
    "userId" uuid,
    "roleId" uuid,
    "isAllowed" boolean NOT NULL DEFAULT true,
    CONSTRAINT "PK_query_builder_permissions" PRIMARY KEY ("id")
);

-- Tables de test
CREATE TABLE IF NOT EXISTS "test_categories" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" character varying NOT NULL,
    "description" text,
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_test_categories" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "test_products" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "sku" character varying NOT NULL,
    "name" character varying NOT NULL,
    "description" text,
    "categoryId" uuid NOT NULL,
    "price" decimal(10,2) NOT NULL,
    "cost" decimal(10,2) NOT NULL,
    "stockQuantity" integer NOT NULL DEFAULT 0,
    "minimumStock" integer NOT NULL DEFAULT 10,
    "weight" decimal(10,3),
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_test_products" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "test_orders" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "orderNumber" character varying NOT NULL,
    "customerId" uuid NOT NULL,
    "orderDate" TIMESTAMP NOT NULL DEFAULT now(),
    "status" character varying NOT NULL DEFAULT 'pending',
    "totalAmount" decimal(10,2) NOT NULL,
    "shippingAddress" text,
    "notes" text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_test_orders" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "test_order_items" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    "quantity" integer NOT NULL,
    "unitPrice" decimal(10,2) NOT NULL,
    "discount" decimal(10,2) NOT NULL DEFAULT 0,
    "totalPrice" decimal(10,2) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_test_order_items" PRIMARY KEY ("id")
);

-- Ajouter les contraintes uniques manquantes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'UQ_test_products_sku') THEN
        ALTER TABLE "test_products" ADD CONSTRAINT "UQ_test_products_sku" UNIQUE ("sku");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'UQ_test_orders_orderNumber') THEN
        ALTER TABLE "test_orders" ADD CONSTRAINT "UQ_test_orders_orderNumber" UNIQUE ("orderNumber");
    END IF;
END $$;

-- Insérer des données de test seulement si les tables sont vides
DO $$
BEGIN
    -- Catégories de test
    IF NOT EXISTS (SELECT 1 FROM test_categories) THEN
        INSERT INTO "test_categories" ("name", "description") VALUES
        ('Électronique', 'Produits électroniques et accessoires'),
        ('Vêtements', 'Vêtements pour hommes et femmes'),
        ('Alimentation', 'Produits alimentaires et boissons'),
        ('Maison', 'Articles pour la maison et décoration'),
        ('Sport', 'Équipements sportifs et fitness');
    END IF;
END $$;

-- Insérer quelques produits de test
DO $$
DECLARE
    cat_elec_id uuid;
    cat_vet_id uuid;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM test_products) THEN
        SELECT id INTO cat_elec_id FROM test_categories WHERE name = 'Électronique' LIMIT 1;
        SELECT id INTO cat_vet_id FROM test_categories WHERE name = 'Vêtements' LIMIT 1;

        IF cat_elec_id IS NOT NULL THEN
            INSERT INTO "test_products" ("sku", "name", "description", "categoryId", "price", "cost", "stockQuantity", "minimumStock", "weight") VALUES
            ('ELEC-0001', 'Smartphone XYZ', 'Smartphone dernière génération', cat_elec_id, 599.99, 299.99, 50, 10, 0.2),
            ('ELEC-0002', 'Laptop ABC', 'Ordinateur portable professionnel', cat_elec_id, 1299.99, 699.99, 25, 5, 2.1),
            ('ELEC-0003', 'Écouteurs Wireless', 'Écouteurs sans fil haute qualité', cat_elec_id, 149.99, 75.99, 100, 20, 0.05);
        END IF;

        IF cat_vet_id IS NOT NULL THEN
            INSERT INTO "test_products" ("sku", "name", "description", "categoryId", "price", "cost", "stockQuantity", "minimumStock", "weight") VALUES
            ('VET-0001', 'T-shirt Coton', 'T-shirt 100% coton bio', cat_vet_id, 29.99, 12.99, 200, 50, 0.15),
            ('VET-0002', 'Jean Slim', 'Jean coupe slim moderne', cat_vet_id, 89.99, 39.99, 80, 15, 0.6);
        END IF;
    END IF;
END $$;

SELECT 'Query Builder tables created and populated with test data!' as message;