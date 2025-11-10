import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddDeletedAtToUsers1740400000000 implements MigrationInterface {
  name = 'AddDeletedAtToUsers1740400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la colonne existe déjà
    const table = await queryRunner.getTable('users')
    const hasDeletedAt = table?.columns.some((col) => col.name === 'deleted_at')

    if (!hasDeletedAt) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
          default: null,
        })
      )

      console.log('✅ Colonne deleted_at ajoutée à la table users')
    } else {
      console.log('⏭️  Colonne deleted_at existe déjà dans la table users')
    }

    // Créer un index pour améliorer les performances des requêtes avec soft delete
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_deleted_at" ON "users" ("deleted_at")
    `)

    console.log('✅ Index sur deleted_at créé')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer l'index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_deleted_at"`)

    // Supprimer la colonne
    await queryRunner.dropColumn('users', 'deleted_at')

    console.log('✅ Colonne deleted_at supprimée de la table users')
  }
}
