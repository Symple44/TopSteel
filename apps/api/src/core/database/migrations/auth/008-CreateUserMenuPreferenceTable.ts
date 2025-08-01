import { type MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateUserMenuPreferenceTable1737894800000 implements MigrationInterface {
  name = 'CreateUserMenuPreferenceTable1737894800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table user_menu_preference_items
    await queryRunner.createTable(
      new Table({
        name: 'user_menu_preference_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'menu_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'is_visible',
            type: 'boolean',
            default: true,
          },
          {
            name: 'order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'custom_label',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    )

    // Créer un index unique sur user_id + menu_id
    await queryRunner.createIndex(
      'user_menu_preference_items',
      new TableIndex({
        name: 'IDX_user_menu_preference_unique',
        columnNames: ['user_id', 'menu_id'],
        isUnique: true,
      })
    )

    // Créer un index sur user_id pour les requêtes fréquentes
    await queryRunner.createIndex(
      'user_menu_preference_items',
      new TableIndex({
        name: 'IDX_user_menu_preference_user_id',
        columnNames: ['user_id'],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.dropIndex('user_menu_preference_items', 'IDX_user_menu_preference_user_id')
    await queryRunner.dropIndex('user_menu_preference_items', 'IDX_user_menu_preference_unique')

    // Supprimer la table
    await queryRunner.dropTable('user_menu_preference_items')
  }
}
