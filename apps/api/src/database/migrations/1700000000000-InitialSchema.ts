// apps/api/src/database/migrations/1700000000000-InitialSchema.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
    name = 'InitialSchema1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Extensions
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);

        // Types ENUM
        await queryRunner.query(`CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'COMMERCIAL', 'TECHNICIEN', 'COMPTABLE', 'VIEWER')`);
        await queryRunner.query(`CREATE TYPE "public"."client_type" AS ENUM('PARTICULIER', 'PROFESSIONNEL', 'COLLECTIVITE', 'ASSOCIATION')`);
        await queryRunner.query(`CREATE TYPE "public"."projet_statut" AS ENUM('BROUILLON', 'DEVIS', 'ACCEPTE', 'EN_COURS', 'TERMINE', 'FACTURE', 'CLOTURE', 'ANNULE')`);
        await queryRunner.query(`CREATE TYPE "public"."projet_type" AS ENUM('PORTAIL', 'CLOTURE', 'ESCALIER', 'GARDE_CORPS', 'RAMPE', 'VERRIERE', 'STRUCTURE', 'BARDAGE', 'COUVERTURE', 'CHARPENTE', 'AUTRE')`);
        await queryRunner.query(`CREATE TYPE "public"."priorite" AS ENUM('BASSE', 'NORMALE', 'HAUTE', 'URGENTE')`);
        await queryRunner.query(`CREATE TYPE "public"."devis_statut" AS ENUM('BROUILLON', 'ENVOYE', 'RELANCE', 'ACCEPTE', 'REFUSE', 'EXPIRE')`);
        await queryRunner.query(`CREATE TYPE "public"."categorie_produit" AS ENUM('PROFILE', 'TOLE', 'TUBE', 'ACCESSOIRE', 'QUINCAILLERIE', 'CONSOMMABLE', 'OUTILLAGE', 'AUTRE')`);
        await queryRunner.query(`CREATE TYPE "public"."unite_mesure" AS ENUM('PIECE', 'ML', 'M2', 'M3', 'KG', 'TONNE', 'LITRE', 'HEURE')`);
        await queryRunner.query(`CREATE TYPE "public"."type_mouvement" AS ENUM('ENTREE', 'SORTIE', 'RESERVATION', 'LIBERATION', 'AJUSTEMENT', 'INVENTAIRE', 'RETOUR')`);
        await queryRunner.query(`CREATE TYPE "public"."commande_statut" AS ENUM('BROUILLON', 'CONFIRMEE', 'EN_COURS', 'LIVREE_PARTIELLEMENT', 'LIVREE', 'FACTUREE', 'ANNULEE')`);
        await queryRunner.query(`CREATE TYPE "public"."production_statut" AS ENUM('PLANIFIE', 'EN_ATTENTE', 'EN_COURS', 'PAUSE', 'TERMINE', 'CONTROLE', 'VALIDE', 'ANNULE')`);
        await queryRunner.query(`CREATE TYPE "public"."operation_statut" AS ENUM('EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'BLOQUEE', 'ANNULEE')`);
        await queryRunner.query(`CREATE TYPE "public"."facture_statut" AS ENUM('BROUILLON', 'EMISE', 'ENVOYEE', 'PAYEE_PARTIELLEMENT', 'PAYEE', 'EN_RETARD', 'ANNULEE')`);
        await queryRunner.query(`CREATE TYPE "public"."mode_paiement" AS ENUM('ESPECES', 'CHEQUE', 'VIREMENT', 'CB', 'PRELEVEMENT', 'TRAITE', 'AUTRE')`);
        await queryRunner.query(`CREATE TYPE "public"."type_document" AS ENUM('PLAN', 'DEVIS', 'FACTURE', 'BON_COMMANDE', 'BON_LIVRAISON', 'PHOTO', 'RAPPORT', 'CERTIFICAT', 'AUTRE')`);
        await queryRunner.query(`CREATE TYPE "public"."type_notification" AS ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'PROJET_UPDATE', 'STOCK_ALERT', 'TASK_ASSIGNED', 'PAIEMENT_RECU', 'COMMANDE_LIVREE')`);
        await queryRunner.query(`CREATE TYPE "public"."type_valeur" AS ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE')`);

        // Table users
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "nom" character varying(100) NOT NULL,
                "prenom" character varying(100) NOT NULL,
                "role" "public"."user_role" NOT NULL DEFAULT 'VIEWER',
                "telephone" character varying(20),
                "is_active" boolean NOT NULL DEFAULT true,
                "refresh_token" text,
                "last_login" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        // Table clients
        await queryRunner.query(`
            CREATE TABLE "clients" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "public"."client_type" NOT NULL,
                "nom" character varying(255) NOT NULL,
                "email" character varying(255),
                "telephone" character varying(20),
                "siret" character varying(14),
                "tva_intra" character varying(20),
                "adresse" jsonb NOT NULL DEFAULT '{}',
                "contact_principal" jsonb,
                "notes" text,
                "credit_limite" numeric(10,2),
                "encours" numeric(10,2) NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_clients_siret" UNIQUE ("siret"),
                CONSTRAINT "PK_clients" PRIMARY KEY ("id")
            )
        `);

        // Continue with all other tables...
        // [Code continues with all table creations]

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_projets_client_id" ON "projets" ("client_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_projets_responsable_id" ON "projets" ("responsable_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_projets_statut" ON "projets" ("statut")`);
        // [Continue with all indexes]

        // Create functions
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Create triggers
        await queryRunner.query(`
            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
        // [Continue with all triggers]
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "parametres" CASCADE`);
        // [Continue dropping all tables]
        
        // Drop types
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."type_valeur"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."type_notification"`);
        // [Continue dropping all types]
        
        // Drop extensions
        await queryRunner.query(`DROP EXTENSION IF EXISTS "pg_trgm"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "pgcrypto"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }
}