import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePriceRulesTables1704000005 implements MigrationInterface {
  name = 'CreatePriceRulesTables1704000005'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer les enums
    await queryRunner.query(`
      CREATE TYPE "adjustment_type_enum" AS ENUM (
        'PERCENTAGE',
        'FIXED_AMOUNT',
        'FIXED_PRICE',
        'PRICE_PER_WEIGHT',
        'PRICE_PER_LENGTH',
        'PRICE_PER_SURFACE',
        'PRICE_PER_VOLUME',
        'FORMULA'
      )
    `)

    await queryRunner.query(`
      CREATE TYPE "price_rule_channel_enum" AS ENUM (
        'ALL',
        'ERP',
        'MARKETPLACE',
        'API',
        'B2B'
      )
    `)

    // Créer la table price_rules
    await queryRunner.query(`
      CREATE TABLE "price_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "societe_id" uuid NOT NULL,
        "rule_name" character varying(100) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "channel" "price_rule_channel_enum" NOT NULL DEFAULT 'ALL',
        "article_id" uuid,
        "article_family" character varying(50),
        "adjustment_type" "adjustment_type_enum" NOT NULL,
        "adjustment_value" decimal(12,4) NOT NULL,
        "adjustment_unit" character varying(10),
        "formula" text,
        "conditions" jsonb NOT NULL DEFAULT '[]',
        "priority" integer NOT NULL DEFAULT 0,
        "combinable" boolean NOT NULL DEFAULT true,
        "valid_from" TIMESTAMP WITH TIME ZONE,
        "valid_until" TIMESTAMP WITH TIME ZONE,
        "usage_limit" integer,
        "usage_limit_per_customer" integer,
        "usage_count" integer NOT NULL DEFAULT 0,
        "customer_groups" character varying array,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_price_rules" PRIMARY KEY ("id")
      )
    `)

    // Créer les index
    await queryRunner.query(`
      CREATE INDEX "IDX_price_rules_societe_id_is_active" 
      ON "price_rules" ("societe_id", "is_active")
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_price_rules_channel" 
      ON "price_rules" ("channel")
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_price_rules_article_id" 
      ON "price_rules" ("article_id")
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_price_rules_article_family" 
      ON "price_rules" ("article_family")
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_price_rules_priority" 
      ON "price_rules" ("priority" DESC)
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_price_rules_valid_dates" 
      ON "price_rules" ("valid_from", "valid_until")
    `)

    // Créer la table de suivi d'usage par client (optionnelle)
    await queryRunner.query(`
      CREATE TABLE "price_rule_usage" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rule_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "usage_count" integer NOT NULL DEFAULT 0,
        "first_used_at" TIMESTAMP WITH TIME ZONE,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_price_rule_usage" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_price_rule_usage_rule_customer" UNIQUE ("rule_id", "customer_id")
      )
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_price_rule_usage_rule_id" 
      ON "price_rule_usage" ("rule_id")
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_price_rule_usage_customer_id" 
      ON "price_rule_usage" ("customer_id")
    `)

    // Ajouter les contraintes de clés étrangères
    await queryRunner.query(`
      ALTER TABLE "price_rules" 
      ADD CONSTRAINT "FK_price_rules_societe" 
      FOREIGN KEY ("societe_id") 
      REFERENCES "societes"("id") 
      ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE "price_rules" 
      ADD CONSTRAINT "FK_price_rules_article" 
      FOREIGN KEY ("article_id") 
      REFERENCES "articles"("id") 
      ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE "price_rule_usage" 
      ADD CONSTRAINT "FK_price_rule_usage_rule" 
      FOREIGN KEY ("rule_id") 
      REFERENCES "price_rules"("id") 
      ON DELETE CASCADE
    `)

    // Ajouter les colonnes surface et volume calculées aux articles si elles n'existent pas
    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD COLUMN IF NOT EXISTS "surface" decimal(10,4),
      ADD COLUMN IF NOT EXISTS "volume" decimal(10,4)
    `)

    // Créer une fonction pour calculer automatiquement surface et volume
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION calculate_article_dimensions()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Calculer la surface si longueur et largeur sont définies
        IF NEW.longueur IS NOT NULL AND NEW.largeur IS NOT NULL THEN
          NEW.surface := (NEW.longueur * NEW.largeur) / 1000000; -- Convertir mm² en m²
        END IF;
        
        -- Calculer le volume si longueur, largeur et hauteur sont définies
        IF NEW.longueur IS NOT NULL AND NEW.largeur IS NOT NULL AND NEW.hauteur IS NOT NULL THEN
          NEW.volume := (NEW.longueur * NEW.largeur * NEW.hauteur) / 1000000000; -- Convertir mm³ en m³
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Créer le trigger pour calculer automatiquement les dimensions
    await queryRunner.query(`
      CREATE TRIGGER article_dimensions_trigger
      BEFORE INSERT OR UPDATE OF longueur, largeur, hauteur
      ON articles
      FOR EACH ROW
      EXECUTE FUNCTION calculate_article_dimensions();
    `)

    // Mettre à jour les articles existants
    await queryRunner.query(`
      UPDATE articles 
      SET 
        surface = CASE 
          WHEN longueur IS NOT NULL AND largeur IS NOT NULL 
          THEN (longueur * largeur) / 1000000
          ELSE NULL 
        END,
        volume = CASE 
          WHEN longueur IS NOT NULL AND largeur IS NOT NULL AND hauteur IS NOT NULL 
          THEN (longueur * largeur * hauteur) / 1000000000
          ELSE NULL 
        END
      WHERE longueur IS NOT NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer le trigger et la fonction
    await queryRunner.query(`DROP TRIGGER IF EXISTS article_dimensions_trigger ON articles`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS calculate_article_dimensions()`)

    // Supprimer les colonnes ajoutées aux articles
    await queryRunner.query(`
      ALTER TABLE "articles" 
      DROP COLUMN IF EXISTS "surface",
      DROP COLUMN IF EXISTS "volume"
    `)

    // Supprimer les contraintes
    await queryRunner.query(
      `ALTER TABLE "price_rule_usage" DROP CONSTRAINT IF EXISTS "FK_price_rule_usage_rule"`
    )
    await queryRunner.query(
      `ALTER TABLE "price_rules" DROP CONSTRAINT IF EXISTS "FK_price_rules_article"`
    )
    await queryRunner.query(
      `ALTER TABLE "price_rules" DROP CONSTRAINT IF EXISTS "FK_price_rules_societe"`
    )

    // Supprimer les tables
    await queryRunner.query(`DROP TABLE IF EXISTS "price_rule_usage"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "price_rules"`)

    // Supprimer les enums
    await queryRunner.query(`DROP TYPE IF EXISTS "price_rule_channel_enum"`)
    await queryRunner.query(`DROP TYPE IF EXISTS "adjustment_type_enum"`)
  }
}
