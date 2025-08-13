import type { MigrationInterface, QueryRunner } from 'typeorm'

export class InsertDefaultLicenses1736367000000 implements MigrationInterface {
  name = 'InsertDefaultLicenses1736367000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Récupérer toutes les sociétés existantes qui n'ont pas de licence
    const societesWithoutLicense = await queryRunner.query(`
      SELECT s.id, s.code, s.nom, s.status
      FROM societes s
      LEFT JOIN societe_licenses sl ON sl."societeId" = s.id
      WHERE sl.id IS NULL 
        AND s.status IN ('ACTIVE', 'TRIAL')
    `)

    // Pour chaque société sans licence, créer une licence d'essai
    for (const societe of societesWithoutLicense) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 jours d'essai

      await queryRunner.query(
        `
        INSERT INTO societe_licenses (
          id,
          "societeId",
          type,
          status,
          "maxUsers",
          "currentUsers",
          "maxSites",
          "currentSites",
          "maxStorageGB",
          "currentStorageGB",
          "allowConcurrentSessions",
          features,
          "validFrom",
          "expiresAt",
          notes,
          "createdAt",
          "updatedAt"
        ) VALUES (
          uuid_generate_v4(),
          $1,
          'BASIC',
          'ACTIVE',
          5,
          0,
          1,
          0,
          10,
          0,
          true,
          '{"marketplace": false, "advancedReporting": false, "apiAccess": false}'::jsonb,
          NOW(),
          $2,
          $3,
          NOW(),
          NOW()
        )
      `,
        [
          societe.id,
          expiresAt.toISOString(),
          `Licence d'essai créée automatiquement pour ${societe.nom} (migration)`,
        ]
      )
    }

    if (societesWithoutLicense.length === 0) {
    } else {
    }

    // Créer une procédure stockée pour auto-créer des licences d'essai pour les nouvelles sociétés
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION create_trial_license_for_new_societe()
      RETURNS TRIGGER AS $$
      DECLARE
        config_allow_without BOOLEAN;
        config_auto_create BOOLEAN;
      BEGIN
        -- Lire la configuration (par défaut: permettre et créer automatiquement)
        config_allow_without := COALESCE(
          current_setting('app.license_allow_without', true)::BOOLEAN, 
          true
        );
        config_auto_create := COALESCE(
          current_setting('app.license_auto_create_trial', true)::BOOLEAN,
          true
        );

        -- Si la configuration permet la création automatique
        IF config_auto_create AND NEW.status IN ('ACTIVE', 'TRIAL') THEN
          -- Vérifier qu'aucune licence n'existe déjà
          IF NOT EXISTS (
            SELECT 1 FROM societe_licenses WHERE "societeId" = NEW.id
          ) THEN
            -- Créer une licence d'essai
            INSERT INTO societe_licenses (
              id,
              "societeId",
              type,
              status,
              "maxUsers",
              "currentUsers",
              "maxSites",
              "currentSites",
              "maxStorageGB",
              "currentStorageGB",
              "allowConcurrentSessions",
              features,
              "validFrom",
              "expiresAt",
              notes,
              "createdAt",
              "updatedAt"
            ) VALUES (
              uuid_generate_v4(),
              NEW.id,
              'BASIC',
              'ACTIVE',
              5,
              0,
              1,
              0,
              10,
              0,
              true,
              '{"marketplace": false, "advancedReporting": false, "apiAccess": false}'::jsonb,
              NOW(),
              NOW() + INTERVAL '30 days',
              'Licence d''essai créée automatiquement (trigger)',
              NOW(),
              NOW()
            );
            
            RAISE NOTICE 'Licence d''essai créée pour la société %', NEW.nom;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Créer le trigger pour les nouvelles sociétés
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_create_trial_license ON societes;
      
      CREATE TRIGGER trigger_create_trial_license
      AFTER INSERT ON societes
      FOR EACH ROW
      EXECUTE FUNCTION create_trial_license_for_new_societe();
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer le trigger et la fonction
    await queryRunner.query('DROP TRIGGER IF EXISTS trigger_create_trial_license ON societes')
    await queryRunner.query('DROP FUNCTION IF EXISTS create_trial_license_for_new_societe()')

    // Optionnel : supprimer les licences d'essai créées par cette migration
    // (identifiables par le texte dans notes)
    await queryRunner.query(`
      DELETE FROM societe_licenses 
      WHERE notes LIKE '%migration%' 
         OR notes LIKE '%trigger%'
    `)
  }
}
