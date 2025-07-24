import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm'

export class CreateSharedTables1737000002000 implements MigrationInterface {
  name = 'CreateSharedTables1737000002000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Activer l'extension UUID
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    // 1. Table shared_materials
    await queryRunner.createTable(
      new Table({
        name: 'shared_materials',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['ACIER', 'INOX', 'ALUMINIUM', 'CUIVRE', 'LAITON', 'BRONZE', 'ZINC', 'PLASTIQUE', 'COMPOSITE', 'AUTRE']
          },
          {
            name: 'forme',
            type: 'enum',
            enum: ['PLAQUE', 'TUBE', 'BARRE', 'PROFILE', 'TOLE', 'FIL', 'BOBINE', 'AUTRE']
          },
          {
            name: 'caracteristiques',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'normes',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'dimensions_standards',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'composition_chimique',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'traitements',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'applications',
            type: 'text',
            isArray: true,
            isNullable: true
          },
          {
            name: 'donnees_commerciales',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'fournisseurs_reference',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'tags',
            type: 'text',
            isArray: true,
            isNullable: true
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'version',
            type: 'integer',
            default: 1
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'updated_by_id',
            type: 'uuid',
            isNullable: true
          }
        ]
      }),
      true
    )

    // 2. Table shared_suppliers
    await queryRunner.createTable(
      new Table({
        name: 'shared_suppliers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true
          },
          {
            name: 'raison_sociale',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'nom_commercial',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['FABRICANT', 'DISTRIBUTEUR', 'GROSSISTE', 'IMPORTATEUR', 'TRANSFORMATEUR', 'AUTRE']
          },
          {
            name: 'categories',
            type: 'enum',
            enum: ['MATERIAUX', 'OUTILLAGE', 'CONSOMMABLES', 'SERVICES', 'TRANSPORT', 'SOUS_TRAITANCE', 'AUTRE'],
            isArray: true
          },
          {
            name: 'siret',
            type: 'varchar',
            length: '20',
            isNullable: true
          },
          {
            name: 'numero_tva',
            type: 'varchar',
            length: '20',
            isNullable: true
          },
          {
            name: 'rcs_pays',
            type: 'varchar',
            length: '20',
            isNullable: true
          },
          {
            name: 'forme_juridique',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'capital_social',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true
          },
          {
            name: 'coordonnees',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'contacts',
            type: 'jsonb',
            default: "'[]'"
          },
          {
            name: 'donnees_commerciales',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'specialites',
            type: 'text',
            isArray: true,
            isNullable: true
          },
          {
            name: 'catalogue_produits',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'zones_livraison',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'certifications',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'evaluation',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'tags',
            type: 'text',
            isArray: true,
            isNullable: true
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'version',
            type: 'integer',
            default: 1
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'updated_by_id',
            type: 'uuid',
            isNullable: true
          }
        ]
      }),
      true
    )

    // 3. Table shared_processes
    await queryRunner.createTable(
      new Table({
        name: 'shared_processes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['DECOUPE', 'PLIAGE', 'SOUDAGE', 'USINAGE', 'PERCAGE', 'ASSEMBLAGE', 'TRAITEMENT', 'FINITION', 'CONTROLE', 'AUTRE']
          },
          {
            name: 'complexite',
            type: 'enum',
            enum: ['SIMPLE', 'MOYEN', 'COMPLEXE', 'EXPERT'],
            default: "'MOYEN'"
          },
          {
            name: 'etapes',
            type: 'jsonb',
            default: "'[]'"
          },
          {
            name: 'equipements',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'parametres_standards',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'materiaux_compatibles',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'normes',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'securite',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'performances',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'documentation',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'applications',
            type: 'text',
            isArray: true,
            isNullable: true
          },
          {
            name: 'exemples_production',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'tags',
            type: 'text',
            isArray: true,
            isNullable: true
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'version',
            type: 'integer',
            default: 1
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'updated_by_id',
            type: 'uuid',
            isNullable: true
          }
        ]
      }),
      true
    )

    // 4. Table shared_quality_standards
    await queryRunner.createTable(
      new Table({
        name: 'shared_quality_standards',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true
          },
          {
            name: 'nom',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['ISO', 'EN', 'NF', 'DIN', 'ASTM', 'INTERNE', 'CLIENT', 'AUTRE']
          },
          {
            name: 'domaines',
            type: 'enum',
            enum: ['DIMENSIONNEL', 'ASPECT', 'MECANIQUE', 'CHIMIQUE', 'FONCTIONNEL', 'ENVIRONNEMENTAL', 'SECURITE'],
            isArray: true
          },
          {
            name: 'version',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'date_publication',
            type: 'date',
            isNullable: true
          },
          {
            name: 'date_application',
            type: 'date',
            isNullable: true
          },
          {
            name: 'criteres',
            type: 'jsonb',
            default: "'[]'"
          },
          {
            name: 'methodes_controle',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'echantillonnage',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'defauts',
            type: 'jsonb',
            default: "'[]'"
          },
          {
            name: 'references',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'applications',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'certifications',
            type: 'text',
            isArray: true,
            isNullable: true
          },
          {
            name: 'revisions',
            type: 'jsonb',
            default: "'[]'"
          },
          {
            name: 'tags',
            type: 'text',
            isArray: true,
            isNullable: true
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'version_number',
            type: 'integer',
            default: 1
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'updated_by_id',
            type: 'uuid',
            isNullable: true
          }
        ]
      }),
      true
    )

    // 5. Table system_parameters
    await queryRunner.createTable(
      new Table({
        name: 'system_parameters',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isUnique: true
          },
          {
            name: 'value',
            type: 'text',
            isNullable: true
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'],
            default: "'STRING'"
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'is_editable',
            type: 'boolean',
            default: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )

    // 6. Table system_settings
    await queryRunner.createTable(
      new Table({
        name: 'system_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'module',
            type: 'varchar',
            length: '50'
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'value',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
            default: "'config'"
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )

    // 7. Table menu_items
    await queryRunner.createTable(
      new Table({
        name: 'menu_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'title',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'route',
            type: 'varchar',
            length: '200',
            isNullable: true
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'order_index',
            type: 'integer',
            default: 0
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true
          },
          {
            name: 'module',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )

    // 8. Table menu_configurations
    await queryRunner.createTable(
      new Table({
        name: 'menu_configurations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'config',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )

    // 9. Table menu_item_permissions
    await queryRunner.createTable(
      new Table({
        name: 'menu_item_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'menu_item_id',
            type: 'uuid'
          },
          {
            name: 'permission_required',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )

    // 10. Table menu_item_roles
    await queryRunner.createTable(
      new Table({
        name: 'menu_item_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'menu_item_id',
            type: 'uuid'
          },
          {
            name: 'role_required',
            type: 'varchar',
            length: '50'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )

    // 11. Table notification_templates
    await queryRunner.createTable(
      new Table({
        name: 'notification_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
            default: "'IN_APP'"
          },
          {
            name: 'subject_template',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'body_template',
            type: 'text'
          },
          {
            name: 'variables',
            type: 'jsonb',
            default: "'[]'"
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )

    // 12. Table notification_rules
    await queryRunner.createTable(
      new Table({
        name: 'notification_rules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '50'
          },
          {
            name: 'conditions',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'template_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'target_roles',
            type: 'jsonb',
            default: "'[]'"
          },
          {
            name: 'target_users',
            type: 'jsonb',
            default: "'[]'"
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    )

    // Créer les index pour optimiser les performances
    await queryRunner.query('CREATE INDEX IDX_shared_materials_code ON shared_materials (code)')
    await queryRunner.query('CREATE INDEX IDX_shared_materials_type ON shared_materials (type)')
    await queryRunner.query('CREATE INDEX IDX_shared_materials_type_forme ON shared_materials (type, forme)')
    await queryRunner.query('CREATE INDEX IDX_shared_suppliers_code ON shared_suppliers (code)')
    await queryRunner.query('CREATE INDEX IDX_shared_suppliers_type ON shared_suppliers (type)')
    await queryRunner.query('CREATE INDEX IDX_shared_suppliers_siret ON shared_suppliers (siret)')
    await queryRunner.query('CREATE INDEX IDX_shared_processes_code ON shared_processes (code)')
    await queryRunner.query('CREATE INDEX IDX_shared_processes_type ON shared_processes (type)')
    await queryRunner.query('CREATE INDEX IDX_shared_processes_complexite ON shared_processes (complexite)')
    await queryRunner.query('CREATE INDEX IDX_shared_quality_code ON shared_quality_standards (code)')
    await queryRunner.query('CREATE INDEX IDX_shared_quality_type ON shared_quality_standards (type)')
    
    // Index pour les nouvelles tables
    await queryRunner.query('CREATE UNIQUE INDEX IDX_system_parameters_key ON system_parameters (key)')
    await queryRunner.query('CREATE UNIQUE INDEX IDX_system_settings_module_key ON system_settings (module, key)')
    await queryRunner.query('CREATE INDEX IDX_menu_items_parent ON menu_items (parent_id)')
    await queryRunner.query('CREATE INDEX IDX_menu_items_order ON menu_items (order_index)')
    await queryRunner.query('CREATE INDEX IDX_menu_item_permissions_menu ON menu_item_permissions (menu_item_id)')
    await queryRunner.query('CREATE INDEX IDX_menu_item_roles_menu ON menu_item_roles (menu_item_id)')
    await queryRunner.query('CREATE INDEX IDX_notification_templates_type ON notification_templates (type)')
    await queryRunner.query('CREATE INDEX IDX_notification_rules_event ON notification_rules (event_type)')

    // Contraintes de clés étrangères
    await queryRunner.query('ALTER TABLE menu_items ADD CONSTRAINT FK_menu_items_parent FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE')
    await queryRunner.query('ALTER TABLE menu_item_permissions ADD CONSTRAINT FK_menu_item_permissions_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE')
    await queryRunner.query('ALTER TABLE menu_item_roles ADD CONSTRAINT FK_menu_item_roles_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE')
    await queryRunner.query('ALTER TABLE notification_rules ADD CONSTRAINT FK_notification_rules_template FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notification_rules')
    await queryRunner.dropTable('notification_templates')
    await queryRunner.dropTable('menu_item_roles')
    await queryRunner.dropTable('menu_item_permissions')
    await queryRunner.dropTable('menu_configurations')
    await queryRunner.dropTable('menu_items')
    await queryRunner.dropTable('system_settings')
    await queryRunner.dropTable('system_parameters')
    await queryRunner.dropTable('shared_quality_standards')
    await queryRunner.dropTable('shared_processes')
    await queryRunner.dropTable('shared_suppliers')
    await queryRunner.dropTable('shared_materials')
  }
}