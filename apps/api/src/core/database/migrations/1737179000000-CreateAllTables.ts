import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateAllTables1737179000000 implements MigrationInterface {
  name = 'CreateAllTables1737179000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extension UUID (si pas déjà créée)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    // ===== TABLES AUTH =====

    // Table modules
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "modules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "code" character varying(100) NOT NULL,
                "description" text,
                "icon" character varying(255),
                "order" integer NOT NULL DEFAULT 0,
                "active" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_modules_code" UNIQUE ("code"),
                CONSTRAINT "PK_modules" PRIMARY KEY ("id")
            )
        `)

    // Table permissions
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "code" character varying(100) NOT NULL,
                "description" text,
                "module_id" uuid,
                "active" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_permissions_code" UNIQUE ("code"),
                CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
            )
        `)

    // Table roles
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "code" character varying(100) NOT NULL,
                "description" text,
                "level" integer NOT NULL DEFAULT 1,
                "active" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_roles_code" UNIQUE ("code"),
                CONSTRAINT "PK_roles" PRIMARY KEY ("id")
            )
        `)

    // Table groups
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "groups" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "code" character varying(100) NOT NULL,
                "description" text,
                "active" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_groups_code" UNIQUE ("code"),
                CONSTRAINT "PK_groups" PRIMARY KEY ("id")
            )
        `)

    // Table role_permissions
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "role_permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                "granted" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_role_permissions" UNIQUE ("role_id", "permission_id"),
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id")
            )
        `)

    // Table user_roles
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "role_id" uuid NOT NULL,
                "granted_by" uuid,
                "granted_at" TIMESTAMP NOT NULL DEFAULT now(),
                "expires_at" TIMESTAMP,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_user_roles" UNIQUE ("user_id", "role_id"),
                CONSTRAINT "PK_user_roles" PRIMARY KEY ("id")
            )
        `)

    // Table user_groups
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_groups" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "group_id" uuid NOT NULL,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_user_groups" UNIQUE ("user_id", "group_id"),
                CONSTRAINT "PK_user_groups" PRIMARY KEY ("id")
            )
        `)

    // ===== TABLES BUSINESS =====

    // Table fournisseurs
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "fournisseurs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nom" character varying(255) NOT NULL,
                "code" character varying(100),
                "email" character varying(255),
                "telephone" character varying(20),
                "adresse" text,
                "ville" character varying(100),
                "code_postal" character varying(10),
                "pays" character varying(100) DEFAULT 'France',
                "siret" character varying(14),
                "tva" character varying(20),
                "notes" text,
                "actif" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_fournisseurs_code" UNIQUE ("code"),
                CONSTRAINT "PK_fournisseurs" PRIMARY KEY ("id")
            )
        `)

    // Table materiaux
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "materiaux" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nom" character varying(255) NOT NULL,
                "code" character varying(100),
                "type" character varying(100),
                "description" text,
                "densite" decimal(10,4),
                "prix_unitaire" decimal(10,2),
                "unite" character varying(50) DEFAULT 'kg',
                "fournisseur_id" uuid,
                "actif" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_materiaux_code" UNIQUE ("code"),
                CONSTRAINT "PK_materiaux" PRIMARY KEY ("id")
            )
        `)

    // Table produits
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "produits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nom" character varying(255) NOT NULL,
                "code" character varying(100),
                "description" text,
                "type" character varying(100),
                "materiau_id" uuid,
                "dimensions" text,
                "poids" decimal(10,4),
                "prix_unitaire" decimal(10,2),
                "stock_min" integer DEFAULT 0,
                "stock_max" integer DEFAULT 0,
                "actif" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_produits_code" UNIQUE ("code"),
                CONSTRAINT "PK_produits" PRIMARY KEY ("id")
            )
        `)

    // Table stocks
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "stocks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "produit_id" uuid NOT NULL,
                "quantite" integer NOT NULL DEFAULT 0,
                "quantite_reservee" integer NOT NULL DEFAULT 0,
                "quantite_disponible" integer NOT NULL DEFAULT 0,
                "cout_unitaire" decimal(10,2),
                "emplacement" character varying(255),
                "lot" character varying(100),
                "date_entree" TIMESTAMP,
                "date_peremption" TIMESTAMP,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_stocks" PRIMARY KEY ("id")
            )
        `)

    // Table chutes
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chutes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "materiau_id" uuid NOT NULL,
                "longueur" decimal(10,2),
                "largeur" decimal(10,2),
                "epaisseur" decimal(10,2),
                "poids" decimal(10,4),
                "origine" character varying(255),
                "utilisable" boolean NOT NULL DEFAULT true,
                "emplacement" character varying(255),
                "notes" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_chutes" PRIMARY KEY ("id")
            )
        `)

    // Table machines
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "machines" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nom" character varying(255) NOT NULL,
                "code" character varying(100),
                "type" character varying(100),
                "marque" character varying(255),
                "modele" character varying(255),
                "numero_serie" character varying(255),
                "date_achat" TIMESTAMP,
                "date_mise_service" TIMESTAMP,
                "statut" character varying(50) DEFAULT 'operationnelle',
                "notes" text,
                "actif" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_machines_code" UNIQUE ("code"),
                CONSTRAINT "PK_machines" PRIMARY KEY ("id")
            )
        `)

    // Table operations
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "operations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nom" character varying(255) NOT NULL,
                "code" character varying(100),
                "description" text,
                "type" character varying(100),
                "machine_id" uuid,
                "duree_estimee" integer,
                "cout_horaire" decimal(10,2),
                "complexite" character varying(50) DEFAULT 'moyenne',
                "actif" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_operations_code" UNIQUE ("code"),
                CONSTRAINT "PK_operations" PRIMARY KEY ("id")
            )
        `)

    // Table devis
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "devis" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "numero" character varying(100) NOT NULL,
                "client_id" uuid NOT NULL,
                "projet_id" uuid,
                "date_devis" TIMESTAMP NOT NULL DEFAULT now(),
                "date_validite" TIMESTAMP,
                "statut" character varying(50) NOT NULL DEFAULT 'brouillon',
                "montant_ht" decimal(10,2) NOT NULL DEFAULT 0,
                "montant_tva" decimal(10,2) NOT NULL DEFAULT 0,
                "montant_ttc" decimal(10,2) NOT NULL DEFAULT 0,
                "taux_tva" decimal(5,2) NOT NULL DEFAULT 20,
                "notes" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_devis_numero" UNIQUE ("numero"),
                CONSTRAINT "PK_devis" PRIMARY KEY ("id")
            )
        `)

    // Table ligne_devis
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ligne_devis" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "devis_id" uuid NOT NULL,
                "produit_id" uuid,
                "description" text NOT NULL,
                "quantite" integer NOT NULL DEFAULT 1,
                "prix_unitaire" decimal(10,2) NOT NULL,
                "prix_total" decimal(10,2) NOT NULL,
                "ordre" integer NOT NULL DEFAULT 0,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_ligne_devis" PRIMARY KEY ("id")
            )
        `)

    // Table commandes
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "commandes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "numero" character varying(100) NOT NULL,
                "devis_id" uuid,
                "client_id" uuid NOT NULL,
                "date_commande" TIMESTAMP NOT NULL DEFAULT now(),
                "date_livraison_prevue" TIMESTAMP,
                "date_livraison_reelle" TIMESTAMP,
                "statut" character varying(50) NOT NULL DEFAULT 'nouvelle',
                "priorite" character varying(50) DEFAULT 'normale',
                "montant_ht" decimal(10,2) NOT NULL DEFAULT 0,
                "montant_tva" decimal(10,2) NOT NULL DEFAULT 0,
                "montant_ttc" decimal(10,2) NOT NULL DEFAULT 0,
                "notes" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_commandes_numero" UNIQUE ("numero"),
                CONSTRAINT "PK_commandes" PRIMARY KEY ("id")
            )
        `)

    // Table ordre_fabrication
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ordre_fabrication" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "numero" character varying(100) NOT NULL,
                "commande_id" uuid,
                "produit_id" uuid NOT NULL,
                "quantite_demandee" integer NOT NULL,
                "quantite_produite" integer NOT NULL DEFAULT 0,
                "date_debut_prevue" TIMESTAMP,
                "date_fin_prevue" TIMESTAMP,
                "date_debut_reelle" TIMESTAMP,
                "date_fin_reelle" TIMESTAMP,
                "statut" character varying(50) NOT NULL DEFAULT 'planifie',
                "priorite" character varying(50) DEFAULT 'normale',
                "notes" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_ordre_fabrication_numero" UNIQUE ("numero"),
                CONSTRAINT "PK_ordre_fabrication" PRIMARY KEY ("id")
            )
        `)

    // Table production
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "production" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "ordre_fabrication_id" uuid NOT NULL,
                "operation_id" uuid NOT NULL,
                "machine_id" uuid,
                "operateur_id" uuid,
                "date_debut" TIMESTAMP,
                "date_fin" TIMESTAMP,
                "quantite_produite" integer NOT NULL DEFAULT 0,
                "quantite_defectueuse" integer NOT NULL DEFAULT 0,
                "temps_preparation" integer,
                "temps_production" integer,
                "statut" character varying(50) NOT NULL DEFAULT 'planifie',
                "notes" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_production" PRIMARY KEY ("id")
            )
        `)

    // Table planning
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "planning" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "titre" character varying(255) NOT NULL,
                "description" text,
                "type" character varying(100),
                "date_debut" TIMESTAMP NOT NULL,
                "date_fin" TIMESTAMP NOT NULL,
                "statut" character varying(50) NOT NULL DEFAULT 'planifie',
                "priorite" character varying(50) DEFAULT 'normale',
                "assignee_id" uuid,
                "machine_id" uuid,
                "production_id" uuid,
                "notes" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_planning" PRIMARY KEY ("id")
            )
        `)

    // Table qualite
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "qualite" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "production_id" uuid NOT NULL,
                "controleur_id" uuid NOT NULL,
                "date_controle" TIMESTAMP NOT NULL DEFAULT now(),
                "type_controle" character varying(100),
                "resultat" character varying(50) NOT NULL,
                "notes" text,
                "mesures" text,
                "non_conformites" text,
                "actions_correctives" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_qualite" PRIMARY KEY ("id")
            )
        `)

    // Table maintenance
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "maintenance" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "machine_id" uuid NOT NULL,
                "type" character varying(100) NOT NULL,
                "description" text,
                "date_prevue" TIMESTAMP,
                "date_realisee" TIMESTAMP,
                "duree" integer,
                "cout" decimal(10,2),
                "technicien_id" uuid,
                "statut" character varying(50) NOT NULL DEFAULT 'planifie',
                "notes" text,
                "pieces_changees" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_maintenance" PRIMARY KEY ("id")
            )
        `)

    // Table facturation
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "facturation" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "numero" character varying(100) NOT NULL,
                "commande_id" uuid,
                "client_id" uuid NOT NULL,
                "date_facture" TIMESTAMP NOT NULL DEFAULT now(),
                "date_echeance" TIMESTAMP,
                "date_paiement" TIMESTAMP,
                "montant_ht" decimal(10,2) NOT NULL DEFAULT 0,
                "montant_tva" decimal(10,2) NOT NULL DEFAULT 0,
                "montant_ttc" decimal(10,2) NOT NULL DEFAULT 0,
                "statut" character varying(50) NOT NULL DEFAULT 'emise',
                "mode_paiement" character varying(100),
                "notes" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_facturation_numero" UNIQUE ("numero"),
                CONSTRAINT "PK_facturation" PRIMARY KEY ("id")
            )
        `)

    // Table documents
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "documents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nom" character varying(255) NOT NULL,
                "type" character varying(100),
                "taille" integer,
                "mime_type" character varying(255),
                "chemin" text NOT NULL,
                "url" text,
                "description" text,
                "entity_type" character varying(100),
                "entity_id" uuid,
                "uploaded_by" uuid,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_documents" PRIMARY KEY ("id")
            )
        `)

    // Table tracabilite
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "tracabilite" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "entity_type" character varying(100) NOT NULL,
                "entity_id" uuid NOT NULL,
                "action" character varying(100) NOT NULL,
                "utilisateur_id" uuid,
                "date_action" TIMESTAMP NOT NULL DEFAULT now(),
                "donnees_avant" text,
                "donnees_apres" text,
                "ip_address" character varying(45),
                "user_agent" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_tracabilite" PRIMARY KEY ("id")
            )
        `)

    // ===== TABLES NOTIFICATIONS =====

    // Table notification_templates
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notification_templates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "code" character varying(100) NOT NULL,
                "type" character varying(100) NOT NULL,
                "subject" character varying(255),
                "body" text,
                "variables" text,
                "active" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_notification_templates_code" UNIQUE ("code"),
                CONSTRAINT "PK_notification_templates" PRIMARY KEY ("id")
            )
        `)

    // Table notification_rules
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notification_rules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "event_type" character varying(100) NOT NULL,
                "conditions" text,
                "template_id" uuid,
                "recipients" text,
                "active" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_notification_rules" PRIMARY KEY ("id")
            )
        `)

    // Table notification_events
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notification_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying(100) NOT NULL,
                "entity_type" character varying(100),
                "entity_id" uuid,
                "data" text,
                "processed" boolean NOT NULL DEFAULT false,
                "processed_at" TIMESTAMP,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_notification_events" PRIMARY KEY ("id")
            )
        `)

    // Table notification_rule_executions
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notification_rule_executions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "rule_id" uuid NOT NULL,
                "event_id" uuid NOT NULL,
                "success" boolean NOT NULL DEFAULT true,
                "error_message" text,
                "sent_at" TIMESTAMP,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_notification_rule_executions" PRIMARY KEY ("id")
            )
        `)

    // Table notification_settings
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notification_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "type" character varying(100) NOT NULL,
                "enabled" boolean NOT NULL DEFAULT true,
                "channel" character varying(100) NOT NULL DEFAULT 'email',
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_notification_settings" UNIQUE ("user_id", "type", "channel"),
                CONSTRAINT "PK_notification_settings" PRIMARY KEY ("id")
            )
        `)

    // Table notifications (table principale)
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying(100) NOT NULL,
                "title" character varying(255) NOT NULL,
                "message" text NOT NULL,
                "data" text,
                "entity_type" character varying(100),
                "entity_id" uuid,
                "sender_id" uuid,
                "read" boolean NOT NULL DEFAULT false,
                "sent_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
            )
        `)

    // Table notification_reads
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notification_reads" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "notification_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "read_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_notification_reads" UNIQUE ("notification_id", "user_id"),
                CONSTRAINT "PK_notification_reads" PRIMARY KEY ("id")
            )
        `)

    // ===== TABLES MENU =====

    // Table menu_configurations
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "menu_configurations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "type" character varying(100) NOT NULL,
                "active" boolean NOT NULL DEFAULT true,
                "default_config" boolean NOT NULL DEFAULT false,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_menu_configurations" PRIMARY KEY ("id")
            )
        `)

    // Table menu_items
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "menu_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "configuration_id" uuid NOT NULL,
                "parent_id" uuid,
                "name" character varying(255) NOT NULL,
                "path" character varying(255),
                "icon" character varying(255),
                "order" integer NOT NULL DEFAULT 0,
                "visible" boolean NOT NULL DEFAULT true,
                "active" boolean NOT NULL DEFAULT true,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_menu_items" PRIMARY KEY ("id")
            )
        `)

    // Table menu_item_permissions
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "menu_item_permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "menu_item_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_menu_item_permissions" UNIQUE ("menu_item_id", "permission_id"),
                CONSTRAINT "PK_menu_item_permissions" PRIMARY KEY ("id")
            )
        `)

    // Table menu_item_roles
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "menu_item_roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "menu_item_id" uuid NOT NULL,
                "role_id" uuid NOT NULL,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_menu_item_roles" UNIQUE ("menu_item_id", "role_id"),
                CONSTRAINT "PK_menu_item_roles" PRIMARY KEY ("id")
            )
        `)

    // Table user_menu_item_preferences
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_menu_item_preferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "menu_item_id" uuid NOT NULL,
                "visible" boolean NOT NULL DEFAULT true,
                "order" integer NOT NULL DEFAULT 0,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_user_menu_item_preferences" UNIQUE ("user_id", "menu_item_id"),
                CONSTRAINT "PK_user_menu_item_preferences" PRIMARY KEY ("id")
            )
        `)

    // Table user_menu_preferences (la table déjà existante)
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_menu_preferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "menu_id" character varying(255) NOT NULL,
                "is_visible" boolean NOT NULL DEFAULT true,
                "order" integer NOT NULL DEFAULT 0,
                "custom_label" character varying(255),
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_user_menu_preferences" UNIQUE ("user_id", "menu_id"),
                CONSTRAINT "PK_user_menu_preferences" PRIMARY KEY ("id")
            )
        `)

    // Table user_menu_preferences_old (pour backup)
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_menu_preferences_old" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "menu_id" character varying(255) NOT NULL,
                "is_visible" boolean NOT NULL DEFAULT true,
                "order" integer NOT NULL DEFAULT 0,
                "custom_label" character varying(255),
                "backup_date" TIMESTAMP NOT NULL DEFAULT now(),
                "reason" character varying(255),
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_user_menu_preferences_old" PRIMARY KEY ("id")
            )
        `)

    // ===== TABLES USER =====

    // Table user_settings
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "key" character varying(255) NOT NULL,
                "value" text,
                "type" character varying(50) NOT NULL DEFAULT 'string',
                "category" character varying(100) NOT NULL DEFAULT 'general',
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_user_settings" UNIQUE ("user_id", "key"),
                CONSTRAINT "PK_user_settings" PRIMARY KEY ("id")
            )
        `)

    // ===== TABLES SYSTÈME =====

    // Table typeorm_metadata (pour TypeORM)
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "typeorm_metadata" (
                "type" varchar NOT NULL,
                "database" varchar,
                "schema" varchar,
                "table" varchar,
                "name" varchar,
                "value" text
            )
        `)

    // ===== FOREIGN KEYS =====

    // Permissions -> Modules
    await queryRunner.query(`
            ALTER TABLE "permissions" 
            ADD CONSTRAINT "FK_permissions_module" 
            FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE SET NULL
        `)

    // Role Permissions
    await queryRunner.query(`
            ALTER TABLE "role_permissions" 
            ADD CONSTRAINT "FK_role_permissions_role" 
            FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "role_permissions" 
            ADD CONSTRAINT "FK_role_permissions_permission" 
            FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
        `)

    // User Roles
    await queryRunner.query(`
            ALTER TABLE "user_roles" 
            ADD CONSTRAINT "FK_user_roles_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "user_roles" 
            ADD CONSTRAINT "FK_user_roles_role" 
            FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
        `)

    // User Groups
    await queryRunner.query(`
            ALTER TABLE "user_groups" 
            ADD CONSTRAINT "FK_user_groups_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "user_groups" 
            ADD CONSTRAINT "FK_user_groups_group" 
            FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE
        `)

    // Business Foreign Keys
    await queryRunner.query(`
            ALTER TABLE "materiaux" 
            ADD CONSTRAINT "FK_materiaux_fournisseur" 
            FOREIGN KEY ("fournisseur_id") REFERENCES "fournisseurs"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "produits" 
            ADD CONSTRAINT "FK_produits_materiau" 
            FOREIGN KEY ("materiau_id") REFERENCES "materiaux"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "stocks" 
            ADD CONSTRAINT "FK_stocks_produit" 
            FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "chutes" 
            ADD CONSTRAINT "FK_chutes_materiau" 
            FOREIGN KEY ("materiau_id") REFERENCES "materiaux"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "operations" 
            ADD CONSTRAINT "FK_operations_machine" 
            FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "devis" 
            ADD CONSTRAINT "FK_devis_client" 
            FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "devis" 
            ADD CONSTRAINT "FK_devis_projet" 
            FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "ligne_devis" 
            ADD CONSTRAINT "FK_ligne_devis_devis" 
            FOREIGN KEY ("devis_id") REFERENCES "devis"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "ligne_devis" 
            ADD CONSTRAINT "FK_ligne_devis_produit" 
            FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "commandes" 
            ADD CONSTRAINT "FK_commandes_devis" 
            FOREIGN KEY ("devis_id") REFERENCES "devis"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "commandes" 
            ADD CONSTRAINT "FK_commandes_client" 
            FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "ordre_fabrication" 
            ADD CONSTRAINT "FK_ordre_fabrication_commande" 
            FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "ordre_fabrication" 
            ADD CONSTRAINT "FK_ordre_fabrication_produit" 
            FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "production" 
            ADD CONSTRAINT "FK_production_ordre_fabrication" 
            FOREIGN KEY ("ordre_fabrication_id") REFERENCES "ordre_fabrication"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "production" 
            ADD CONSTRAINT "FK_production_operation" 
            FOREIGN KEY ("operation_id") REFERENCES "operations"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "production" 
            ADD CONSTRAINT "FK_production_machine" 
            FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "production" 
            ADD CONSTRAINT "FK_production_operateur" 
            FOREIGN KEY ("operateur_id") REFERENCES "users"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "planning" 
            ADD CONSTRAINT "FK_planning_assignee" 
            FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "planning" 
            ADD CONSTRAINT "FK_planning_machine" 
            FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "planning" 
            ADD CONSTRAINT "FK_planning_production" 
            FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "qualite" 
            ADD CONSTRAINT "FK_qualite_production" 
            FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "qualite" 
            ADD CONSTRAINT "FK_qualite_controleur" 
            FOREIGN KEY ("controleur_id") REFERENCES "users"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "maintenance" 
            ADD CONSTRAINT "FK_maintenance_machine" 
            FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "maintenance" 
            ADD CONSTRAINT "FK_maintenance_technicien" 
            FOREIGN KEY ("technicien_id") REFERENCES "users"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "facturation" 
            ADD CONSTRAINT "FK_facturation_commande" 
            FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "facturation" 
            ADD CONSTRAINT "FK_facturation_client" 
            FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
        `)

    // Notification Foreign Keys
    await queryRunner.query(`
            ALTER TABLE "notifications" 
            ADD CONSTRAINT "FK_notifications_sender" 
            FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "notification_rules" 
            ADD CONSTRAINT "FK_notification_rules_template" 
            FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "notification_rule_executions" 
            ADD CONSTRAINT "FK_notification_rule_executions_rule" 
            FOREIGN KEY ("rule_id") REFERENCES "notification_rules"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "notification_rule_executions" 
            ADD CONSTRAINT "FK_notification_rule_executions_event" 
            FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "notification_settings" 
            ADD CONSTRAINT "FK_notification_settings_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "notification_reads" 
            ADD CONSTRAINT "FK_notification_reads_notification" 
            FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "notification_reads" 
            ADD CONSTRAINT "FK_notification_reads_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `)

    // Menu Foreign Keys
    await queryRunner.query(`
            ALTER TABLE "menu_items" 
            ADD CONSTRAINT "FK_menu_items_configuration" 
            FOREIGN KEY ("configuration_id") REFERENCES "menu_configurations"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "menu_items" 
            ADD CONSTRAINT "FK_menu_items_parent" 
            FOREIGN KEY ("parent_id") REFERENCES "menu_items"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "menu_item_permissions" 
            ADD CONSTRAINT "FK_menu_item_permissions_menu_item" 
            FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "menu_item_permissions" 
            ADD CONSTRAINT "FK_menu_item_permissions_permission" 
            FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "menu_item_roles" 
            ADD CONSTRAINT "FK_menu_item_roles_menu_item" 
            FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "menu_item_roles" 
            ADD CONSTRAINT "FK_menu_item_roles_role" 
            FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "user_menu_item_preferences" 
            ADD CONSTRAINT "FK_user_menu_item_preferences_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "user_menu_item_preferences" 
            ADD CONSTRAINT "FK_user_menu_item_preferences_menu_item" 
            FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "user_menu_preferences" 
            ADD CONSTRAINT "FK_user_menu_preferences_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `)

    await queryRunner.query(`
            ALTER TABLE "user_menu_preferences_old" 
            ADD CONSTRAINT "FK_user_menu_preferences_old_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `)

    // User Settings Foreign Keys
    await queryRunner.query(`
            ALTER TABLE "user_settings" 
            ADD CONSTRAINT "FK_user_settings_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse (à cause des contraintes)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_settings" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_menu_preferences_old" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_menu_preferences" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_menu_item_preferences" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "typeorm_metadata" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_item_roles" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_item_permissions" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_items" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_configurations" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_reads" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_settings" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_rule_executions" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_events" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_rules" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_templates" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "tracabilite" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "documents" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "facturation" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "maintenance" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "qualite" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "planning" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "production" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "ordre_fabrication" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "commandes" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "ligne_devis" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "devis" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "operations" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "machines" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "chutes" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "stocks" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "produits" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "materiaux" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "fournisseurs" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_groups" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "groups" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "modules" CASCADE`)
  }
}
