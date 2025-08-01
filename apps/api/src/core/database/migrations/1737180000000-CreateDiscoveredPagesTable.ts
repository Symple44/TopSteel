import { type MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateDiscoveredPagesTable1737180000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'discovered_pages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'page_id',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'href',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
          },
          {
            name: 'subcategory',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'required_permissions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'required_roles',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'module_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_visible',
            type: 'boolean',
            default: true,
          },
          {
            name: 'default_access_level',
            type: 'varchar',
            default: "'ADMIN'",
          },
          {
            name: 'default_order',
            type: 'integer',
            default: 0,
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
          },
        ],
      }),
      true
    )

    // Index sur page_id pour les recherches rapides
    await queryRunner.createIndex(
      'discovered_pages',
      new TableIndex({
        name: 'IDX_discovered_pages_page_id',
        columnNames: ['page_id'],
        isUnique: true,
      })
    )

    // Index sur category pour les regroupements
    await queryRunner.createIndex(
      'discovered_pages',
      new TableIndex({
        name: 'IDX_discovered_pages_category',
        columnNames: ['category'],
      })
    )

    // Index sur is_enabled pour les filtres
    await queryRunner.createIndex(
      'discovered_pages',
      new TableIndex({
        name: 'IDX_discovered_pages_is_enabled',
        columnNames: ['is_enabled'],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('discovered_pages')
  }
}
