import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDeletedByIdColumns1737500003000 implements MigrationInterface {
  name = 'AddDeletedByIdColumns1737500003000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne deleted_by_id si elle n'existe pas
    const tables = ['societes', 'sites', 'societe_users', 'shared_data_registry']

    for (const table of tables) {
      const hasColumn = await queryRunner.hasColumn(table, 'deleted_by_id')
      if (hasColumn) {
      } else {
        await queryRunner.query(`
          ALTER TABLE ${table} 
          ADD COLUMN deleted_by_id uuid NULL
        `)
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les colonnes deleted_by_id
    await queryRunner.query(`ALTER TABLE shared_data_registry DROP COLUMN deleted_by_id`)
    await queryRunner.query(`ALTER TABLE societe_users DROP COLUMN deleted_by_id`)
    await queryRunner.query(`ALTER TABLE sites DROP COLUMN deleted_by_id`)
    await queryRunner.query(`ALTER TABLE societes DROP COLUMN deleted_by_id`)
  }
}
