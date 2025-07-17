import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm'

export class CreateUserMenuPreferences1752540000000 implements MigrationInterface {
  name = 'CreateUserMenuPreferences1752540000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table user_menu_preferences
    await queryRunner.createTable(
      new Table({
        name: 'user_menu_preferences',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'selectedPages',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'menuMode',
            type: 'varchar',
            default: "'standard'",
          },
          {
            name: 'pageCustomizations',
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
        foreignKeys: [
          {
            name: 'FK_user_menu_preferences_user',
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    )

    // Index will be created by TypeORM annotations
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_menu_preferences')
  }
}