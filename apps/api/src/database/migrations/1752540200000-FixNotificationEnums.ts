import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixNotificationEnums1752540200000 implements MigrationInterface {
  name = 'FixNotificationEnums1752540200000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Supprimer l'ancien enum s'il existe et recréer avec les bonnes valeurs
    await queryRunner.query(`
      DROP TYPE IF EXISTS notifications_type_enum CASCADE;
    `)

    await queryRunner.query(`
      DROP TYPE IF EXISTS notifications_category_enum CASCADE;
    `)

    await queryRunner.query(`
      DROP TYPE IF EXISTS notifications_priority_enum CASCADE;
    `)

    await queryRunner.query(`
      DROP TYPE IF EXISTS notifications_recipienttype_enum CASCADE;
    `)

    // Recréer les enums avec les bonnes valeurs
    await queryRunner.query(`
      CREATE TYPE notifications_type_enum AS ENUM ('info', 'warning', 'error', 'success');
    `)

    await queryRunner.query(`
      CREATE TYPE notifications_category_enum AS ENUM ('system', 'stock', 'projet', 'production', 'maintenance', 'qualite', 'facturation', 'sauvegarde', 'utilisateur', 'commande');
    `)

    await queryRunner.query(`
      CREATE TYPE notifications_priority_enum AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
    `)

    await queryRunner.query(`
      CREATE TYPE notifications_recipienttype_enum AS ENUM ('ALL', 'ROLE', 'USER', 'GROUP');
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE IF EXISTS notifications_type_enum CASCADE`)
    await queryRunner.query(`DROP TYPE IF EXISTS notifications_category_enum CASCADE`)
    await queryRunner.query(`DROP TYPE IF EXISTS notifications_priority_enum CASCADE`)
    await queryRunner.query(`DROP TYPE IF EXISTS notifications_recipienttype_enum CASCADE`)
  }
}