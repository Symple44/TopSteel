import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateInitialTables1737178800000 implements MigrationInterface {
    name = 'CreateInitialTables1737178800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Extension UUID
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
        
        // Table users
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nom" character varying(255) NOT NULL,
                "prenom" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "role" character varying(50) NOT NULL DEFAULT 'OPERATEUR',
                "actif" boolean NOT NULL DEFAULT true,
                "acronyme" character varying(10),
                "dernier_login" TIMESTAMP,
                "version" integer NOT NULL DEFAULT 1,
                "refreshToken" character varying(500),
                "metadata" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "UQ_users_acronyme" UNIQUE ("acronyme"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `)
        
        // Table system_parameters
        await queryRunner.query(`
            CREATE TABLE "system_parameters" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "key" character varying(255) NOT NULL,
                "value" text NOT NULL,
                "description" text,
                "type" character varying(50) NOT NULL DEFAULT 'string',
                "category" character varying(100) NOT NULL DEFAULT 'general',
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_system_parameters_key" UNIQUE ("key"),
                CONSTRAINT "PK_system_parameters" PRIMARY KEY ("id")
            )
        `)
        
        // Table system_settings
        await queryRunner.query(`
            CREATE TABLE "system_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "key" character varying(255) NOT NULL,
                "value" text NOT NULL,
                "description" text,
                "type" character varying(50) NOT NULL DEFAULT 'string',
                "category" character varying(100) NOT NULL DEFAULT 'general',
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_system_settings_key" UNIQUE ("key"),
                CONSTRAINT "PK_system_settings" PRIMARY KEY ("id")
            )
        `)
        
        // Table clients
        await queryRunner.query(`
            CREATE TABLE "clients" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nom" character varying(255) NOT NULL,
                "prenom" character varying(255),
                "email" character varying(255),
                "telephone" character varying(20),
                "adresse" text,
                "ville" character varying(100),
                "code_postal" character varying(10),
                "pays" character varying(100) DEFAULT 'France',
                "entreprise" character varying(255),
                "siret" character varying(14),
                "numero_client" character varying(50),
                "actif" boolean NOT NULL DEFAULT true,
                "notes" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_clients_email" UNIQUE ("email"),
                CONSTRAINT "UQ_clients_numero_client" UNIQUE ("numero_client"),
                CONSTRAINT "PK_clients" PRIMARY KEY ("id")
            )
        `)
        
        // Table projets
        await queryRunner.query(`
            CREATE TABLE "projets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nom" character varying(255) NOT NULL,
                "description" text,
                "client_id" uuid NOT NULL,
                "statut" character varying(50) NOT NULL DEFAULT 'nouveau',
                "date_debut" TIMESTAMP,
                "date_fin_prevue" TIMESTAMP,
                "date_fin_reelle" TIMESTAMP,
                "budget_estime" decimal(10,2),
                "budget_reel" decimal(10,2),
                "priorite" character varying(20) DEFAULT 'moyenne',
                "notes" text,
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_projets" PRIMARY KEY ("id"),
                CONSTRAINT "FK_projets_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
            )
        `)
        
        // Table user_menu_preferences_admin
        await queryRunner.query(`
            CREATE TABLE "user_menu_preferences_admin" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "menuId" character varying(255) NOT NULL,
                "isVisible" boolean NOT NULL DEFAULT true,
                "order" integer NOT NULL DEFAULT 0,
                "customLabel" character varying(255),
                "version" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_user_menu_preferences_admin_userId" UNIQUE ("userId"),
                CONSTRAINT "PK_user_menu_preferences_admin" PRIMARY KEY ("id")
            )
        `)
        
        // Index sur user_menu_preferences_admin avec nom explicite
        await queryRunner.query(`
            CREATE INDEX "user_menu_preferences_admin_userId_unique" ON "user_menu_preferences_admin" ("userId")
        `)
        
        console.log('✅ Tables principales créées avec succès')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_menu_preferences_admin"`)
        await queryRunner.query(`DROP TABLE "projets"`)
        await queryRunner.query(`DROP TABLE "clients"`)
        await queryRunner.query(`DROP TABLE "system_settings"`)
        await queryRunner.query(`DROP TABLE "system_parameters"`)
        await queryRunner.query(`DROP TABLE "users"`)
        await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`)
        
        console.log('✅ Tables supprimées avec succès')
    }
}