import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class FixUserMfaColumns1740500000000 implements MigrationInterface {
  name = 'FixUserMfaColumns1740500000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la table existe
    const tableExists = await queryRunner.hasTable('user_mfa')
    if (!tableExists) {
      console.log('⚠️  Table user_mfa does not exist, skipping migration')
      return
    }

    console.log('📝 Fixing user_mfa table columns...')

    // 1. Ajouter la colonne 'type' si elle n'existe pas
    const hasType = await queryRunner.hasColumn('user_mfa', 'type')
    if (!hasType) {
      await queryRunner.addColumn(
        'user_mfa',
        new TableColumn({
          name: 'type',
          type: 'varchar',
          length: '50',
          default: "'totp'",
          isNullable: false,
        })
      )
      console.log('✅ Added column: type')
    }

    // 2. Ajouter la colonne 'is_verified' si elle n'existe pas
    const hasIsVerified = await queryRunner.hasColumn('user_mfa', 'is_verified')
    if (!hasIsVerified) {
      await queryRunner.addColumn(
        'user_mfa',
        new TableColumn({
          name: 'is_verified',
          type: 'boolean',
          default: false,
          isNullable: false,
        })
      )
      console.log('✅ Added column: is_verified')
    }

    // 3. Renommer 'secret_key' en 'secret' si nécessaire
    const hasSecretKey = await queryRunner.hasColumn('user_mfa', 'secret_key')
    const hasSecret = await queryRunner.hasColumn('user_mfa', 'secret')
    if (hasSecretKey && !hasSecret) {
      await queryRunner.renameColumn('user_mfa', 'secret_key', 'secret')
      console.log('✅ Renamed column: secret_key -> secret')
    } else if (!hasSecret) {
      // Si ni secret_key ni secret n'existent, créer secret
      await queryRunner.addColumn(
        'user_mfa',
        new TableColumn({
          name: 'secret',
          type: 'varchar',
          length: '255',
          isNullable: true,
        })
      )
      console.log('✅ Added column: secret')
    }

    // 4. Vérifier/modifier backup_codes pour être nullable varchar(255)
    const hasBackupCodes = await queryRunner.hasColumn('user_mfa', 'backup_codes')
    if (hasBackupCodes) {
      // Modifier pour s'assurer que c'est varchar nullable
      await queryRunner.changeColumn(
        'user_mfa',
        'backup_codes',
        new TableColumn({
          name: 'backup_codes',
          type: 'varchar',
          length: '255',
          isNullable: true,
        })
      )
      console.log('✅ Modified column: backup_codes')
    } else {
      await queryRunner.addColumn(
        'user_mfa',
        new TableColumn({
          name: 'backup_codes',
          type: 'varchar',
          length: '255',
          isNullable: true,
        })
      )
      console.log('✅ Added column: backup_codes')
    }

    // 5. Ajouter 'phone_number' si elle n'existe pas
    const hasPhoneNumber = await queryRunner.hasColumn('user_mfa', 'phone_number')
    if (!hasPhoneNumber) {
      await queryRunner.addColumn(
        'user_mfa',
        new TableColumn({
          name: 'phone_number',
          type: 'varchar',
          length: '255',
          isNullable: true,
        })
      )
      console.log('✅ Added column: phone_number')
    }

    // 6. Ajouter 'email' si elle n'existe pas
    const hasEmail = await queryRunner.hasColumn('user_mfa', 'email')
    if (!hasEmail) {
      await queryRunner.addColumn(
        'user_mfa',
        new TableColumn({
          name: 'email',
          type: 'varchar',
          length: '255',
          isNullable: true,
        })
      )
      console.log('✅ Added column: email')
    }

    // 7. Ajouter 'webauthn_credentials' si elle n'existe pas
    const hasWebauthnCredentials = await queryRunner.hasColumn('user_mfa', 'webauthn_credentials')
    if (!hasWebauthnCredentials) {
      await queryRunner.addColumn(
        'user_mfa',
        new TableColumn({
          name: 'webauthn_credentials',
          type: 'jsonb',
          isNullable: true,
        })
      )
      console.log('✅ Added column: webauthn_credentials')
    }

    // 8. Ajouter 'metadata' si elle n'existe pas
    const hasMetadata = await queryRunner.hasColumn('user_mfa', 'metadata')
    if (!hasMetadata) {
      await queryRunner.addColumn(
        'user_mfa',
        new TableColumn({
          name: 'metadata',
          type: 'jsonb',
          isNullable: true,
        })
      )
      console.log('✅ Added column: metadata')
    }

    // 9. Ajouter 'last_used_at' si elle n'existe pas
    const hasLastUsedAt = await queryRunner.hasColumn('user_mfa', 'last_used_at')
    if (!hasLastUsedAt) {
      await queryRunner.addColumn(
        'user_mfa',
        new TableColumn({
          name: 'last_used_at',
          type: 'timestamp',
          isNullable: true,
        })
      )
      console.log('✅ Added column: last_used_at')
    }

    // 10. Ajouter 'verified_at' si elle n'existe pas
    const hasVerifiedAt = await queryRunner.hasColumn('user_mfa', 'verified_at')
    if (!hasVerifiedAt) {
      await queryRunner.addColumn(
        'user_mfa',
        new TableColumn({
          name: 'verified_at',
          type: 'timestamp',
          isNullable: true,
        })
      )
      console.log('✅ Added column: verified_at')
    }

    // Créer les index pour améliorer les performances
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_mfa_type" ON "user_mfa" ("type");
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_mfa_is_verified" ON "user_mfa" ("is_verified");
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_mfa_last_used_at" ON "user_mfa" ("last_used_at");
    `)

    console.log('✅ user_mfa table schema fixed successfully!')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️  Reverting user_mfa columns...')

    // Supprimer les index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_mfa_type"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_mfa_is_verified"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_mfa_last_used_at"`)

    // Supprimer les colonnes dans l'ordre inverse
    const hasVerifiedAt = await queryRunner.hasColumn('user_mfa', 'verified_at')
    if (hasVerifiedAt) {
      await queryRunner.dropColumn('user_mfa', 'verified_at')
    }

    const hasLastUsedAt = await queryRunner.hasColumn('user_mfa', 'last_used_at')
    if (hasLastUsedAt) {
      await queryRunner.dropColumn('user_mfa', 'last_used_at')
    }

    const hasMetadata = await queryRunner.hasColumn('user_mfa', 'metadata')
    if (hasMetadata) {
      await queryRunner.dropColumn('user_mfa', 'metadata')
    }

    const hasWebauthnCredentials = await queryRunner.hasColumn('user_mfa', 'webauthn_credentials')
    if (hasWebauthnCredentials) {
      await queryRunner.dropColumn('user_mfa', 'webauthn_credentials')
    }

    const hasEmail = await queryRunner.hasColumn('user_mfa', 'email')
    if (hasEmail) {
      await queryRunner.dropColumn('user_mfa', 'email')
    }

    const hasPhoneNumber = await queryRunner.hasColumn('user_mfa', 'phone_number')
    if (hasPhoneNumber) {
      await queryRunner.dropColumn('user_mfa', 'phone_number')
    }

    const hasSecret = await queryRunner.hasColumn('user_mfa', 'secret')
    const hasSecretKey = await queryRunner.hasColumn('user_mfa', 'secret_key')
    if (hasSecret && !hasSecretKey) {
      await queryRunner.renameColumn('user_mfa', 'secret', 'secret_key')
    }

    const hasIsVerified = await queryRunner.hasColumn('user_mfa', 'is_verified')
    if (hasIsVerified) {
      await queryRunner.dropColumn('user_mfa', 'is_verified')
    }

    const hasType = await queryRunner.hasColumn('user_mfa', 'type')
    if (hasType) {
      await queryRunner.dropColumn('user_mfa', 'type')
    }

    console.log('✅ Reverted user_mfa columns')
  }
}
