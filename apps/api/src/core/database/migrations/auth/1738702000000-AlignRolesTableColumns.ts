import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AlignRolesTableColumns1738702000000 implements MigrationInterface {
  name = 'AlignRolesTableColumns1738702000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la colonne 'nom' existe et 'name' n'existe pas
    const columns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'roles' 
      AND table_schema = 'public'
    `)

    const columnNames = columns.map((col: any) => col.column_name)

    if (columnNames.includes('nom') && !columnNames.includes('name')) {
      // Renommer la colonne 'nom' en 'name'
      await queryRunner.query(`ALTER TABLE roles RENAME COLUMN nom TO name`)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la colonne 'name' existe et 'nom' n'existe pas
    const columns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'roles' 
      AND table_schema = 'public'
    `)

    const columnNames = columns.map((col: any) => col.column_name)

    if (columnNames.includes('name') && !columnNames.includes('nom')) {
      // Renommer la colonne 'name' en 'nom'
      await queryRunner.query(`ALTER TABLE roles RENAME COLUMN name TO nom`)
    }
  }
}
