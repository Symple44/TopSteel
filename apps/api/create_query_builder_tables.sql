-- Migration SQL pour Query Builder
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
-- Table test_categories
CREATE TABLE IF NOT EXISTS "test_categories" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" character varying NOT NULL,
    "description" text,
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_test_categories" PRIMARY KEY ("id")
);

-- Table test_products
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
    CONSTRAINT "PK_test_products" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_test_products_sku" UNIQUE ("sku")
);

-- Table test_orders
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
    CONSTRAINT "PK_test_orders" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_test_orders_orderNumber" UNIQUE ("orderNumber")
);

-- Table test_order_items
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

-- Contraintes de clés étrangères (seulement si les tables users existent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Contraintes pour query_builders
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_query_builders_createdById') THEN
            ALTER TABLE "query_builders"
            ADD CONSTRAINT "FK_query_builders_createdById" 
            FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;

        -- Contraintes pour test_orders (si on veut lier aux utilisateurs)
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_test_orders_customerId') THEN
            ALTER TABLE "test_orders"
            ADD CONSTRAINT "FK_test_orders_customerId" 
            FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;

        -- Contraintes pour query_builder_permissions
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_query_builder_permissions_userId') THEN
            ALTER TABLE "query_builder_permissions"
            ADD CONSTRAINT "FK_query_builder_permissions_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
    END IF;

    -- Contraintes pour roles (si elles existent)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_query_builder_permissions_roleId') THEN
            ALTER TABLE "query_builder_permissions"
            ADD CONSTRAINT "FK_query_builder_permissions_roleId" 
            FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
    END IF;
END $$;

-- Contraintes obligatoires (sans dépendances externes)
DO $$
BEGIN
    -- Query builder columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_query_builder_columns_queryBuilderId') THEN
        ALTER TABLE "query_builder_columns"
        ADD CONSTRAINT "FK_query_builder_columns_queryBuilderId" 
        FOREIGN KEY ("queryBuilderId") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    -- Query builder joins
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_query_builder_joins_queryBuilderId') THEN
        ALTER TABLE "query_builder_joins"
        ADD CONSTRAINT "FK_query_builder_joins_queryBuilderId" 
        FOREIGN KEY ("queryBuilderId") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    -- Query builder calculated fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_query_builder_calculated_fields_queryBuilderId') THEN
        ALTER TABLE "query_builder_calculated_fields"
        ADD CONSTRAINT "FK_query_builder_calculated_fields_queryBuilderId" 
        FOREIGN KEY ("queryBuilderId") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    -- Query builder permissions
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_query_builder_permissions_queryBuilderId') THEN
        ALTER TABLE "query_builder_permissions"
        ADD CONSTRAINT "FK_query_builder_permissions_queryBuilderId" 
        FOREIGN KEY ("queryBuilderId") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    -- Test products -> categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_test_products_categoryId') THEN
        ALTER TABLE "test_products"
        ADD CONSTRAINT "FK_test_products_categoryId" 
        FOREIGN KEY ("categoryId") REFERENCES "test_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

    -- Test order items -> orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_test_order_items_orderId') THEN
        ALTER TABLE "test_order_items"
        ADD CONSTRAINT "FK_test_order_items_orderId" 
        FOREIGN KEY ("orderId") REFERENCES "test_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    -- Test order items -> products
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_test_order_items_productId') THEN
        ALTER TABLE "test_order_items"
        ADD CONSTRAINT "FK_test_order_items_productId" 
        FOREIGN KEY ("productId") REFERENCES "test_products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS "IDX_query_builders_createdById" ON "query_builders" ("createdById");
CREATE INDEX IF NOT EXISTS "IDX_query_builder_columns_queryBuilderId" ON "query_builder_columns" ("queryBuilderId");
CREATE INDEX IF NOT EXISTS "IDX_query_builder_joins_queryBuilderId" ON "query_builder_joins" ("queryBuilderId");
CREATE INDEX IF NOT EXISTS "IDX_query_builder_calculated_fields_queryBuilderId" ON "query_builder_calculated_fields" ("queryBuilderId");
CREATE INDEX IF NOT EXISTS "IDX_query_builder_permissions_queryBuilderId" ON "query_builder_permissions" ("queryBuilderId");
CREATE INDEX IF NOT EXISTS "IDX_query_builder_permissions_userId" ON "query_builder_permissions" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_query_builder_permissions_roleId" ON "query_builder_permissions" ("roleId");
CREATE INDEX IF NOT EXISTS "IDX_test_products_categoryId" ON "test_products" ("categoryId");
CREATE INDEX IF NOT EXISTS "IDX_test_products_sku" ON "test_products" ("sku");
CREATE INDEX IF NOT EXISTS "IDX_test_orders_customerId" ON "test_orders" ("customerId");
CREATE INDEX IF NOT EXISTS "IDX_test_orders_orderDate" ON "test_orders" ("orderDate");
CREATE INDEX IF NOT EXISTS "IDX_test_order_items_orderId" ON "test_order_items" ("orderId");
CREATE INDEX IF NOT EXISTS "IDX_test_order_items_productId" ON "test_order_items" ("productId");

-- Données de test pour les catégories
INSERT INTO "test_categories" ("name", "description") VALUES
('Électronique', 'Produits électroniques et accessoires'),
('Vêtements', 'Vêtements pour hommes et femmes'),
('Alimentation', 'Produits alimentaires et boissons'),
('Maison', 'Articles pour la maison et décoration'),
('Sport', 'Équipements sportifs et fitness')
ON CONFLICT DO NOTHING;

-- Données de test pour les produits
DO $$
DECLARE
    cat_elec_id uuid;
    cat_vet_id uuid;
    cat_alim_id uuid;
    cat_maison_id uuid;
    cat_sport_id uuid;
BEGIN
    -- Récupérer les IDs des catégories
    SELECT id INTO cat_elec_id FROM test_categories WHERE name = 'Électronique';
    SELECT id INTO cat_vet_id FROM test_categories WHERE name = 'Vêtements';
    SELECT id INTO cat_alim_id FROM test_categories WHERE name = 'Alimentation';
    SELECT id INTO cat_maison_id FROM test_categories WHERE name = 'Maison';
    SELECT id INTO cat_sport_id FROM test_categories WHERE name = 'Sport';

    -- Produits électroniques
    FOR i IN 1..25 LOOP
        INSERT INTO "test_products" ("sku", "name", "description", "categoryId", "price", "cost", "stockQuantity", "minimumStock", "weight")
        VALUES (
            'ELEC-' || LPAD(i::text, 4, '0'),
            'Produit Électronique ' || i,
            'Description du produit électronique ' || i,
            cat_elec_id,
            (random() * 500 + 50)::decimal(10,2),
            (random() * 250 + 25)::decimal(10,2),
            floor(random() * 100 + 10)::integer,
            floor(random() * 20 + 5)::integer,
            (random() * 5 + 0.1)::decimal(10,3)
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Produits vêtements
    FOR i IN 1..20 LOOP
        INSERT INTO "test_products" ("sku", "name", "description", "categoryId", "price", "cost", "stockQuantity", "minimumStock", "weight")
        VALUES (
            'VET-' || LPAD(i::text, 4, '0'),
            'Vêtement ' || i,
            'Description du vêtement ' || i,
            cat_vet_id,
            (random() * 200 + 20)::decimal(10,2),
            (random() * 100 + 10)::decimal(10,2),
            floor(random() * 50 + 5)::integer,
            floor(random() * 10 + 2)::integer,
            (random() * 1 + 0.1)::decimal(10,3)
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Produits alimentation
    FOR i IN 1..15 LOOP
        INSERT INTO "test_products" ("sku", "name", "description", "categoryId", "price", "cost", "stockQuantity", "minimumStock", "weight")
        VALUES (
            'ALIM-' || LPAD(i::text, 4, '0'),
            'Produit Alimentaire ' || i,
            'Description du produit alimentaire ' || i,
            cat_alim_id,
            (random() * 30 + 5)::decimal(10,2),
            (random() * 15 + 2)::decimal(10,2),
            floor(random() * 200 + 50)::integer,
            floor(random() * 30 + 10)::integer,
            (random() * 2 + 0.1)::decimal(10,3)
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Produits maison
    FOR i IN 1..10 LOOP
        INSERT INTO "test_products" ("sku", "name", "description", "categoryId", "price", "cost", "stockQuantity", "minimumStock", "weight")
        VALUES (
            'MAIS-' || LPAD(i::text, 4, '0'),
            'Article Maison ' || i,
            'Description de l''article maison ' || i,
            cat_maison_id,
            (random() * 150 + 25)::decimal(10,2),
            (random() * 75 + 12)::decimal(10,2),
            floor(random() * 30 + 5)::integer,
            floor(random() * 5 + 1)::integer,
            (random() * 3 + 0.5)::decimal(10,3)
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Produits sport
    FOR i IN 1..10 LOOP
        INSERT INTO "test_products" ("sku", "name", "description", "categoryId", "price", "cost", "stockQuantity", "minimumStock", "weight")
        VALUES (
            'SPORT-' || LPAD(i::text, 4, '0'),
            'Équipement Sport ' || i,
            'Description de l''équipement sport ' || i,
            cat_sport_id,
            (random() * 300 + 40)::decimal(10,2),
            (random() * 150 + 20)::decimal(10,2),
            floor(random() * 25 + 2)::integer,
            floor(random() * 3 + 1)::integer,
            (random() * 10 + 0.2)::decimal(10,3)
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Insérer dans la table des migrations pour marquer comme exécutées
INSERT INTO "migrations" ("timestamp", "name") VALUES
(1737500000000, 'CreateQueryBuilderTables1737500000000'),
(1737501000000, 'CreateTestProductsTable1737501000000')
ON CONFLICT ("timestamp") DO NOTHING;

-- Message de fin
SELECT 'Query Builder tables created successfully!' as message;