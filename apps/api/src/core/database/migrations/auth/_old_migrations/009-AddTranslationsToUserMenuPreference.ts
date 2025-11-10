import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm'

export class AddTranslationsToUserMenuPreference1737990000000 implements MigrationInterface {
  name = 'AddTranslationsToUserMenuPreference1737990000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne title_translations pour stocker les traductions
    await queryRunner.addColumn(
      'user_menu_preference_items',
      new TableColumn({
        name: 'title_translations',
        type: 'jsonb',
        isNullable: true,
        comment:
          'JSON object containing translations for the menu item title in different languages',
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la colonne title_translations
    await queryRunner.dropColumn('user_menu_preference_items', 'title_translations')
  }
}
