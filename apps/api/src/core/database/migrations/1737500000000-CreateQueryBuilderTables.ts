import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateQueryBuilderTables1737500000000 implements MigrationInterface {
  name = 'CreateQueryBuilderTables1737500000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create query_builders table
    await queryRunner.query(`
      CREATE TABLE "query_builders" (
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
      )
    `)

    // Create query_builder_columns table
    await queryRunner.query(`
      CREATE TABLE "query_builder_columns" (
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
      )
    `)

    // Create query_builder_joins table
    await queryRunner.query(`
      CREATE TABLE "query_builder_joins" (
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
      )
    `)

    // Create query_builder_calculated_fields table
    await queryRunner.query(`
      CREATE TABLE "query_builder_calculated_fields" (
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
      )
    `)

    // Create query_builder_permissions table
    await queryRunner.query(`
      CREATE TABLE "query_builder_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "queryBuilderId" uuid NOT NULL,
        "permissionType" character varying NOT NULL,
        "userId" uuid,
        "roleId" uuid,
        "isAllowed" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_query_builder_permissions" PRIMARY KEY ("id")
      )
    `)

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "query_builders"
      ADD CONSTRAINT "FK_query_builders_createdById" 
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "query_builder_columns"
      ADD CONSTRAINT "FK_query_builder_columns_queryBuilderId" 
      FOREIGN KEY ("queryBuilderId") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "query_builder_joins"
      ADD CONSTRAINT "FK_query_builder_joins_queryBuilderId" 
      FOREIGN KEY ("queryBuilderId") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "query_builder_calculated_fields"
      ADD CONSTRAINT "FK_query_builder_calculated_fields_queryBuilderId" 
      FOREIGN KEY ("queryBuilderId") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "query_builder_permissions"
      ADD CONSTRAINT "FK_query_builder_permissions_queryBuilderId" 
      FOREIGN KEY ("queryBuilderId") REFERENCES "query_builders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "query_builder_permissions"
      ADD CONSTRAINT "FK_query_builder_permissions_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "query_builder_permissions"
      ADD CONSTRAINT "FK_query_builder_permissions_roleId" 
      FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_query_builders_createdById" ON "query_builders" ("createdById")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_query_builder_columns_queryBuilderId" ON "query_builder_columns" ("queryBuilderId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_query_builder_joins_queryBuilderId" ON "query_builder_joins" ("queryBuilderId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_query_builder_calculated_fields_queryBuilderId" ON "query_builder_calculated_fields" ("queryBuilderId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_query_builder_permissions_queryBuilderId" ON "query_builder_permissions" ("queryBuilderId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_query_builder_permissions_userId" ON "query_builder_permissions" ("userId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_query_builder_permissions_roleId" ON "query_builder_permissions" ("roleId")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_query_builder_permissions_roleId"`)
    await queryRunner.query(`DROP INDEX "IDX_query_builder_permissions_userId"`)
    await queryRunner.query(`DROP INDEX "IDX_query_builder_permissions_queryBuilderId"`)
    await queryRunner.query(`DROP INDEX "IDX_query_builder_calculated_fields_queryBuilderId"`)
    await queryRunner.query(`DROP INDEX "IDX_query_builder_joins_queryBuilderId"`)
    await queryRunner.query(`DROP INDEX "IDX_query_builder_columns_queryBuilderId"`)
    await queryRunner.query(`DROP INDEX "IDX_query_builders_createdById"`)

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "query_builder_permissions" DROP CONSTRAINT "FK_query_builder_permissions_roleId"`
    )
    await queryRunner.query(
      `ALTER TABLE "query_builder_permissions" DROP CONSTRAINT "FK_query_builder_permissions_userId"`
    )
    await queryRunner.query(
      `ALTER TABLE "query_builder_permissions" DROP CONSTRAINT "FK_query_builder_permissions_queryBuilderId"`
    )
    await queryRunner.query(
      `ALTER TABLE "query_builder_calculated_fields" DROP CONSTRAINT "FK_query_builder_calculated_fields_queryBuilderId"`
    )
    await queryRunner.query(
      `ALTER TABLE "query_builder_joins" DROP CONSTRAINT "FK_query_builder_joins_queryBuilderId"`
    )
    await queryRunner.query(
      `ALTER TABLE "query_builder_columns" DROP CONSTRAINT "FK_query_builder_columns_queryBuilderId"`
    )
    await queryRunner.query(
      `ALTER TABLE "query_builders" DROP CONSTRAINT "FK_query_builders_createdById"`
    )

    // Drop tables
    await queryRunner.query(`DROP TABLE "query_builder_permissions"`)
    await queryRunner.query(`DROP TABLE "query_builder_calculated_fields"`)
    await queryRunner.query(`DROP TABLE "query_builder_joins"`)
    await queryRunner.query(`DROP TABLE "query_builder_columns"`)
    await queryRunner.query(`DROP TABLE "query_builders"`)
  }
}
