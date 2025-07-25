import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm'

export class CreateMenuItemsTable1737826300000 implements MigrationInterface {
  name = 'CreateMenuItemsTable1737826300000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Création de la table menu_items...')
    
    try {
      // Créer la table menu_items
      await queryRunner.createTable(new Table({
        name: 'menu_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'configId',
            type: 'uuid',
            comment: 'Référence vers la configuration de menu'
          },
          {
            name: 'parentId',
            type: 'uuid',
            isNullable: true,
            comment: 'Parent du menu pour la hiérarchie'
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            comment: 'Titre affiché du menu'
          },
          {
            name: 'type',
            type: 'varchar',
            length: '1',
            default: "'P'",
            comment: 'Type de menu: M=Dossier, P=Programme, L=Lien, D=Vue Data'
          },
          {
            name: 'programId',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Identifiant du programme pour les menus de type P'
          },
          {
            name: 'externalUrl',
            type: 'varchar',
            length: '1000',
            isNullable: true,
            comment: 'URL externe pour les menus de type L'
          },
          {
            name: 'queryBuilderId',
            type: 'uuid',
            isNullable: true,
            comment: 'ID de la vue Query Builder pour les menus de type D'
          },
          {
            name: 'orderIndex',
            type: 'integer',
            default: 0,
            comment: 'Ordre d\'affichage'
          },
          {
            name: 'isVisible',
            type: 'boolean',
            default: true,
            comment: 'Visibilité du menu'
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Métadonnées additionnelles'
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true
          }
        ]
      }))

      // Créer les clés étrangères
      await queryRunner.createForeignKey('menu_items', new TableForeignKey({
        name: 'FK_menu_items_config',
        columnNames: ['configId'],
        referencedTableName: 'menu_configurations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      }))

      await queryRunner.createForeignKey('menu_items', new TableForeignKey({
        name: 'FK_menu_items_parent',
        columnNames: ['parentId'],
        referencedTableName: 'menu_items',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      }))

      // Créer les index
      await queryRunner.createIndex('menu_items', new TableIndex({
        name: 'IDX_menu_items_config',
        columnNames: ['configId']
      }))

      await queryRunner.createIndex('menu_items', new TableIndex({
        name: 'IDX_menu_items_parent',
        columnNames: ['parentId']
      }))

      await queryRunner.createIndex('menu_items', new TableIndex({
        name: 'IDX_menu_items_type',
        columnNames: ['type']
      }))

      await queryRunner.createIndex('menu_items', new TableIndex({
        name: 'IDX_menu_items_order',
        columnNames: ['configId', 'parentId', 'orderIndex']
      }))

      console.log('✅ Table menu_items créée avec succès!')
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de menu_items:', error)
      throw error
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('menu_items')
  }
}