import { type MigrationInterface, type QueryRunner, Table } from 'typeorm'

export class CreateTenantTables1737000003000 implements MigrationInterface {
  name = 'CreateTenantTables1737000003000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Activer l'extension UUID
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    // Tables métier supprimées pour optimiser le debug
    // Les tables suivantes ont été commentées:
    // - clients, fournisseurs, materiaux, stocks, produits, commandes

    /*
    // 1. Table clients
    await queryRunner.createTable(
      new Table({
        name: 'clients',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'societe_id',
            type: 'uuid',
          },
          {
            name: 'site_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['PARTICULIER', 'ENTREPRISE', 'COLLECTIVITE'],
            default: "'ENTREPRISE'",
          },
          {
            name: 'siret',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'adresse',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'code_postal',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'ville',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'pays',
            type: 'varchar',
            length: '100',
            default: "'France'",
          },
          {
            name: 'telephone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'contact_principal',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
        ],
      }),
      true
    )
    */

    // 2. Table fournisseurs - Commentée pour optimiser le debug
    /*
    await queryRunner.createTable(
      new Table({
        name: 'fournisseurs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'societe_id',
            type: 'uuid',
          },
          {
            name: 'site_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'shared_supplier_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Référence vers fournisseur partagé',
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['FABRICANT', 'DISTRIBUTEUR', 'GROSSISTE', 'IMPORTATEUR', 'AUTRE'],
            default: "'DISTRIBUTEUR'",
          },
          {
            name: 'siret',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'adresse',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'telephone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'contact_principal',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'conditions_paiement',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'delai_livraison',
            type: 'integer',
            isNullable: true,
            comment: 'Délai en jours',
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'evaluation',
            type: 'jsonb',
            default: "'{}'",
            comment: 'Note qualité, délais, service',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
        ],
      }),
      true
    )

    // 3. Table materiaux
    await queryRunner.createTable(
      new Table({
        name: 'materiaux',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'societe_id',
            type: 'uuid',
          },
          {
            name: 'site_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'shared_material_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Référence vers matériau partagé',
          },
          {
            name: 'fournisseur_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['ACIER', 'INOX', 'ALUMINIUM', 'CUIVRE', 'AUTRE'],
            default: "'ACIER'",
          },
          {
            name: 'forme',
            type: 'enum',
            enum: ['PLAQUE', 'TUBE', 'BARRE', 'PROFILE', 'TOLE', 'AUTRE'],
            default: "'PLAQUE'",
          },
          {
            name: 'dimensions',
            type: 'jsonb',
            default: "'{}'",
            comment: 'Longueur, largeur, épaisseur, diamètre',
          },
          {
            name: 'poids_unitaire',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
            comment: 'kg',
          },
          {
            name: 'prix_unitaire',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'unite',
            type: 'varchar',
            length: '20',
            default: "'kg'",
          },
          {
            name: 'stock_minimum',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'caracteristiques',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
        ],
      }),
      true
    )

    // 4. Table stocks
    await queryRunner.createTable(
      new Table({
        name: 'stocks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'societe_id',
            type: 'uuid',
          },
          {
            name: 'site_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'materiau_id',
            type: 'uuid',
          },
          {
            name: 'quantite',
            type: 'decimal',
            precision: 10,
            scale: 3,
            default: 0,
          },
          {
            name: 'quantite_reservee',
            type: 'decimal',
            precision: 10,
            scale: 3,
            default: 0,
          },
          {
            name: 'emplacement',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'date_derniere_entree',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'date_derniere_sortie',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'valeur_stock',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
        ],
      }),
      true
    )

    // 5. Table produits
    await queryRunner.createTable(
      new Table({
        name: 'produits',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'societe_id',
            type: 'uuid',
          },
          {
            name: 'site_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '100',
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
            length: '100',
            isNullable: true,
          },
          {
            name: 'prix_vente',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'cout_production',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'temps_fabrication',
            type: 'integer',
            isNullable: true,
            comment: 'Temps en minutes',
          },
          {
            name: 'specifications',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
        ],
      }),
      true
    )

    // 6. Table commandes
    await queryRunner.createTable(
      new Table({
        name: 'commandes',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'societe_id',
            type: 'uuid',
          },
          {
            name: 'site_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'client_id',
            type: 'uuid',
          },
          {
            name: 'numero',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'date_commande',
            type: 'date',
            default: 'CURRENT_DATE',
          },
          {
            name: 'date_livraison_prevue',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'statut',
            type: 'enum',
            enum: ['BROUILLON', 'CONFIRMEE', 'EN_PRODUCTION', 'PRETE', 'LIVREE', 'ANNULEE'],
            default: "'BROUILLON'",
          },
          {
            name: 'montant_ht',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'montant_tva',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'montant_ttc',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
        ],
      }),
      true
    )
    */

