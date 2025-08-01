import { type MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateMarketplaceModulesOnly1737700000000 implements MigrationInterface {
  name = 'CreateMarketplaceModulesOnly1737700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables installations et ratings si elles existent (elles ne devraient pas être dans auth)
    await queryRunner.query(`DROP TABLE IF EXISTS "module_ratings" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "module_installations" CASCADE`)

    // Vérifier si la table marketplace_modules existe déjà
    const tableExists = await queryRunner.hasTable('marketplace_modules')

    if (!tableExists) {
      // Créer seulement la table marketplace_modules (catalogue global)
      await queryRunner.createTable(
        new Table({
          name: 'marketplace_modules',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'module_key',
              type: 'varchar',
              length: '100',
              isUnique: true,
            },
            {
              name: 'display_name',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'description',
              type: 'text',
            },
            {
              name: 'short_description',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'category',
              type: 'enum',
              enum: [
                'HR',
                'PROCUREMENT',
                'ANALYTICS',
                'INTEGRATION',
                'QUALITY',
                'MAINTENANCE',
                'FINANCE',
              ],
            },
            {
              name: 'version',
              type: 'varchar',
              length: '50',
            },
            {
              name: 'publisher',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'status',
              type: 'enum',
              enum: ['DRAFT', 'PUBLISHED', 'DEPRECATED'],
              default: "'DRAFT'",
            },
            {
              name: 'pricing',
              type: 'jsonb',
            },
            {
              name: 'dependencies',
              type: 'jsonb',
              default: "'[]'",
            },
            {
              name: 'menu_configuration',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'permissions',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'api_routes',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'icon',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'metadata',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'download_count',
              type: 'integer',
              default: 0,
            },
            {
              name: 'rating_average',
              type: 'decimal',
              precision: 3,
              scale: 2,
              default: 0,
            },
            {
              name: 'rating_count',
              type: 'integer',
              default: 0,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'created_by',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'updated_by',
              type: 'uuid',
              isNullable: true,
            },
          ],
          indices: [
            {
              name: 'IDX_marketplace_modules_module_key',
              columnNames: ['module_key'],
            },
            {
              name: 'IDX_marketplace_modules_category',
              columnNames: ['category'],
            },
            {
              name: 'IDX_marketplace_modules_status',
              columnNames: ['status'],
            },
            {
              name: 'IDX_marketplace_modules_is_active',
              columnNames: ['is_active'],
            },
          ],
        }),
        true
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('marketplace_modules', true)
  }
}
