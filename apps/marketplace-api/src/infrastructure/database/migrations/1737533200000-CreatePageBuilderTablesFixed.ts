import { QueryRunner } from 'typeorm'
import type { MigrationInterface } from 'typeorm'

export class CreatePageBuilderTablesFixed1737533200000 implements MigrationInterface {
  name = 'CreatePageBuilderTablesFixed1737533200000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create marketplace_page_templates table
    await queryRunner.query(`
      CREATE TABLE "marketplace_page_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "societeId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "pageType" character varying(50) NOT NULL DEFAULT 'custom',
        "status" character varying(50) NOT NULL DEFAULT 'draft',
        "description" text,
        "metadata" jsonb DEFAULT '{}',
        "settings" jsonb DEFAULT '{}',
        "publishedAt" TIMESTAMP,
        "scheduledAt" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedBy" uuid,
        CONSTRAINT "PK_marketplace_page_templates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_marketplace_page_templates_societe_slug" UNIQUE ("societeId", "slug")
      )
    `)

    // Create marketplace_page_sections table
    await queryRunner.query(`
      CREATE TABLE "marketplace_page_sections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pageTemplateId" uuid NOT NULL,
        "type" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "order" integer NOT NULL,
        "isVisible" boolean NOT NULL DEFAULT true,
        "content" jsonb DEFAULT '{}',
        "styles" jsonb DEFAULT '{}',
        "responsive" jsonb DEFAULT '{}',
        "settings" jsonb DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_marketplace_page_sections" PRIMARY KEY ("id")
      )
    `)

    // Create marketplace_section_presets table
    await queryRunner.query(`
      CREATE TABLE "marketplace_section_presets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "type" character varying(50) NOT NULL,
        "category" character varying(50),
        "thumbnail" character varying(500),
        "isPublic" boolean NOT NULL DEFAULT false,
        "societeId" uuid,
        "content" jsonb DEFAULT '{}',
        "styles" jsonb DEFAULT '{}',
        "defaultSettings" jsonb DEFAULT '{}',
        "tags" text[],
        "usageCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_marketplace_section_presets" PRIMARY KEY ("id")
      )
    `)

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "marketplace_page_sections"
      ADD CONSTRAINT "FK_marketplace_page_sections_pageTemplateId" 
      FOREIGN KEY ("pageTemplateId") REFERENCES "marketplace_page_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_page_templates_societeId" ON "marketplace_page_templates" ("societeId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_page_templates_slug" ON "marketplace_page_templates" ("slug")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_page_templates_status" ON "marketplace_page_templates" ("status")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_page_sections_pageTemplateId" ON "marketplace_page_sections" ("pageTemplateId")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_page_sections_order" ON "marketplace_page_sections" ("order")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_section_presets_type" ON "marketplace_section_presets" ("type")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_section_presets_category" ON "marketplace_section_presets" ("category")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_marketplace_section_presets_societeId" ON "marketplace_section_presets" ("societeId")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_marketplace_section_presets_societeId"`)
    await queryRunner.query(`DROP INDEX "IDX_marketplace_section_presets_category"`)
    await queryRunner.query(`DROP INDEX "IDX_marketplace_section_presets_type"`)
    await queryRunner.query(`DROP INDEX "IDX_marketplace_page_sections_order"`)
    await queryRunner.query(`DROP INDEX "IDX_marketplace_page_sections_pageTemplateId"`)
    await queryRunner.query(`DROP INDEX "IDX_marketplace_page_templates_status"`)
    await queryRunner.query(`DROP INDEX "IDX_marketplace_page_templates_slug"`)
    await queryRunner.query(`DROP INDEX "IDX_marketplace_page_templates_societeId"`)

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "marketplace_page_sections" DROP CONSTRAINT "FK_marketplace_page_sections_pageTemplateId"`
    )

    // Drop tables
    await queryRunner.query(`DROP TABLE "marketplace_section_presets"`)
    await queryRunner.query(`DROP TABLE "marketplace_page_sections"`)
    await queryRunner.query(`DROP TABLE "marketplace_page_templates"`)
  }
}