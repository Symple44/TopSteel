import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateSocieteLicenseTables1736365620000 implements MigrationInterface {
  name = 'CreateSocieteLicenseTables1736365620000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table societe_licenses
    await queryRunner.createTable(
      new Table({
        name: 'societe_licenses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'societeId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'],
            default: "'BASIC'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'PENDING'],
            default: "'PENDING'",
          },
          {
            name: 'maxUsers',
            type: 'int',
            default: 5,
          },
          {
            name: 'currentUsers',
            type: 'int',
            default: 0,
          },
          {
            name: 'maxSites',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'currentSites',
            type: 'int',
            default: 0,
          },
          {
            name: 'maxStorageGB',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'currentStorageGB',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'allowConcurrentSessions',
            type: 'boolean',
            default: true,
          },
          {
            name: 'maxConcurrentSessions',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'features',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'restrictions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'validFrom',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastCheckAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastNotificationAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'violationCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'violationHistory',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'licenseKey',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'billing',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'FK_societe_license_societe',
            columnNames: ['societeId'],
            referencedTableName: 'societes',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    )

    // Créer les index pour les performances
    await queryRunner.createIndex(
      'societe_licenses',
      new TableIndex({
        name: 'IDX_societe_license_societe_status',
        columnNames: ['societeId', 'status'],
      })
    )

    await queryRunner.createIndex(
      'societe_licenses',
      new TableIndex({
        name: 'IDX_societe_license_expires',
        columnNames: ['expiresAt'],
      })
    )

    await queryRunner.createIndex(
      'societe_licenses',
      new TableIndex({
        name: 'IDX_societe_license_status',
        columnNames: ['status'],
      })
    )

    // Ajouter une colonne metadata dans user_sessions pour tracker les licences
    await queryRunner.query(`
      ALTER TABLE user_sessions 
      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb
    `)

    // Créer un index sur metadata pour les requêtes de licence
    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_user_session_metadata_societe',
        columnNames: ['metadata'],
        where: "metadata IS NOT NULL",
      })
    )

    // Créer une fonction pour vérifier automatiquement les licences expirées
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_license_expiration()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.expiresAt IS NOT NULL AND NEW.expiresAt < NOW() AND NEW.status = 'ACTIVE' THEN
          NEW.status = 'EXPIRED';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Créer un trigger pour vérifier l'expiration lors des mises à jour
    await queryRunner.query(`
      CREATE TRIGGER trigger_check_license_expiration
      BEFORE UPDATE ON societe_licenses
      FOR EACH ROW
      EXECUTE FUNCTION check_license_expiration();
    `)

    // Créer une vue pour le monitoring des licences
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_license_monitoring AS
      SELECT 
        sl.id,
        sl."societeId",
        s.nom as societe_nom,
        s.code as societe_code,
        sl.type,
        sl.status,
        sl."maxUsers",
        sl."currentUsers",
        ROUND((sl."currentUsers"::numeric / NULLIF(sl."maxUsers", 0)) * 100, 2) as user_utilization_percent,
        sl."maxSites",
        sl."currentSites",
        sl."maxStorageGB",
        sl."currentStorageGB",
        sl."allowConcurrentSessions",
        sl."maxConcurrentSessions",
        sl."expiresAt",
        CASE 
          WHEN sl."expiresAt" IS NOT NULL THEN 
            EXTRACT(DAY FROM sl."expiresAt" - NOW())
          ELSE NULL
        END as days_until_expiration,
        sl."lastCheckAt",
        sl."violationCount",
        sl."createdAt",
        sl."updatedAt"
      FROM societe_licenses sl
      JOIN societes s ON s.id = sl."societeId"
      WHERE sl.status IN ('ACTIVE', 'SUSPENDED');
    `)

    // Créer une table d'audit pour les changements de licence
    await queryRunner.createTable(
      new Table({
        name: 'license_audit_log',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'licenseId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'societeId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'previousState',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'newState',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'performedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            name: 'FK_license_audit_license',
            columnNames: ['licenseId'],
            referencedTableName: 'societe_licenses',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_license_audit_societe',
            columnNames: ['societeId'],
            referencedTableName: 'societes',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la vue de monitoring
    await queryRunner.query('DROP VIEW IF EXISTS v_license_monitoring')

    // Supprimer le trigger et la fonction
    await queryRunner.query('DROP TRIGGER IF EXISTS trigger_check_license_expiration ON societe_licenses')
    await queryRunner.query('DROP FUNCTION IF EXISTS check_license_expiration()')

    // Supprimer la table d'audit
    await queryRunner.dropTable('license_audit_log')

    // Supprimer les index de user_sessions
    await queryRunner.dropIndex('user_sessions', 'IDX_user_session_metadata_societe')

    // Supprimer la colonne metadata de user_sessions
    await queryRunner.query('ALTER TABLE user_sessions DROP COLUMN IF EXISTS metadata')

    // Supprimer les index de societe_licenses
    await queryRunner.dropIndex('societe_licenses', 'IDX_societe_license_status')
    await queryRunner.dropIndex('societe_licenses', 'IDX_societe_license_expires')
    await queryRunner.dropIndex('societe_licenses', 'IDX_societe_license_societe_status')

    // Supprimer la table societe_licenses
    await queryRunner.dropTable('societe_licenses')
  }
}