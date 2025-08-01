import { type MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateMarketplaceTables1737600000000 implements MigrationInterface {
  name = 'CreateMarketplaceTables1737600000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table marketplace_modules
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
            length: '100',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['DRAFT', 'PUBLISHED', 'DEPRECATED', 'DISABLED'],
            default: "'DRAFT'",
          },
          {
            name: 'pricing',
            type: 'json',
          },
          {
            name: 'dependencies',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'menu_configuration',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'permissions',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'api_routes',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
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
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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
            isUnique: true,
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

    // Table module_installations
    await queryRunner.createTable(
      new Table({
        name: 'module_installations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'module_id',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'INSTALLING', 'INSTALLED', 'FAILED', 'UNINSTALLING', 'UNINSTALLED'],
            default: "'PENDING'",
          },
          {
            name: 'installed_version',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'configuration',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'installation_logs',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'installed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
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
          {
            name: 'installed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'uninstalled_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['module_id'],
            referencedTableName: 'marketplace_modules',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            name: 'IDX_module_installations_tenant_module',
            columnNames: ['tenant_id', 'module_id'],
            isUnique: true,
          },
          {
            name: 'IDX_module_installations_tenant_id',
            columnNames: ['tenant_id'],
          },
          {
            name: 'IDX_module_installations_module_id',
            columnNames: ['module_id'],
          },
          {
            name: 'IDX_module_installations_status',
            columnNames: ['status'],
          },
          {
            name: 'IDX_module_installations_is_active',
            columnNames: ['is_active'],
          },
        ],
      }),
      true
    )

    // Table module_ratings
    await queryRunner.createTable(
      new Table({
        name: 'module_ratings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'module_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'rating',
            type: 'integer',
            default: 5,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'is_visible',
            type: 'boolean',
            default: true,
          },
          {
            name: 'helpful_count',
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
        foreignKeys: [
          {
            columnNames: ['module_id'],
            referencedTableName: 'marketplace_modules',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            name: 'IDX_module_ratings_module_user',
            columnNames: ['module_id', 'user_id'],
            isUnique: true,
          },
          {
            name: 'IDX_module_ratings_module_id',
            columnNames: ['module_id'],
          },
          {
            name: 'IDX_module_ratings_user_id',
            columnNames: ['user_id'],
          },
        ],
      }),
      true
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('module_ratings')
    await queryRunner.dropTable('module_installations')
    await queryRunner.dropTable('marketplace_modules')
  }
}