    // Index commentés car les tables métier ont été supprimées

    // Tables Query Builder
    await queryRunner.createTable(
      new Table({
        name: 'query_builders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'societe_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'base_table',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'configuration',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'createdById',
            type: 'uuid',
          },
          {
            name: 'isPublic',
            type: 'boolean',
            default: false,
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
      }),
      true
    )

    await queryRunner.createTable(
      new Table({
        name: 'query_builder_columns',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'query_builder_id',
            type: 'uuid',
          },
          {
            name: 'column_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'alias',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'table_alias',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'order_index',
            type: 'integer',
            default: 0,
          },
          {
            name: 'is_visible',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    await queryRunner.createTable(
      new Table({
        name: 'query_builder_joins',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'query_builder_id',
            type: 'uuid',
          },
          {
            name: 'join_type',
            type: 'enum',
            enum: ['INNER', 'LEFT', 'RIGHT', 'FULL'],
            default: "'LEFT'",
          },
          {
            name: 'table_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'table_alias',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'join_condition',
            type: 'text',
          },
          {
            name: 'order_index',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    await queryRunner.createTable(
      new Table({
        name: 'query_builder_calculated_fields',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'query_builder_id',
            type: 'uuid',
          },
          {
            name: 'field_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'expression',
            type: 'text',
          },
          {
            name: 'data_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    await queryRunner.createTable(
      new Table({
        name: 'query_builder_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'query_builder_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'permission_type',
            type: 'enum',
            enum: ['READ', 'WRITE', 'ADMIN'],
            default: "'READ'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Contraintes de clés étrangères commentées car les tables métier ont été supprimées
    /*
    await queryRunner.query(
      'ALTER TABLE materiaux ADD CONSTRAINT FK_materiaux_fournisseur_id FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL'
    )
    await queryRunner.query(
      'ALTER TABLE stocks ADD CONSTRAINT FK_stocks_materiau_id FOREIGN KEY (materiau_id) REFERENCES materiaux(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE commandes ADD CONSTRAINT FK_commandes_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT'
    )
    */

    await queryRunner.query(
      'CREATE INDEX IDX_query_builders_societe ON query_builders (societe_id)'
    )
    await queryRunner.query(
      'CREATE INDEX IDX_query_builder_columns_qb ON query_builder_columns (query_builder_id)'
    )
    await queryRunner.query(
      'CREATE INDEX IDX_query_builder_joins_qb ON query_builder_joins (query_builder_id)'
    )
    await queryRunner.query(
      'CREATE INDEX IDX_query_builder_calc_fields_qb ON query_builder_calculated_fields (query_builder_id)'
    )
    await queryRunner.query(
      'CREATE INDEX IDX_query_builder_permissions_qb ON query_builder_permissions (query_builder_id)'
    )

    await queryRunner.query(
      'ALTER TABLE query_builder_columns ADD CONSTRAINT FK_query_builder_columns_qb FOREIGN KEY (query_builder_id) REFERENCES query_builders(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE query_builder_joins ADD CONSTRAINT FK_query_builder_joins_qb FOREIGN KEY (query_builder_id) REFERENCES query_builders(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE query_builder_calculated_fields ADD CONSTRAINT FK_query_builder_calc_fields_qb FOREIGN KEY (query_builder_id) REFERENCES query_builders(id) ON DELETE CASCADE'
    )
    await queryRunner.query(
      'ALTER TABLE query_builder_permissions ADD CONSTRAINT FK_query_builder_permissions_qb FOREIGN KEY (query_builder_id) REFERENCES query_builders(id) ON DELETE CASCADE'
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les nouvelles tables dans l'ordre inverse
    await queryRunner.dropTable('query_builder_permissions')
    await queryRunner.dropTable('query_builder_calculated_fields')
    await queryRunner.dropTable('query_builder_joins')
    await queryRunner.dropTable('query_builder_columns')
    await queryRunner.dropTable('query_builders')

    // Tables métier commentées car supprimées pour optimiser le debug
    /*
    await queryRunner.dropTable('commandes')
    await queryRunner.dropTable('produits')
    await queryRunner.dropTable('stocks')
    await queryRunner.dropTable('materiaux')
    await queryRunner.dropTable('fournisseurs')
    await queryRunner.dropTable('clients')
    */
  }
}
