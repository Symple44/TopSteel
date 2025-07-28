import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateParametersTables1737500000012 implements MigrationInterface {
  name = 'CreateParametersTables1737500000012'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table des paramètres système
    await queryRunner.createTable(
      new Table({
        name: 'parameters_system',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'group',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY', 'ENUM', 'OBJECT'],
            default: "'STRING'",
          },
          {
            name: 'scope',
            type: 'enum',
            enum: ['CORE', 'AUTH', 'SECURITY', 'NOTIFICATION', 'SYSTEM', 'DATABASE', 'API', 'UI'],
            default: "'SYSTEM'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'arrayValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'objectValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isReadonly',
            type: 'boolean',
            default: false,
          },
          {
            name: 'defaultLanguage',
            type: 'varchar',
            length: '10',
            default: "'fr'",
          },
          {
            name: 'translations',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Table des paramètres applicatifs
    await queryRunner.createTable(
      new Table({
        name: 'parameters_application',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'group',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY', 'ENUM', 'OBJECT', 'FORMULA', 'TEMPLATE'],
            default: "'STRING'",
          },
          {
            name: 'scope',
            type: 'enum',
            enum: ['BUSINESS', 'WORKFLOW', 'PROCESS', 'INTEGRATION', 'REPORTING', 'AUTOMATION', 'VALIDATION'],
            default: "'BUSINESS'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'businessRules',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'arrayValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'objectValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'formula',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'template',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isEditable',
            type: 'boolean',
            default: true,
          },
          {
            name: 'defaultLanguage',
            type: 'varchar',
            length: '10',
            default: "'fr'",
          },
          {
            name: 'translations',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Table des paramètres clients
    await queryRunner.createTable(
      new Table({
        name: 'parameters_client',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'group',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY', 'ENUM', 'OBJECT', 'COLOR', 'FILE', 'URL'],
            default: "'STRING'",
          },
          {
            name: 'scope',
            type: 'enum',
            enum: ['PREFERENCE', 'CONFIGURATION', 'CUSTOMIZATION', 'WORKFLOW', 'DISPLAY', 'BEHAVIOR', 'INTEGRATION'],
            default: "'PREFERENCE'",
          },
          {
            name: 'access',
            type: 'enum',
            enum: ['READ_ONLY', 'USER_EDITABLE', 'ADMIN_ONLY', 'SYSTEM_MANAGED'],
            default: "'USER_EDITABLE'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'constraints',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'arrayValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'objectValues',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'defaultValue',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isVisible',
            type: 'boolean',
            default: true,
          },
          {
            name: 'defaultLanguage',
            type: 'varchar',
            length: '10',
            default: "'fr'",
          },
          {
            name: 'translations',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Index pour parameters_system
    await queryRunner.query('CREATE INDEX idx_param_system_group ON parameters_system ("group")')
    await queryRunner.query('CREATE INDEX idx_param_system_key ON parameters_system ("key")')
    await queryRunner.query('CREATE INDEX idx_param_system_group_key ON parameters_system ("group", "key")')

    // Index pour parameters_application
    await queryRunner.query('CREATE INDEX idx_param_app_group ON parameters_application ("group")')
    await queryRunner.query('CREATE INDEX idx_param_app_key ON parameters_application ("key")')
    await queryRunner.query('CREATE INDEX idx_param_app_group_key ON parameters_application ("group", "key")')
    await queryRunner.query('CREATE INDEX idx_param_app_scope ON parameters_application ("scope")')

    // Index pour parameters_client
    await queryRunner.query('CREATE INDEX idx_param_client_tenant ON parameters_client ("tenantId")')
    await queryRunner.query('CREATE INDEX idx_param_client_group ON parameters_client ("group")')
    await queryRunner.query('CREATE INDEX idx_param_client_key ON parameters_client ("key")')
    await queryRunner.query('CREATE INDEX idx_param_client_tenant_group_key ON parameters_client ("tenantId", "group", "key")')
    await queryRunner.query('CREATE INDEX idx_param_client_user ON parameters_client ("userId")')
    await queryRunner.query('CREATE INDEX idx_param_client_scope ON parameters_client ("scope")')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('parameters_client')
    await queryRunner.dropTable('parameters_application')
    await queryRunner.dropTable('parameters_system')
  }
}