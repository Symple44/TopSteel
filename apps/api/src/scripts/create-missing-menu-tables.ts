#!/usr/bin/env ts-node
import 'reflect-metadata'
import { DataSource } from 'typeorm'

async function createMissingMenuTables() {
  console.log('🔄 Création des tables de menu manquantes...')

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
    synchronize: false,
    logging: true,
  })

  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie')

    const queryRunner = dataSource.createQueryRunner()

    // Vérifier si menu_item_roles existe
    const rolesTableExists = await queryRunner.hasTable('menu_item_roles')
    if (!rolesTableExists) {
      console.log('📋 Création de la table menu_item_roles...')
      await queryRunner.query(`
        CREATE TABLE "menu_item_roles" (
          "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          "menuItemId" uuid NOT NULL,
          "roleId" varchar(50) NOT NULL,
          "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT "FK_menu_item_roles_menuItemId" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE,
          CONSTRAINT "UQ_menu_item_roles_menuItemId_roleId" UNIQUE ("menuItemId", "roleId")
        )
      `)
      console.log('✅ Table menu_item_roles créée')
    } else {
      console.log('ℹ️ Table menu_item_roles existe déjà')
    }

    // Vérifier si menu_item_permissions existe
    const permissionsTableExists = await queryRunner.hasTable('menu_item_permissions')
    if (!permissionsTableExists) {
      console.log('📋 Création de la table menu_item_permissions...')
      await queryRunner.query(`
        CREATE TABLE "menu_item_permissions" (
          "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          "menuItemId" uuid NOT NULL,
          "permissionId" varchar(100) NOT NULL,
          "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT "FK_menu_item_permissions_menuItemId" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE,
          CONSTRAINT "UQ_menu_item_permissions_menuItemId_permissionId" UNIQUE ("menuItemId", "permissionId")
        )
      `)
      console.log('✅ Table menu_item_permissions créée')
    } else {
      console.log('ℹ️ Table menu_item_permissions existe déjà')
    }

    await queryRunner.release()
    console.log('✅ Création des tables terminée avec succès')
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error)
    process.exit(1)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
      console.log('🔌 Connexion fermée')
    }
  }
}

// Exécution du script
createMissingMenuTables().catch(console.error)