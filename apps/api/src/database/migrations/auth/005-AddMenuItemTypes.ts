import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddMenuItemTypes1737826400000 implements MigrationInterface {
  name = 'AddMenuItemTypes1737826400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne type aux menu_items
    await queryRunner.addColumn('menu_items', new TableColumn({
      name: 'type',
      type: 'varchar',
      length: '1',
      default: "'P'", // Par défaut Programme pour compatibilité
      comment: 'Type de menu: M=Dossier, P=Programme, L=Lien, D=Vue Data'
    }))

    // Ajouter la colonne query_builder_id pour les menus de type D
    await queryRunner.addColumn('menu_items', new TableColumn({
      name: 'query_builder_id',
      type: 'uuid',
      isNullable: true,
      comment: 'ID de la vue Query Builder pour les menus de type D'
    }))

    // Ajouter la colonne external_url pour les menus de type L
    await queryRunner.addColumn('menu_items', new TableColumn({
      name: 'external_url',
      type: 'varchar',
      length: '1000',
      isNullable: true,
      comment: 'URL externe pour les menus de type L'
    }))

    // Ajouter la colonne program_id pour les menus de type P
    await queryRunner.addColumn('menu_items', new TableColumn({
      name: 'program_id',
      type: 'varchar',
      length: '255',
      isNullable: true,
      comment: 'Identifiant du programme pour les menus de type P'
    }))

    // Mettre à jour les données existantes
    // Les items avec href deviennent des programmes (P)
    await queryRunner.query(`
      UPDATE menu_items 
      SET type = 'P', program_id = href
      WHERE href IS NOT NULL AND href != ''
    `)

    // Les items sans href ni enfants deviennent des dossiers (M)
    await queryRunner.query(`
      UPDATE menu_items 
      SET type = 'M'
      WHERE (href IS NULL OR href = '') 
      AND id NOT IN (
        SELECT DISTINCT parent_id 
        FROM menu_items 
        WHERE parent_id IS NOT NULL
      )
    `)

    // Les items parents sans href deviennent des dossiers (M)
    await queryRunner.query(`
      UPDATE menu_items 
      SET type = 'M'
      WHERE (href IS NULL OR href = '') 
      AND id IN (
        SELECT DISTINCT parent_id 
        FROM menu_items 
        WHERE parent_id IS NOT NULL
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('menu_items', 'program_id')
    await queryRunner.dropColumn('menu_items', 'external_url')
    await queryRunner.dropColumn('menu_items', 'query_builder_id')
    await queryRunner.dropColumn('menu_items', 'type')
  }
}