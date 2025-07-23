import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTestProductsTable1737501000000 implements MigrationInterface {
  name = 'CreateTestProductsTable1737501000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create test categories table
    await queryRunner.query(`
      CREATE TABLE "test_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_test_categories" PRIMARY KEY ("id")
      )
    `)

    // Create test products table
    await queryRunner.query(`
      CREATE TABLE "test_products" (
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
      )
    `)

    // Create test orders table
    await queryRunner.query(`
      CREATE TABLE "test_orders" (
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
      )
    `)

    // Create test order items table
    await queryRunner.query(`
      CREATE TABLE "test_order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" decimal(10,2) NOT NULL,
        "discount" decimal(10,2) NOT NULL DEFAULT 0,
        "totalPrice" decimal(10,2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_test_order_items" PRIMARY KEY ("id")
      )
    `)

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "test_products"
      ADD CONSTRAINT "FK_test_products_categoryId" 
      FOREIGN KEY ("categoryId") REFERENCES "test_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "test_orders"
      ADD CONSTRAINT "FK_test_orders_customerId" 
      FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "test_order_items"
      ADD CONSTRAINT "FK_test_order_items_orderId" 
      FOREIGN KEY ("orderId") REFERENCES "test_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "test_order_items"
      ADD CONSTRAINT "FK_test_order_items_productId" 
      FOREIGN KEY ("productId") REFERENCES "test_products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_test_products_categoryId" ON "test_products" ("categoryId")`)
    await queryRunner.query(`CREATE INDEX "IDX_test_products_sku" ON "test_products" ("sku")`)
    await queryRunner.query(`CREATE INDEX "IDX_test_orders_customerId" ON "test_orders" ("customerId")`)
    await queryRunner.query(`CREATE INDEX "IDX_test_orders_orderDate" ON "test_orders" ("orderDate")`)
    await queryRunner.query(`CREATE INDEX "IDX_test_order_items_orderId" ON "test_order_items" ("orderId")`)
    await queryRunner.query(`CREATE INDEX "IDX_test_order_items_productId" ON "test_order_items" ("productId")`)

    // Insert test data
    await queryRunner.query(`
      INSERT INTO "test_categories" ("name", "description") VALUES
      ('Électronique', 'Produits électroniques et accessoires'),
      ('Vêtements', 'Vêtements pour hommes et femmes'),
      ('Alimentation', 'Produits alimentaires et boissons'),
      ('Maison', 'Articles pour la maison et décoration'),
      ('Sport', 'Équipements sportifs et fitness')
    `)

    await queryRunner.query(`
      INSERT INTO "test_products" ("sku", "name", "description", "categoryId", "price", "cost", "stockQuantity", "minimumStock", "weight")
      SELECT 
        'ELEC-' || LPAD(row_number::text, 4, '0'),
        'Produit Électronique ' || row_number,
        'Description du produit électronique ' || row_number,
        (SELECT id FROM test_categories WHERE name = 'Électronique'),
        (random() * 1000 + 50)::decimal(10,2),
        (random() * 500 + 25)::decimal(10,2),
        floor(random() * 100 + 10)::integer,
        floor(random() * 20 + 5)::integer,
        (random() * 5 + 0.1)::decimal(10,3)
      FROM generate_series(1, 50) AS row_number
    `)

    await queryRunner.query(`
      INSERT INTO "test_products" ("sku", "name", "description", "categoryId", "price", "cost", "stockQuantity", "minimumStock", "weight")
      SELECT 
        'VET-' || LPAD(row_number::text, 4, '0'),
        'Vêtement ' || row_number,
        'Description du vêtement ' || row_number,
        (SELECT id FROM test_categories WHERE name = 'Vêtements'),
        (random() * 200 + 20)::decimal(10,2),
        (random() * 100 + 10)::decimal(10,2),
        floor(random() * 50 + 5)::integer,
        floor(random() * 10 + 2)::integer,
        (random() * 1 + 0.1)::decimal(10,3)
      FROM generate_series(1, 30) AS row_number
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_test_order_items_productId"`)
    await queryRunner.query(`DROP INDEX "IDX_test_order_items_orderId"`)
    await queryRunner.query(`DROP INDEX "IDX_test_orders_orderDate"`)
    await queryRunner.query(`DROP INDEX "IDX_test_orders_customerId"`)
    await queryRunner.query(`DROP INDEX "IDX_test_products_sku"`)
    await queryRunner.query(`DROP INDEX "IDX_test_products_categoryId"`)

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "test_order_items" DROP CONSTRAINT "FK_test_order_items_productId"`)
    await queryRunner.query(`ALTER TABLE "test_order_items" DROP CONSTRAINT "FK_test_order_items_orderId"`)
    await queryRunner.query(`ALTER TABLE "test_orders" DROP CONSTRAINT "FK_test_orders_customerId"`)
    await queryRunner.query(`ALTER TABLE "test_products" DROP CONSTRAINT "FK_test_products_categoryId"`)

    // Drop tables
    await queryRunner.query(`DROP TABLE "test_order_items"`)
    await queryRunner.query(`DROP TABLE "test_orders"`)
    await queryRunner.query(`DROP TABLE "test_products"`)
    await queryRunner.query(`DROP TABLE "test_categories"`)
  }
}