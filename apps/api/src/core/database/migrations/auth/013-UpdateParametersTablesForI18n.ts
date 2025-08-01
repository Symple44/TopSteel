import { QueryRunner } from 'typeorm'
import type { MigrationInterface } from 'typeorm'

export class UpdateParametersTablesForI18n1737600000000 implements MigrationInterface {
  name = 'UpdateParametersTablesForI18n1737600000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter les colonnes translationKey et customTranslations à parameters_system
    await queryRunner.query(`
      ALTER TABLE "parameters_system" 
      ADD COLUMN "translationKey" varchar(255),
      ADD COLUMN "customTranslations" jsonb
    `)

    // Ajouter les colonnes translationKey et customTranslations à parameters_application
    await queryRunner.query(`
      ALTER TABLE "parameters_application" 
      ADD COLUMN "translationKey" varchar(255),
      ADD COLUMN "customTranslations" jsonb
    `)

    // Ajouter les colonnes translationKey et customTranslations à parameters_client
    await queryRunner.query(`
      ALTER TABLE "parameters_client" 
      ADD COLUMN "translationKey" varchar(255),
      ADD COLUMN "customTranslations" jsonb
    `)

    // Supprimer l'ancienne colonne translations de parameters_system si elle existe
    await queryRunner.query(`
      ALTER TABLE "parameters_system" 
      DROP COLUMN IF EXISTS "translations"
    `)

    // Supprimer l'ancienne colonne translations de parameters_application si elle existe
    await queryRunner.query(`
      ALTER TABLE "parameters_application" 
      DROP COLUMN IF EXISTS "translations"
    `)

    // Supprimer l'ancienne colonne translations de parameters_client si elle existe
    await queryRunner.query(`
      ALTER TABLE "parameters_client" 
      DROP COLUMN IF EXISTS "translations"
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les nouvelles colonnes
    await queryRunner.query(`
      ALTER TABLE "parameters_system" 
      DROP COLUMN IF EXISTS "translationKey",
      DROP COLUMN IF EXISTS "customTranslations"
    `)

    await queryRunner.query(`
      ALTER TABLE "parameters_application" 
      DROP COLUMN IF EXISTS "translationKey",
      DROP COLUMN IF EXISTS "customTranslations"
    `)

    await queryRunner.query(`
      ALTER TABLE "parameters_client" 
      DROP COLUMN IF EXISTS "translationKey",
      DROP COLUMN IF EXISTS "customTranslations"
    `)

    // Restaurer l'ancienne colonne translations
    await queryRunner.query(`
      ALTER TABLE "parameters_system" 
      ADD COLUMN "translations" jsonb
    `)

    await queryRunner.query(`
      ALTER TABLE "parameters_application" 
      ADD COLUMN "translations" jsonb
    `)

    await queryRunner.query(`
      ALTER TABLE "parameters_client" 
      ADD COLUMN "translations" jsonb
    `)
  }
}
