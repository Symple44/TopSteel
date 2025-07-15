import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class AddSystemParameters1752530100000 implements MigrationInterface {
  name = 'AddSystemParameters1752530100000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'system_parameters',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'value',
            type: 'text',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ENUM'],
            default: "'STRING'",
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['GENERAL', 'COMPTABILITE', 'PROJETS', 'PRODUCTION', 'ACHATS', 'STOCKS', 'NOTIFICATION', 'SECURITY'],
            default: "'GENERAL'",
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'defaultValue',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isEditable',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isSecret',
            type: 'boolean',
            default: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    )

    // Créer un index sur la clé pour les performances
    await queryRunner.query(`
      CREATE INDEX "IDX_system_parameters_key" ON "system_parameters" ("key")
    `)

    // Créer un index sur la catégorie
    await queryRunner.query(`
      CREATE INDEX "IDX_system_parameters_category" ON "system_parameters" ("category")
    `)

    // Créer un trigger pour mettre à jour automatiquement updatedAt
    await queryRunner.query(`
      CREATE TRIGGER update_system_parameters_updated_at
        BEFORE UPDATE ON system_parameters
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_system_parameters_updated_at ON system_parameters`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_parameters_category"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_parameters_key"`)
    await queryRunner.dropTable('system_parameters')
  }
}