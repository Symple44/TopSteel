import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm'

export class CreateUserMenuPreferenceTable1737826600000 implements MigrationInterface {
  name = 'CreateUserMenuPreferenceTable1737826600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Création de la table user_menu_preference_items...')
    
    try {
      // Créer la nouvelle table user_menu_preference_items
      await queryRunner.createTable(new Table({
        name: 'user_menu_preference_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'user_id',
            type: 'uuid',
            comment: 'Référence vers l\'utilisateur'
          },
          {
            name: 'menu_id',
            type: 'varchar',
            length: '255',
            comment: 'Identifiant du menu'
          },
          {
            name: 'is_visible',
            type: 'boolean',
            default: true,
            comment: 'Visibilité du menu'
          },
          {
            name: 'order',
            type: 'integer',
            default: 0,
            comment: 'Ordre d\'affichage'
          },
          {
            name: 'custom_label',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Label personnalisé'
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
            comment: 'Version pour la compatibilité'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Soft delete'
          }
        ],
        uniques: [
          {
            name: 'UQ_user_menu_preference_items',
            columnNames: ['user_id', 'menu_id']
          }
        ]
      }))

      // Créer les index
      await queryRunner.createIndex('user_menu_preference_items', new TableIndex({
        name: 'IDX_user_menu_preference_items_user',
        columnNames: ['user_id']
      }))

      await queryRunner.createIndex('user_menu_preference_items', new TableIndex({
        name: 'IDX_user_menu_preference_items_menu',
        columnNames: ['menu_id']
      }))

      await queryRunner.createIndex('user_menu_preference_items', new TableIndex({
        name: 'IDX_user_menu_preference_items_visible',
        columnNames: ['user_id', 'is_visible']
      }))

      // Créer la clé étrangère vers users
      await queryRunner.createForeignKey('user_menu_preference_items', new TableForeignKey({
        name: 'FK_user_menu_preference_items_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      }))

      console.log('✅ Table user_menu_preference_items créée avec succès!')
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de user_menu_preference_items:', error)
      throw error
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_menu_preference_items')
  }
}