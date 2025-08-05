import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAllDeletedAt1754421000000 implements MigrationInterface {
  name = 'AddAllDeletedAt1754421000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Ajout des colonnes deleted_at manquantes pour le soft delete...')

    // Liste de toutes les tables qui héritent de BaseEntity et ont besoin de deleted_at
    const tables = [
      'roles',
      'permissions',
      'role_permissions',
      'users',
      'user_sessions',
      'user_societe_roles',
      'societe_users',
      'societes',
      'sites',
      'groupes',
      'group_roles',
      'user_groups',
      'parameter_system',
      'user_mfa',
      'mfa_session',
      'webauthn_credential',
    ]

    for (const table of tables) {
      try {
        // Vérifier si la table existe
        const tableExists = await queryRunner.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `,
          [table]
        )

        if (tableExists[0].exists) {
          // Vérifier si deleted_at existe déjà
          const columnExists = await queryRunner.query(
            `
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = $1 
              AND column_name = 'deleted_at'
            )
          `,
            [table]
          )

          if (columnExists[0].exists) {
            console.log(`   ℹ️  ${table} a déjà deleted_at`)
          } else {
            await queryRunner.query(`
              ALTER TABLE ${table} 
              ADD COLUMN deleted_at TIMESTAMP NULL
            `)
            console.log(`   ✅ Colonne deleted_at ajoutée à ${table}`)
          }
        } else {
          console.log(`   ⚠️  Table ${table} n'existe pas`)
        }
      } catch (error: any) {
        console.error(`   ❌ Erreur pour ${table}: ${error.message}`)
      }
    }

    console.log('✅ Colonnes deleted_at ajoutées')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // On ne supprime pas les colonnes deleted_at car cela pourrait causer des pertes de données
    console.log('⚠️  Rollback non implémenté - les colonnes deleted_at sont conservées')
  }
}
