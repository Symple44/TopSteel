import { MigrationInterface, QueryRunner } from "typeorm"

export class UpdateUserSettingsTable1737182000000 implements MigrationInterface {
    name = 'UpdateUserSettingsTable1737182000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Sauvegarder les données existantes si la table a des données
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_settings_backup" AS 
            SELECT * FROM "user_settings"
        `)

        // Supprimer l'ancienne table user_settings
        await queryRunner.query(`DROP TABLE IF EXISTS "user_settings" CASCADE`)
        
        // Créer la nouvelle table user_settings avec la structure correcte
        await queryRunner.query(`
            CREATE TABLE "user_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "profile" jsonb,
                "company" jsonb,
                "preferences" jsonb NOT NULL DEFAULT '{
                    "language": "fr",
                    "timezone": "Europe/Paris",
                    "theme": "vibrant",
                    "notifications": {
                        "email": true,
                        "push": true,
                        "sms": false,
                        "emailTypes": {
                            "newMessages": true,
                            "systemAlerts": true,
                            "taskReminders": false,
                            "weeklyReports": true,
                            "securityAlerts": true,
                            "maintenanceNotice": false
                        },
                        "pushTypes": {
                            "enabled": true,
                            "sound": true,
                            "urgent": true,
                            "normal": false,
                            "quiet": true
                        },
                        "quietHours": {
                            "enabled": true,
                            "start": "22:00",
                            "end": "07:00"
                        }
                    },
                    "appearance": {
                        "theme": "vibrant",
                        "language": "fr",
                        "fontSize": "medium",
                        "sidebarWidth": "normal",
                        "density": "comfortable",
                        "accentColor": "blue",
                        "contentWidth": "compact"
                    }
                }'::jsonb,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_settings" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_user_settings_userId" UNIQUE ("userId")
            )
        `)

        // Ajouter la contrainte de clé étrangère
        await queryRunner.query(`
            ALTER TABLE "user_settings" 
            ADD CONSTRAINT "FK_user_settings_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `)

        // Créer l'index pour optimiser les requêtes
        await queryRunner.query(`
            CREATE INDEX "IDX_user_settings_userId" ON "user_settings" ("userId")
        `)

        console.log('✅ Table user_settings mise à jour avec la nouvelle structure')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer la nouvelle table
        await queryRunner.query(`DROP TABLE IF EXISTS "user_settings" CASCADE`)
        
        // Restaurer l'ancienne structure
        await queryRunner.query(`
            CREATE TABLE "user_settings" (
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

        // Restaurer la contrainte FK
        await queryRunner.query(`
            ALTER TABLE "user_settings" 
            ADD CONSTRAINT "FK_user_settings_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `)

        // Restaurer les données de backup si elles existent
        await queryRunner.query(`
            INSERT INTO "user_settings" 
            SELECT * FROM "user_settings_backup" 
            WHERE EXISTS (SELECT 1 FROM "user_settings_backup")
        `)

        // Supprimer la table de backup
        await queryRunner.query(`DROP TABLE IF EXISTS "user_settings_backup"`)

        console.log('✅ Ancienne structure de user_settings restaurée')
    }
}