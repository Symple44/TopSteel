import { type MigrationInterface, type QueryRunner, Table } from 'typeorm'

export class CreatePartnersTables1740000001000 implements MigrationInterface {
  name = 'CreatePartnersTables1740000001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Pas d'ENUMs - on utilisera les tables parameters_system ou parameters_application pour stocker les valeurs possibles

    // 1. Table partner_groups
    await queryRunner.createTable(
      new Table({
        name: 'partner_groups',
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
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
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
            type: 'varchar',
            length: '50',
            default: "'TARIF'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'ACTIVE'",
          },
          {
            name: 'default_discount',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'max_discount',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'credit_limit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'payment_terms',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'int',
            default: 0,
          },
          {
            name: 'rules',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        indices: [
          { name: 'idx_partner_groups_societe', columnNames: ['societe_id'] },
          { name: 'idx_partner_groups_code', columnNames: ['code'] },
          { name: 'idx_partner_groups_type_status', columnNames: ['type', 'status'] },
        ],
      }),
      true
    )

    // 2. Table partners
    await queryRunner.createTable(
      new Table({
        name: 'partners',
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
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'denomination',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'denomination_commerciale',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'ACTIF'",
          },
          {
            name: 'group_id',
            type: 'uuid',
            isNullable: true,
          },
          // Identification
          {
            name: 'siret',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'numero_tva',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'code_ape',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          // Contact principal
          {
            name: 'contact_principal',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'telephone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'mobile',
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
            name: 'site_web',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // Adresse principale
          {
            name: 'adresse',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'adresse_complement',
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
          // Commercial
          {
            name: 'conditions_paiement',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'mode_paiement',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'plafond_credit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'taux_remise',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'representant_commercial',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // Fournisseur
          {
            name: 'delai_livraison',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'montant_mini_commande',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'fournisseur_prefere',
            type: 'boolean',
            default: false,
          },
          // Comptabilité
          {
            name: 'compte_comptable_client',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'compte_comptable_fournisseur',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          // Metadata
          {
            name: 'notes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'donnees_techniques',
            type: 'jsonb',
            isNullable: true,
          },
          // Audit
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['group_id'],
            referencedTableName: 'partner_groups',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          { name: 'idx_partners_societe', columnNames: ['societe_id'] },
          { name: 'idx_partners_code', columnNames: ['code'] },
          { name: 'idx_partners_type_status', columnNames: ['type', 'status'] },
          { name: 'idx_partners_group', columnNames: ['group_id'] },
          { name: 'idx_partners_email', columnNames: ['email'] },
          { name: 'idx_partners_siret', columnNames: ['siret'] },
        ],
      }),
      true
    )

    // 3. Table partner_contacts
    await queryRunner.createTable(
      new Table({
        name: 'partner_contacts',
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
            name: 'partner_id',
            type: 'uuid',
          },
          {
            name: 'partner_site_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'civilite',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'prenom',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'fonction',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'service',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'ACTIF'",
          },
          {
            name: 'telephone_direct',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'telephone_mobile',
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
            name: 'fax',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'is_principal',
            type: 'boolean',
            default: false,
          },
          {
            name: 'prefere_email',
            type: 'boolean',
            default: true,
          },
          {
            name: 'prefere_sms',
            type: 'boolean',
            default: false,
          },
          {
            name: 'accepte_marketing',
            type: 'boolean',
            default: false,
          },
          {
            name: 'horaires_disponibilite',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'jours_absence',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'date_naissance',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'historique_interactions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['partner_id'],
            referencedTableName: 'partners',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          { name: 'idx_partner_contacts_societe', columnNames: ['societe_id'] },
          { name: 'idx_partner_contacts_partner', columnNames: ['partner_id'] },
          { name: 'idx_partner_contacts_role', columnNames: ['role'] },
          { name: 'idx_partner_contacts_principal', columnNames: ['partner_id', 'is_principal'] },
        ],
      }),
      true
    )

    // 4. Table partner_sites
    await queryRunner.createTable(
      new Table({
        name: 'partner_sites',
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
            name: 'partner_id',
            type: 'uuid',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'nom',
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
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'ACTIF'",
          },
          {
            name: 'is_principal',
            type: 'boolean',
            default: false,
          },
          {
            name: 'accepte_livraisons',
            type: 'boolean',
            default: true,
          },
          {
            name: 'accepte_enlevements',
            type: 'boolean',
            default: true,
          },
          // Localisation
          {
            name: 'adresse',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'adresse_complement',
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
            isNullable: true,
          },
          {
            name: 'region',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
          },
          // Contact
          {
            name: 'responsable',
            type: 'varchar',
            length: '255',
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
          // Capacités
          {
            name: 'surface_m2',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'capacite_stockage_tonnes',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'hauteur_max_m',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'poids_max_tonnes',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'accessibilite',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'type_vehicule_max',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          // Équipements
          {
            name: 'has_quai_chargement',
            type: 'boolean',
            default: false,
          },
          {
            name: 'has_chariot',
            type: 'boolean',
            default: false,
          },
          {
            name: 'has_pont_roulant',
            type: 'boolean',
            default: false,
          },
          {
            name: 'has_grue',
            type: 'boolean',
            default: false,
          },
          // Informations complémentaires
          {
            name: 'horaires',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'instructions_livraison',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'consignes_securite',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'documents_requis',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'date_ouverture',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'date_fermeture',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['partner_id'],
            referencedTableName: 'partners',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          { name: 'idx_partner_sites_societe', columnNames: ['societe_id'] },
          { name: 'idx_partner_sites_partner', columnNames: ['partner_id'] },
          { name: 'idx_partner_sites_code', columnNames: ['partner_id', 'code'] },
          { name: 'idx_partner_sites_type', columnNames: ['type'] },
          { name: 'idx_partner_sites_principal', columnNames: ['partner_id', 'is_principal'] },
        ],
      }),
      true
    )

    // 5. Table partner_addresses
    await queryRunner.createTable(
      new Table({
        name: 'partner_addresses',
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
            name: 'partner_id',
            type: 'uuid',
          },
          {
            name: 'partner_site_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'libelle',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'ACTIVE'",
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'ligne1',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'ligne2',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'ligne3',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'code_postal',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'ville',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'region',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'pays',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'code_pays',
            type: 'varchar',
            length: '3',
            isNullable: true,
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'contact_nom',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'contact_telephone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'contact_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'instructions_acces',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'date_debut',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'date_fin',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['partner_id'],
            referencedTableName: 'partners',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['partner_site_id'],
            referencedTableName: 'partner_sites',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          { name: 'idx_partner_addresses_societe', columnNames: ['societe_id'] },
          { name: 'idx_partner_addresses_partner', columnNames: ['partner_id'] },
          { name: 'idx_partner_addresses_type', columnNames: ['type'] },
          { name: 'idx_partner_addresses_default', columnNames: ['partner_id', 'type', 'is_default'] },
        ],
      }),
      true
    )

    // Mise à jour des contraintes FK pour partner_contacts -> partner_sites
    await queryRunner.query(`
      ALTER TABLE partner_contacts 
      ADD CONSTRAINT fk_partner_contacts_partner_site 
      FOREIGN KEY (partner_site_id) REFERENCES partner_sites(id) 
      ON DELETE SET NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse (FK d'abord)
    await queryRunner.dropTable('partner_addresses')
    await queryRunner.dropTable('partner_sites')
    await queryRunner.dropTable('partner_contacts')
    await queryRunner.dropTable('partners')
    await queryRunner.dropTable('partner_groups')
  }
}