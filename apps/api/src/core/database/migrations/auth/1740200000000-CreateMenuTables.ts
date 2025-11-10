import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateMenuTables1740200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table menu_configurations
    await queryRunner.query(`
      CREATE TABLE "menu_configurations" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "name" varchar(255) NOT NULL UNIQUE,
        "description" text,
        "isactive" boolean DEFAULT false NOT NULL,
        "issystem" boolean DEFAULT false NOT NULL,
        "metadata" json,
        "createdat" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedat" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "createdby" uuid,
        "updatedby" uuid
      )
    `)

    // Créer les index pour menu_configurations
    await queryRunner.query(`
      CREATE INDEX "IDX_menu_configurations_isactive" ON "menu_configurations" ("isactive")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_menu_configurations_issystem" ON "menu_configurations" ("issystem")
    `)

    // Créer la table menu_items
    await queryRunner.query(`
      CREATE TABLE "menu_items" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "configId" uuid NOT NULL,
        "parentId" uuid,
        "title" varchar(255) NOT NULL,
        "orderIndex" integer DEFAULT 0 NOT NULL,
        "isVisible" boolean DEFAULT true NOT NULL,
        "type" varchar(1) DEFAULT 'P' NOT NULL,
        "programId" varchar(255),
        "externalUrl" varchar(1000),
        "queryBuilderId" uuid,
        "metadata" json,
        "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP,
        "createdBy" uuid,
        "updatedBy" uuid,
        CONSTRAINT "FK_menu_items_configId" FOREIGN KEY ("configId") REFERENCES "menu_configurations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_menu_items_parentId" FOREIGN KEY ("parentId") REFERENCES "menu_items"("id") ON DELETE CASCADE
      )
    `)

    // Créer les index pour menu_items
    await queryRunner.query(`
      CREATE INDEX "IDX_menu_items_configId" ON "menu_items" ("configId")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_menu_items_parentId" ON "menu_items" ("parentId")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_menu_items_orderIndex" ON "menu_items" ("orderIndex")
    `)

    // Créer la table menu_item_roles
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

    // Créer la table menu_item_permissions
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

    // Ajouter des commentaires
    await queryRunner.query(`
      COMMENT ON TABLE "menu_configurations" IS 'Configurations de menu système et utilisateur'
    `)
    await queryRunner.query(`
      COMMENT ON TABLE "menu_items" IS 'Items de menu hiérarchiques'
    `)
    await queryRunner.query(`
      COMMENT ON TABLE "menu_item_roles" IS 'Association entre items de menu et rôles'
    `)
    await queryRunner.query(`
      COMMENT ON TABLE "menu_item_permissions" IS 'Association entre items de menu et permissions'
    `)

    await queryRunner.query(`
      COMMENT ON COLUMN "menu_items"."type" IS 'Type de menu: M=Dossier, P=Programme, L=Lien, D=Vue Data'
    `)
    await queryRunner.query(`
      COMMENT ON COLUMN "menu_items"."programId" IS 'Identifiant du programme pour les menus de type P'
    `)
    await queryRunner.query(`
      COMMENT ON COLUMN "menu_items"."externalUrl" IS 'URL externe pour les menus de type L'
    `)
    await queryRunner.query(`
      COMMENT ON COLUMN "menu_items"."queryBuilderId" IS 'ID de la vue Query Builder pour les menus de type D'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse (à cause des contraintes FK)
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_item_permissions"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_item_roles"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_items"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_configurations"`)
  }
}
