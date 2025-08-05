import { QueryRunner } from 'typeorm'
import type { MigrationInterface } from 'typeorm'

export class CreateBTPIndicesTable1737541000000 implements MigrationInterface {
  name = 'CreateBTPIndicesTable1737541000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create btp_indices table
    await queryRunner.query(`
      CREATE TABLE "btp_indices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "indexType" character varying NOT NULL,
        "indexName" character varying(100) NOT NULL,
        "indexCode" character varying(10) NOT NULL,
        "year" integer NOT NULL,
        "month" integer NOT NULL,
        "indexValue" decimal(10,4) NOT NULL,
        "previousValue" decimal(10,4),
        "monthlyVariation" decimal(8,4),
        "yearlyVariation" decimal(8,4),
        "baseValue" decimal(10,4),
        "publicationDate" date NOT NULL,
        "applicationDate" date NOT NULL,
        "isOfficial" boolean NOT NULL DEFAULT true,
        "isProvisional" boolean NOT NULL DEFAULT false,
        "indexMetadata" jsonb NOT NULL DEFAULT '{}',
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "createdById" uuid,
        "updatedById" uuid,
        "deletedById" uuid,
        CONSTRAINT "PK_btp_indices" PRIMARY KEY ("id")
      )
    `)

    // Create indexes for btp_indices
    await queryRunner.query(`CREATE INDEX "IDX_btp_indices_tenantId" ON "btp_indices" ("tenantId")`)
    await queryRunner.query(
      `CREATE INDEX "IDX_btp_indices_indexType" ON "btp_indices" ("indexType")`
    )
    await queryRunner.query(`CREATE INDEX "IDX_btp_indices_year" ON "btp_indices" ("year")`)
    await queryRunner.query(`CREATE INDEX "IDX_btp_indices_month" ON "btp_indices" ("month")`)
    await queryRunner.query(
      `CREATE INDEX "IDX_btp_indices_isOfficial" ON "btp_indices" ("isOfficial")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_btp_indices_type_month_year" ON "btp_indices" ("indexType", "month", "year")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_btp_indices_tenant_type" ON "btp_indices" ("tenantId", "indexType")`
    )

    // Create unique constraint to prevent duplicates
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_btp_indices_tenant_type_period" ON "btp_indices" ("tenantId", "indexType", "year", "month") WHERE "deletedAt" IS NULL`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique constraint
    await queryRunner.query(`DROP INDEX "UQ_btp_indices_tenant_type_period"`)

    // Drop indexes for btp_indices
    await queryRunner.query(`DROP INDEX "IDX_btp_indices_tenant_type"`)
    await queryRunner.query(`DROP INDEX "IDX_btp_indices_type_month_year"`)
    await queryRunner.query(`DROP INDEX "IDX_btp_indices_isOfficial"`)
    await queryRunner.query(`DROP INDEX "IDX_btp_indices_month"`)
    await queryRunner.query(`DROP INDEX "IDX_btp_indices_year"`)
    await queryRunner.query(`DROP INDEX "IDX_btp_indices_indexType"`)
    await queryRunner.query(`DROP INDEX "IDX_btp_indices_tenantId"`)

    // Drop table
    await queryRunner.query(`DROP TABLE "btp_indices"`)
  }
}
