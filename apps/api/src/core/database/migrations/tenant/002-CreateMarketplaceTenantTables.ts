import { type MigrationInterface, type QueryRunner, Table } from 'typeorm'

export class CreateMarketplaceTenantTables1737700000001 implements MigrationInterface {
  name = 'CreateMarketplaceTenantTables1737700000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table module_installations (données spécifiques au tenant)
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
            name: 'module_id',
            type: 'uuid',
            comment: 'Référence vers marketplace_modules dans la base auth',
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '100',
            comment: 'Code de la société/tenant',
          },
          {
            name: 'configuration',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['INSTALLING', 'ACTIVE', 'SUSPENDED', 'UNINSTALLING'],
            default: "'INSTALLING'",
          },
          {
            name: 'installed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'suspended_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'uninstalled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'suspension_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'auto_update',
            type: 'boolean',
            default: true,
          },
          {
            name: 'last_health_check',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'health_status',
            type: 'enum',
            enum: ['HEALTHY', 'WARNING', 'ERROR', 'UNKNOWN'],
            default: "'UNKNOWN'",
          },
          {
            name: 'error_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'last_error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'usage_stats',
            type: 'jsonb',
            default: "'{}'",
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
            name: 'installed_by',
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
            name: 'IDX_module_installations_module_id',
            columnNames: ['module_id'],
          },
          {
            name: 'IDX_module_installations_tenant_id',
            columnNames: ['tenant_id'],
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
        uniques: [
          {
            name: 'UQ_module_installations_module_tenant',
            columnNames: ['module_id', 'tenant_id'],
          },
        ],
      }),
      true
    )

    // Table module_ratings (évaluations spécifiques au tenant)
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
            comment: 'Référence vers marketplace_modules dans la base auth',
          },
          {
            name: 'user_id',
            type: 'uuid',
            comment: 'Référence vers users dans la base auth',
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '100',
            comment: 'Code de la société/tenant',
          },
          {
            name: 'rating',
            type: 'integer',
            comment: 'Note de 1 à 5',
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'pros',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cons',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'would_recommend',
            type: 'boolean',
            default: true,
          },
          {
            name: 'usage_duration_months',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
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
        ],
        indices: [
          {
            name: 'IDX_module_ratings_module_id',
            columnNames: ['module_id'],
          },
          {
            name: 'IDX_module_ratings_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'IDX_module_ratings_tenant_id',
            columnNames: ['tenant_id'],
          },
          {
            name: 'IDX_module_ratings_rating',
            columnNames: ['rating'],
          },
          {
            name: 'IDX_module_ratings_is_active',
            columnNames: ['is_active'],
          },
        ],
        uniques: [
          {
            name: 'UQ_module_ratings_user_module',
            columnNames: ['user_id', 'module_id', 'tenant_id'],
          },
        ],
      }),
      true
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('module_ratings', true)
    await queryRunner.dropTable('module_installations', true)
  }
}
