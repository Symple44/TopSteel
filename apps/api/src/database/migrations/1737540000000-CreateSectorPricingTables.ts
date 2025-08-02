import { QueryRunner } from 'typeorm'
import type { MigrationInterface } from 'typeorm'

export class CreateSectorPricingTables1737540000000 implements MigrationInterface {
  name = 'CreateSectorPricingTables1737540000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sector_coefficients table
    await queryRunner.query(`
      CREATE TABLE "sector_coefficients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "sector" character varying NOT NULL,
        "sectorName" character varying(100) NOT NULL,
        "coefficientType" character varying NOT NULL,
        "coefficient" decimal(8,4) NOT NULL,
        "description" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "priority" integer NOT NULL DEFAULT 0,
        "conditions" jsonb NOT NULL DEFAULT '{}',
        "parameters" jsonb NOT NULL DEFAULT '{}',
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "createdById" uuid,
        "updatedById" uuid,
        "deletedById" uuid,
        CONSTRAINT "PK_sector_coefficients" PRIMARY KEY ("id")
      )
    `)

    // Create customer_sector_assignments table
    await queryRunner.query(`
      CREATE TABLE "customer_sector_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "customerId" uuid NOT NULL,
        "sector" character varying NOT NULL,
        "customerName" character varying(255),
        "customerCode" character varying(100),
        "isActive" boolean NOT NULL DEFAULT true,
        "validFrom" date,
        "validUntil" date,
        "assignmentDetails" jsonb NOT NULL DEFAULT '{}',
        "sectorMetadata" jsonb NOT NULL DEFAULT '{}',
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "createdById" uuid,
        "updatedById" uuid,
        "deletedById" uuid,
        CONSTRAINT "PK_customer_sector_assignments" PRIMARY KEY ("id")
      )
    `)

    // Create indexes for sector_coefficients
    await queryRunner.query(
      `CREATE INDEX "IDX_sector_coefficients_tenantId" ON "sector_coefficients" ("tenantId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_sector_coefficients_sector" ON "sector_coefficients" ("sector")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_sector_coefficients_isActive" ON "sector_coefficients" ("isActive")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_sector_coefficients_sector_type" ON "sector_coefficients" ("sector", "coefficientType")`
    )

    // Create indexes for customer_sector_assignments
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_sector_assignments_tenantId" ON "customer_sector_assignments" ("tenantId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_sector_assignments_customerId" ON "customer_sector_assignments" ("customerId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_sector_assignments_sector" ON "customer_sector_assignments" ("sector")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_sector_assignments_isActive" ON "customer_sector_assignments" ("isActive")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_sector_assignments_tenant_customer" ON "customer_sector_assignments" ("tenantId", "customerId")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes for customer_sector_assignments
    await queryRunner.query(`DROP INDEX "IDX_customer_sector_assignments_tenant_customer"`)
    await queryRunner.query(`DROP INDEX "IDX_customer_sector_assignments_isActive"`)
    await queryRunner.query(`DROP INDEX "IDX_customer_sector_assignments_sector"`)
    await queryRunner.query(`DROP INDEX "IDX_customer_sector_assignments_customerId"`)
    await queryRunner.query(`DROP INDEX "IDX_customer_sector_assignments_tenantId"`)

    // Drop indexes for sector_coefficients
    await queryRunner.query(`DROP INDEX "IDX_sector_coefficients_sector_type"`)
    await queryRunner.query(`DROP INDEX "IDX_sector_coefficients_isActive"`)
    await queryRunner.query(`DROP INDEX "IDX_sector_coefficients_sector"`)
    await queryRunner.query(`DROP INDEX "IDX_sector_coefficients_tenantId"`)

    // Drop tables
    await queryRunner.query(`DROP TABLE "customer_sector_assignments"`)
    await queryRunner.query(`DROP TABLE "sector_coefficients"`)
  }
}