import type { MigrationInterface, QueryRunner } from 'typeorm'

export class FixUserSocieteRoleColumns1753814054666 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la table existe
    const tableExists = await queryRunner.hasTable('user_societe_roles')

    if (tableExists) {
      // Si la table existe, vérifier si les colonnes sont correctes
      const columns = await queryRunner.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'user_societe_roles'
            `)

      const columnNames = columns.map((col: any) => col.column_name)

      // Vérifier si userId existe (pas user_id)
      if (!columnNames.includes('userId') && columnNames.includes('user_id')) {
        // Renommer la colonne
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "user_id" TO "userId"`
        )
      }

      // Vérifier si societeId existe (pas societe_id)
      if (!columnNames.includes('societeId') && columnNames.includes('societe_id')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "societe_id" TO "societeId"`
        )
      }

      // Vérifier si roleId existe (pas role_id)
      if (!columnNames.includes('roleId') && columnNames.includes('role_id')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "role_id" TO "roleId"`
        )
      }

      // Vérifier si roleType existe (pas role_type)
      if (!columnNames.includes('roleType') && columnNames.includes('role_type')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "role_type" TO "roleType"`
        )
      }

      // Vérifier si grantedById existe (pas granted_by_id)
      if (!columnNames.includes('grantedById') && columnNames.includes('granted_by_id')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "granted_by_id" TO "grantedById"`
        )
      }

      // Vérifier si grantedAt existe (pas granted_at)
      if (!columnNames.includes('grantedAt') && columnNames.includes('granted_at')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "granted_at" TO "grantedAt"`
        )
      }

      // Vérifier si expiresAt existe (pas expires_at)
      if (!columnNames.includes('expiresAt') && columnNames.includes('expires_at')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "expires_at" TO "expiresAt"`
        )
      }

      // Vérifier si isActive existe (pas is_active)
      if (!columnNames.includes('isActive') && columnNames.includes('is_active')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "is_active" TO "isActive"`
        )
      }

      // Vérifier si isDefaultSociete existe (pas is_default_societe)
      if (!columnNames.includes('isDefaultSociete') && columnNames.includes('is_default_societe')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "is_default_societe" TO "isDefaultSociete"`
        )
      }

      // Vérifier si allowedSiteIds existe (pas allowed_site_ids)
      if (!columnNames.includes('allowedSiteIds') && columnNames.includes('allowed_site_ids')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "allowed_site_ids" TO "allowedSiteIds"`
        )
      }

      // Vérifier si additionalPermissions existe (pas additional_permissions)
      if (
        !columnNames.includes('additionalPermissions') &&
        columnNames.includes('additional_permissions')
      ) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "additional_permissions" TO "additionalPermissions"`
        )
      }

      // Vérifier si restrictedPermissions existe (pas restricted_permissions)
      if (
        !columnNames.includes('restrictedPermissions') &&
        columnNames.includes('restricted_permissions')
      ) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "restricted_permissions" TO "restrictedPermissions"`
        )
      }

      // Vérifier si createdAt existe (pas created_at)
      if (!columnNames.includes('createdAt') && columnNames.includes('created_at')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "created_at" TO "createdAt"`
        )
      }

      // Vérifier si updatedAt existe (pas updated_at)
      if (!columnNames.includes('updatedAt') && columnNames.includes('updated_at')) {
        await queryRunner.query(
          `ALTER TABLE "user_societe_roles" RENAME COLUMN "updated_at" TO "updatedAt"`
        )
      }
    } else {
      // Si la table n'existe pas, on la crée avec la bonne structure
      await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "user_societe_roles" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "userId" uuid NOT NULL,
                    "societeId" uuid NOT NULL,
                    "roleId" uuid,
                    "roleType" character varying(50) NOT NULL,
                    "isDefaultSociete" boolean NOT NULL DEFAULT false,
                    "additionalPermissions" jsonb NOT NULL DEFAULT '[]'::jsonb,
                    "restrictedPermissions" jsonb NOT NULL DEFAULT '[]'::jsonb,
                    "allowedSiteIds" uuid[],
                    "grantedById" uuid,
                    "grantedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "expiresAt" TIMESTAMP,
                    "isActive" boolean NOT NULL DEFAULT true,
                    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_user_societe_roles" PRIMARY KEY ("id")
                );
                
                -- Créer les index
                CREATE INDEX IF NOT EXISTS "IDX_user_societe_roles_userId" ON "user_societe_roles" ("userId");
                CREATE INDEX IF NOT EXISTS "IDX_user_societe_roles_societeId" ON "user_societe_roles" ("societeId");
                CREATE INDEX IF NOT EXISTS "IDX_user_societe_roles_roleType" ON "user_societe_roles" ("roleType");
                CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_societe_role" ON "user_societe_roles" ("userId", "societeId");
                
                -- Ajouter les contraintes de clé étrangère
                ALTER TABLE "user_societe_roles" 
                    ADD CONSTRAINT "FK_user_societe_roles_userId" 
                    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
                    
                ALTER TABLE "user_societe_roles" 
                    ADD CONSTRAINT "FK_user_societe_roles_roleId" 
                    FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL;
                    
                ALTER TABLE "user_societe_roles" 
                    ADD CONSTRAINT "FK_user_societe_roles_grantedById" 
                    FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE SET NULL;
            `)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Renommer les colonnes en snake_case pour revenir en arrière
    const tableExists = await queryRunner.hasTable('user_societe_roles')

    if (tableExists) {
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "userId" TO "user_id"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "societeId" TO "societe_id"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "roleId" TO "role_id"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "roleType" TO "role_type"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "grantedById" TO "granted_by_id"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "grantedAt" TO "granted_at"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "expiresAt" TO "expires_at"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "isActive" TO "is_active"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "isDefaultSociete" TO "is_default_societe"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "allowedSiteIds" TO "allowed_site_ids"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "additionalPermissions" TO "additional_permissions"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "restrictedPermissions" TO "restricted_permissions"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "createdAt" TO "created_at"`
      )
      await queryRunner.query(
        `ALTER TABLE "user_societe_roles" RENAME COLUMN "updatedAt" TO "updated_at"`
      )
    }
  }
}
