import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateSmsLogsTable1754420000000 implements MigrationInterface {
  name = 'CreateSmsLogsTable1754420000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table sms_logs
    await queryRunner.createTable(
      new Table({
        name: 'sms_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'messageType',
            type: 'varchar',
            length: '50',
            default: "'info'",
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'messageId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'cost',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'segmentCount',
            type: 'int',
            default: 1,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'societeId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Créer les index
    await queryRunner.createIndex(
      'sms_logs',
      new TableIndex({
        name: 'IDX_sms_logs_phone_created',
        columnNames: ['phoneNumber', 'createdAt'],
      })
    )

    await queryRunner.createIndex(
      'sms_logs',
      new TableIndex({
        name: 'IDX_sms_logs_type_status',
        columnNames: ['messageType', 'status'],
      })
    )

    await queryRunner.createIndex(
      'sms_logs',
      new TableIndex({
        name: 'IDX_sms_logs_provider',
        columnNames: ['provider'],
      })
    )

    await queryRunner.createIndex(
      'sms_logs',
      new TableIndex({
        name: 'IDX_sms_logs_created',
        columnNames: ['createdAt'],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sms_logs')
  }
}