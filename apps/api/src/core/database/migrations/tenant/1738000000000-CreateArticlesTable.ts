import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateArticlesTable1738000000000 implements MigrationInterface {
  name = 'CreateArticlesTable1738000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer les enums nécessaires
    await queryRunner.query(`
      CREATE TYPE IF NOT EXISTS "article_type" AS ENUM (
        'MATIERE_PREMIERE',
        'PRODUIT_FINI',
        'PRODUIT_SEMI_FINI',
        'FOURNITURE',
        'CONSOMMABLE',
        'SERVICE'
      )
    `)

    await queryRunner.query(`
      CREATE TYPE IF NOT EXISTS "article_status" AS ENUM (
        'ACTIF',
        'INACTIF',
        'OBSOLETE',
        'EN_COURS_CREATION'
      )
    `)

    await queryRunner.query(`
      CREATE TYPE IF NOT EXISTS "unite_stock" AS ENUM (
        'PCS', 'KG', 'G', 'M', 'CM', 'MM',
        'M2', 'M3', 'L', 'ML', 'T', 'H'
      )
    `)

    await queryRunner.query(`
      CREATE TYPE IF NOT EXISTS "methode_valorisation_stock" AS ENUM (
        'FIFO', 'LIFO', 'CMUP', 'PRIX_STANDARD'
      )
    `)

    // Créer la table articles
    await queryRunner.createTable(
      new Table({
        name: 'articles',
        columns: [
          // Colonnes de base (héritées de BaseAuditEntity)
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'deleted_by_id',
            type: 'uuid',
            isNullable: true,
          },
          
          // Colonnes tenant
          {
            name: 'societe_id',
            type: 'uuid',
          },
          {
            name: 'site_id',
            type: 'uuid',
            isNullable: true,
          },
          
          // Colonnes métier principales
          {
            name: 'reference',
            type: 'varchar',
            length: '30',
            isUnique: true,
          },
          {
            name: 'designation',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['MATIERE_PREMIERE', 'PRODUIT_FINI', 'PRODUIT_SEMI_FINI', 'FOURNITURE', 'CONSOMMABLE', 'SERVICE'],
            enumName: 'article_type',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIF', 'INACTIF', 'OBSOLETE', 'EN_COURS_CREATION'],
            enumName: 'article_status',
            default: "'ACTIF'",
          },
          
          // Classification
          {
            name: 'famille',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'sous_famille',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'marque',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'modele',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          
          // Unités et gestion stock
          {
            name: 'unite_stock',
            type: 'enum',
            enum: ['PCS', 'KG', 'G', 'M', 'CM', 'MM', 'M2', 'M3', 'L', 'ML', 'T', 'H'],
            enumName: 'unite_stock',
            default: "'PCS'",
          },
          {
            name: 'unite_achat',
            type: 'enum',
            enum: ['PCS', 'KG', 'G', 'M', 'CM', 'MM', 'M2', 'M3', 'L', 'ML', 'T', 'H'],
            enumName: 'unite_stock',
            isNullable: true,
          },
          {
            name: 'unite_vente',
            type: 'enum',
            enum: ['PCS', 'KG', 'G', 'M', 'CM', 'MM', 'M2', 'M3', 'L', 'ML', 'T', 'H'],
            enumName: 'unite_stock',
            isNullable: true,
          },
          {
            name: 'coefficient_achat',
            type: 'decimal',
            precision: 10,
            scale: 4,
            default: 1,
          },
          {
            name: 'coefficient_vente',
            type: 'decimal',
            precision: 10,
            scale: 4,
            default: 1,
          },
          
          // Gestion des stocks
          {
            name: 'gere_en_stock',
            type: 'boolean',
            default: true,
          },
          {
            name: 'stock_physique',
            type: 'decimal',
            precision: 15,
            scale: 4,
            default: 0,
          },
          {
            name: 'stock_reserve',
            type: 'decimal',
            precision: 15,
            scale: 4,
            default: 0,
          },
          {
            name: 'stock_disponible',
            type: 'decimal',
            precision: 15,
            scale: 4,
            default: 0,
          },
          {
            name: 'stock_mini',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'stock_maxi',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'stock_securite',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          
          // Valorisation
          {
            name: 'methode_valorisation',
            type: 'enum',
            enum: ['FIFO', 'LIFO', 'CMUP', 'PRIX_STANDARD'],
            enumName: 'methode_valorisation_stock',
            default: "'CMUP'",
          },
          {
            name: 'prix_achat_standard',
            type: 'decimal',
            precision: 12,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'prix_achat_moyen',
            type: 'decimal',
            precision: 12,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'prix_vente_ht',
            type: 'decimal',
            precision: 12,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'taux_tva',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'taux_marge',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          
          // Informations fournisseur principal
          {
            name: 'fournisseur_principal_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reference_fournisseur',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'delai_approvisionnement',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'quantite_mini_commande',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'quantite_multiple_commande',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          
          // Caractéristiques physiques
          {
            name: 'poids',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'volume',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'longueur',
            type: 'decimal',
            precision: 8,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'largeur',
            type: 'decimal',
            precision: 8,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'hauteur',
            type: 'decimal',
            precision: 8,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'couleur',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          
          // Informations comptables et fiscales
          {
            name: 'compte_comptable_achat',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'compte_comptable_vente',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'compte_comptable_stock',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'code_douanier',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'code_ean',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          
          // Métadonnées et informations techniques
          {
            name: 'caracteristiques_techniques',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'informations_logistiques',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'metadonnees',
            type: 'jsonb',
            default: "'{}'",
          },
          
          // Dates importantes
          {
            name: 'date_creation_fiche',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'date_derniere_modification',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'date_dernier_inventaire',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'date_dernier_mouvement',
            type: 'date',
            isNullable: true,
          },
        ],
        checks: [
          {
            name: 'CHK_articles_prix_positifs',
            expression: `(prix_achat_standard IS NULL OR prix_achat_standard >= 0) AND
                        (prix_achat_moyen IS NULL OR prix_achat_moyen >= 0) AND
                        (prix_vente_ht IS NULL OR prix_vente_ht >= 0)`
          },
          {
            name: 'CHK_articles_stock_coherent',
            expression: `(stock_mini IS NULL OR stock_maxi IS NULL OR stock_mini <= stock_maxi)`
          },
          {
            name: 'CHK_articles_taux_valides',
            expression: `(taux_tva IS NULL OR (taux_tva >= 0 AND taux_tva <= 100)) AND
                        (taux_marge IS NULL OR taux_marge >= 0)`
          }
        ],
      }),
      true
    )

    // Créer les index pour les performances
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_reference" ON "articles" ("reference")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_designation" ON "articles" ("designation")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_type" ON "articles" ("type")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_status" ON "articles" ("status")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_famille" ON "articles" ("famille")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_sous_famille" ON "articles" ("sous_famille")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_societe_id" ON "articles" ("societe_id")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_gere_en_stock" ON "articles" ("gere_en_stock")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_fournisseur_principal_id" ON "articles" ("fournisseur_principal_id")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_code_ean" ON "articles" ("code_ean")`
    )

    // Créer la table system_settings si elle n'existe pas
    const systemSettingsExists = await queryRunner.hasTable('system_settings')
    if (!systemSettingsExists) {
      await queryRunner.createTable(
        new Table({
          name: 'system_settings',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'category',
              type: 'varchar',
              length: '100',
            },
            {
              name: 'key',
              type: 'varchar',
              length: '100',
            },
            {
              name: 'value',
              type: 'jsonb',
              default: "'{}'",
            },
            {
              name: 'label',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'description',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'type',
              type: 'varchar',
              length: '50',
              default: "'string'",
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'metadata',
              type: 'jsonb',
              default: "'{}'",
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          uniques: [
            {
              name: 'UQ_system_settings_category_key',
              columnNames: ['category', 'key'],
            }
          ],
        }),
        true
      )

      await queryRunner.query(
        `CREATE INDEX "IDX_system_settings_category" ON "system_settings" ("category")`
      )
      await queryRunner.query(
        `CREATE INDEX "IDX_system_settings_key" ON "system_settings" ("key")`
      )
      await queryRunner.query(
        `CREATE INDEX "IDX_system_settings_active" ON "system_settings" ("is_active")`
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.dropIndex('articles', 'IDX_articles_code_ean')
    await queryRunner.dropIndex('articles', 'IDX_articles_fournisseur_principal_id')
    await queryRunner.dropIndex('articles', 'IDX_articles_gere_en_stock')
    await queryRunner.dropIndex('articles', 'IDX_articles_societe_id')
    await queryRunner.dropIndex('articles', 'IDX_articles_sous_famille')
    await queryRunner.dropIndex('articles', 'IDX_articles_famille')
    await queryRunner.dropIndex('articles', 'IDX_articles_status')
    await queryRunner.dropIndex('articles', 'IDX_articles_type')
    await queryRunner.dropIndex('articles', 'IDX_articles_designation')
    await queryRunner.dropIndex('articles', 'IDX_articles_reference')

    // Supprimer la table
    await queryRunner.dropTable('articles')

    // Supprimer les enums
    await queryRunner.query('DROP TYPE IF EXISTS "methode_valorisation_stock"')
    await queryRunner.query('DROP TYPE IF EXISTS "unite_stock"')
    await queryRunner.query('DROP TYPE IF EXISTS "article_status"')
    await queryRunner.query('DROP TYPE IF EXISTS "article_type"')

    // Supprimer system_settings si créée par cette migration
    const systemSettingsHasData = await queryRunner.query('SELECT COUNT(*) as count FROM system_settings')
    if (systemSettingsHasData[0].count === '0') {
      await queryRunner.dropIndex('system_settings', 'IDX_system_settings_active')
      await queryRunner.dropIndex('system_settings', 'IDX_system_settings_key')
      await queryRunner.dropIndex('system_settings', 'IDX_system_settings_category')
      await queryRunner.dropTable('system_settings')
    }
  }
}