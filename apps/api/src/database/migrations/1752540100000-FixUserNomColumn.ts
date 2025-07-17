import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixUserNomColumn1752540100000 implements MigrationInterface {
  name = 'FixUserNomColumn1752540100000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Mettre à jour les valeurs NULL avec des valeurs par défaut
    await queryRunner.query(`
      UPDATE users 
      SET nom = COALESCE(nom, 'Nom par défaut') 
      WHERE nom IS NULL
    `)

    await queryRunner.query(`
      UPDATE users 
      SET prenom = COALESCE(prenom, 'Prénom par défaut') 
      WHERE prenom IS NULL
    `)

    // Maintenant on peut ajouter la contrainte NOT NULL si elle n'existe pas
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN nom SET NOT NULL
    `)

    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN prenom SET NOT NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Retirer la contrainte NOT NULL
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN nom DROP NOT NULL
    `)

    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN prenom DROP NOT NULL
    `)
  }
}