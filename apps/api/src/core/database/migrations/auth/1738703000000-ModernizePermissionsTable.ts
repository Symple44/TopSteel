import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ModernizePermissionsTable1738703000000 implements MigrationInterface {
  name = 'ModernizePermissionsTable1738703000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ajouter les nouvelles colonnes si elles n'existent pas
    const columns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'permissions' 
      AND table_schema = 'public'
    `)

    const columnNames = columns.map((col: { column_name: string }) => col.column_name)

    // Ajouter la colonne 'name' si elle n'existe pas
    if (!columnNames.includes('name')) {
      await queryRunner.query(`ALTER TABLE permissions ADD COLUMN name VARCHAR(100)`)
      // Copier les données de 'nom' vers 'name'
      await queryRunner.query(`UPDATE permissions SET name = nom WHERE nom IS NOT NULL`)
      // Rendre la colonne NOT NULL après avoir copié les données
      await queryRunner.query(`ALTER TABLE permissions ALTER COLUMN name SET NOT NULL`)
    }

    // Ajouter la colonne 'resource' si elle n'existe pas
    if (!columnNames.includes('resource')) {
      await queryRunner.query(`ALTER TABLE permissions ADD COLUMN resource VARCHAR(255)`)
      // Copier les données de 'module' vers 'resource'
      await queryRunner.query(`UPDATE permissions SET resource = module WHERE module IS NOT NULL`)
      // Si pas de module, utiliser une valeur par défaut basée sur le nom
      await queryRunner.query(
        `UPDATE permissions SET resource = LOWER(REPLACE(COALESCE(name, nom), ' ', '-')) WHERE resource IS NULL`
      )
      // Rendre la colonne NOT NULL
      await queryRunner.query(`ALTER TABLE permissions ALTER COLUMN resource SET NOT NULL`)
    }

    // Ajouter la colonne 'scope' si elle n'existe pas
    if (!columnNames.includes('scope')) {
      await queryRunner.query(
        `ALTER TABLE permissions ADD COLUMN scope VARCHAR(50) DEFAULT 'application' NOT NULL`
      )
    }

    // Ajouter la colonne 'isActive' si elle n'existe pas
    if (!columnNames.includes('isActive')) {
      await queryRunner.query(
        `ALTER TABLE permissions ADD COLUMN "isActive" BOOLEAN DEFAULT true NOT NULL`
      )
    }

    // Ajouter la colonne 'metadata' si elle n'existe pas
    if (!columnNames.includes('metadata')) {
      await queryRunner.query(
        `ALTER TABLE permissions ADD COLUMN metadata JSONB DEFAULT '{}' NOT NULL`
      )
    }

    // Ajouter les colonnes d'audit si elles n'existent pas
    if (!columnNames.includes('updated_at')) {
      await queryRunner.query(
        `ALTER TABLE permissions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL`
      )
    }

    if (!columnNames.includes('deleted_at')) {
      await queryRunner.query(`ALTER TABLE permissions ADD COLUMN deleted_at TIMESTAMP`)
    }

    if (!columnNames.includes('version')) {
      await queryRunner.query(
        `ALTER TABLE permissions ADD COLUMN version INTEGER DEFAULT 1 NOT NULL`
      )
    }

    if (!columnNames.includes('created_by_id')) {
      await queryRunner.query(`ALTER TABLE permissions ADD COLUMN created_by_id UUID`)
    }

    if (!columnNames.includes('updated_by_id')) {
      await queryRunner.query(`ALTER TABLE permissions ADD COLUMN updated_by_id UUID`)
    }

    // 2. Créer les index nécessaires
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_permissions_resource" ON permissions (resource)`
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_permissions_scope" ON permissions (scope)`
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_permissions_isActive" ON permissions ("isActive")`
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_permissions_societe_id" ON permissions (societe_id)`
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_permissions_deleted_at" ON permissions (deleted_at)`
    )

    // 3. Créer un trigger pour updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_permissions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    await queryRunner.query(`
      CREATE TRIGGER update_permissions_updated_at_trigger
      BEFORE UPDATE ON permissions
      FOR EACH ROW
      EXECUTE FUNCTION update_permissions_updated_at();
    `)

    // 4. Ajouter les contraintes de clés étrangères pour l'audit
    await queryRunner.query(`
      ALTER TABLE permissions 
      ADD CONSTRAINT "FK_permissions_created_by" 
      FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
    `)

    await queryRunner.query(`
      ALTER TABLE permissions 
      ADD CONSTRAINT "FK_permissions_updated_by" 
      FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE SET NULL
    `)

    // 5. Mettre à jour les métadonnées pour les permissions existantes
    await queryRunner.query(`
      UPDATE permissions 
      SET metadata = jsonb_build_object(
        'migrated_from_legacy', true,
        'original_module', module,
        'migration_date', CURRENT_TIMESTAMP
      )
      WHERE metadata = '{}'::jsonb
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Supprimer les contraintes
    await queryRunner.query(
      `ALTER TABLE permissions DROP CONSTRAINT IF EXISTS "FK_permissions_created_by"`
    )
    await queryRunner.query(
      `ALTER TABLE permissions DROP CONSTRAINT IF EXISTS "FK_permissions_updated_by"`
    )

    // 2. Supprimer le trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_permissions_updated_at_trigger ON permissions`
    )
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_permissions_updated_at()`)

    // 3. Supprimer les index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_resource"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_scope"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_isActive"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_societe_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_deleted_at"`)

    // 4. Supprimer les colonnes ajoutées (dans l'ordre inverse)
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS updated_by_id`)
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS created_by_id`)
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS version`)
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS deleted_at`)
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS updated_at`)
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS metadata`)
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS "isActive"`)
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS scope`)
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS resource`)
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS name`)
  }
}
