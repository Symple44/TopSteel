import { type MigrationInterface, type QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateMissingTables1740100000000 implements MigrationInterface {
  name = 'CreateMissingTables1740100000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extension UUID (if not already created)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    // ===== CREATE parameters_system TABLE =====
    await queryRunner.createTable(
      new Table({
        name: 'parameters_system',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'group',
            type: 'varchar',
            length: '100',
            comment: 'Parameter group (e.g., user_roles, order_status)',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            comment: 'Parameter key (e.g., SUPER_ADMIN, PENDING)',
          },
          {
            name: 'value',
            type: 'text',
            comment: 'Main value',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY', 'ENUM', 'OBJECT'],
            default: "'STRING'",
            comment: 'Parameter type',
          },
          {
            name: 'scope',
            type: 'enum',
            enum: ['CORE', 'AUTH', 'SECURITY', 'NOTIFICATION', 'SYSTEM', 'DATABASE', 'API', 'UI'],
            default: "'SYSTEM'",
            comment: 'Parameter scope',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Technical description',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional metadata (icon, color, order, etc.)',
          },
          {
            name: 'arrayValues',
            type: 'jsonb',
            isNullable: true,
            comment: 'For ARRAY type parameters',
          },
          {
            name: 'objectValues',
            type: 'jsonb',
            isNullable: true,
            comment: 'For OBJECT type parameters',
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
            comment: 'Prevents modification',
          },
          {
            name: 'translationKey',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'i18n translation key',
          },
          {
            name: 'customTranslations',
            type: 'jsonb',
            isNullable: true,
            comment: 'Custom translations per language',
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

    // Create indexes for parameters_system
    await queryRunner.createIndex(
      'parameters_system',
      new TableIndex({
        name: 'idx_param_system_group',
        columnNames: ['group'],
      })
    )

    await queryRunner.createIndex(
      'parameters_system',
      new TableIndex({
        name: 'idx_param_system_key',
        columnNames: ['key'],
      })
    )

    await queryRunner.createIndex(
      'parameters_system',
      new TableIndex({
        name: 'idx_param_system_group_key',
        columnNames: ['group', 'key'],
      })
    )

    // ===== CREATE webhook_subscriptions TABLE =====
    await queryRunner.createTable(
      new Table({
        name: 'webhook_subscriptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'societeId',
            type: 'uuid',
            comment: 'Company ID',
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            comment: 'Webhook URL',
          },
          {
            name: 'secret',
            type: 'varchar',
            length: '128',
            comment: 'Webhook secret for signature validation',
          },
          {
            name: 'events',
            type: 'jsonb',
            default: "'[]'",
            comment: 'Array of subscribed event types',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'filters',
            type: 'jsonb',
            isNullable: true,
            comment: 'Event filters',
          },
          {
            name: 'retryPolicy',
            type: 'jsonb',
            default: `'{"maxRetries": 3, "retryDelay": 1000, "backoffMultiplier": 2}'`,
            comment: 'Retry policy configuration',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            default: `'{"totalCalls": 0, "successRate": 100}'`,
            comment: 'Webhook metadata and stats',
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create indexes for webhook_subscriptions
    await queryRunner.createIndex(
      'webhook_subscriptions',
      new TableIndex({
        name: 'IDX_webhook_subscriptions_societeId_isActive',
        columnNames: ['societeId', 'isActive'],
      })
    )

    // ===== CREATE webhook_events TABLE =====
    await queryRunner.createTable(
      new Table({
        name: 'webhook_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            comment: 'Event type',
          },
          {
            name: 'societeId',
            type: 'uuid',
            comment: 'Company ID',
          },
          {
            name: 'data',
            type: 'jsonb',
            comment: 'Event data payload',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Event metadata',
          },
          {
            name: 'timestamp',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create indexes for webhook_events
    await queryRunner.createIndex(
      'webhook_events',
      new TableIndex({
        name: 'IDX_webhook_events_societeId_type_timestamp',
        columnNames: ['societeId', 'type', 'timestamp'],
      })
    )

    // ===== CREATE webhook_deliveries TABLE =====
    await queryRunner.createTable(
      new Table({
        name: 'webhook_deliveries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'subscriptionId',
            type: 'uuid',
            comment: 'Webhook subscription ID',
          },
          {
            name: 'eventId',
            type: 'uuid',
            comment: 'Webhook event ID',
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            comment: 'Delivery URL',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            comment: 'Delivery status: pending, success, failed',
          },
          {
            name: 'attempts',
            type: 'integer',
            default: 0,
            comment: 'Number of delivery attempts',
          },
          {
            name: 'lastAttempt',
            type: 'timestamptz',
            isNullable: true,
            comment: 'Last attempt timestamp',
          },
          {
            name: 'response',
            type: 'jsonb',
            isNullable: true,
            comment: 'Response from webhook endpoint',
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Create indexes for webhook_deliveries
    await queryRunner.createIndex(
      'webhook_deliveries',
      new TableIndex({
        name: 'IDX_webhook_deliveries_subscriptionId',
        columnNames: ['subscriptionId'],
      })
    )

    await queryRunner.createIndex(
      'webhook_deliveries',
      new TableIndex({
        name: 'IDX_webhook_deliveries_eventId',
        columnNames: ['eventId'],
      })
    )

    await queryRunner.createIndex(
      'webhook_deliveries',
      new TableIndex({
        name: 'IDX_webhook_deliveries_status',
        columnNames: ['status'],
      })
    )

    // Create foreign keys for webhook_deliveries
    await queryRunner.createForeignKey(
      'webhook_deliveries',
      new TableForeignKey({
        name: 'FK_webhook_deliveries_subscription',
        columnNames: ['subscriptionId'],
        referencedTableName: 'webhook_subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createForeignKey(
      'webhook_deliveries',
      new TableForeignKey({
        name: 'FK_webhook_deliveries_event',
        columnNames: ['eventId'],
        referencedTableName: 'webhook_events',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop webhook_deliveries foreign keys
    await queryRunner.dropForeignKey('webhook_deliveries', 'FK_webhook_deliveries_event')
    await queryRunner.dropForeignKey('webhook_deliveries', 'FK_webhook_deliveries_subscription')

    // Drop indexes
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_status')
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_eventId')
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_subscriptionId')
    await queryRunner.dropIndex('webhook_events', 'IDX_webhook_events_societeId_type_timestamp')
    await queryRunner.dropIndex(
      'webhook_subscriptions',
      'IDX_webhook_subscriptions_societeId_isActive'
    )
    await queryRunner.dropIndex('parameters_system', 'idx_param_system_group_key')
    await queryRunner.dropIndex('parameters_system', 'idx_param_system_key')
    await queryRunner.dropIndex('parameters_system', 'idx_param_system_group')

    // Drop tables
    await queryRunner.dropTable('webhook_deliveries')
    await queryRunner.dropTable('webhook_events')
    await queryRunner.dropTable('webhook_subscriptions')
    await queryRunner.dropTable('parameters_system')
  }
}
