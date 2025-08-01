import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm'

export class CreateMenuPermissionTables1737826500000 implements MigrationInterface {
  name = 'CreateMenuPermissionTables1737826500000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Créer la table menu_item_permissions
      await queryRunner.createTable(
        new Table({
          name: 'menu_item_permissions',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'menuItemId',
              type: 'uuid',
              comment: "Référence vers l'item de menu",
            },
            {
              name: 'permissionId',
              type: 'uuid',
              comment: 'Référence vers la permission',
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          uniques: [
            {
              name: 'UQ_menu_item_permission',
              columnNames: ['menuItemId', 'permissionId'],
            },
          ],
        })
      )

      // Créer la table menu_item_roles
      await queryRunner.createTable(
        new Table({
          name: 'menu_item_roles',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'menuItemId',
              type: 'uuid',
              comment: "Référence vers l'item de menu",
            },
            {
              name: 'roleId',
              type: 'uuid',
              comment: 'Référence vers le rôle',
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          uniques: [
            {
              name: 'UQ_menu_item_role',
              columnNames: ['menuItemId', 'roleId'],
            },
          ],
        })
      )

      // Créer les clés étrangères pour menu_item_permissions
      await queryRunner.createForeignKey(
        'menu_item_permissions',
        new TableForeignKey({
          name: 'FK_menu_item_permissions_item',
          columnNames: ['menuItemId'],
          referencedTableName: 'menu_items',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        })
      )

      await queryRunner.createForeignKey(
        'menu_item_permissions',
        new TableForeignKey({
          name: 'FK_menu_item_permissions_permission',
          columnNames: ['permissionId'],
          referencedTableName: 'permissions',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        })
      )

      // Créer les clés étrangères pour menu_item_roles
      await queryRunner.createForeignKey(
        'menu_item_roles',
        new TableForeignKey({
          name: 'FK_menu_item_roles_item',
          columnNames: ['menuItemId'],
          referencedTableName: 'menu_items',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        })
      )

      await queryRunner.createForeignKey(
        'menu_item_roles',
        new TableForeignKey({
          name: 'FK_menu_item_roles_role',
          columnNames: ['roleId'],
          referencedTableName: 'roles',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        })
      )

      // Créer les index
      await queryRunner.createIndex(
        'menu_item_permissions',
        new TableIndex({
          name: 'IDX_menu_item_permissions_menu',
          columnNames: ['menuItemId'],
        })
      )

      await queryRunner.createIndex(
        'menu_item_permissions',
        new TableIndex({
          name: 'IDX_menu_item_permissions_permission',
          columnNames: ['permissionId'],
        })
      )

      await queryRunner.createIndex(
        'menu_item_roles',
        new TableIndex({
          name: 'IDX_menu_item_roles_menu',
          columnNames: ['menuItemId'],
        })
      )

      await queryRunner.createIndex(
        'menu_item_roles',
        new TableIndex({
          name: 'IDX_menu_item_roles_role',
          columnNames: ['roleId'],
        })
      )
    } catch (error) {
      throw error
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('menu_item_roles')
    await queryRunner.dropTable('menu_item_permissions')
  }
}
