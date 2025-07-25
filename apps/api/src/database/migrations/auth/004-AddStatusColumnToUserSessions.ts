import { MigrationInterface, QueryRunner } from "typeorm"

export class AddStatusColumnToUserSessions1721852100000 implements MigrationInterface {
    name = 'AddStatusColumnToUserSessions1721852100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la colonne status si elle n'existe pas
        const hasStatusColumn = await queryRunner.hasColumn("user_sessions", "status")
        if (!hasStatusColumn) {
            await queryRunner.query(`
                ALTER TABLE "user_sessions" 
                ADD COLUMN "status" varchar(50) DEFAULT 'active'
            `)
            
            // Créer l'index sur la colonne status
            await queryRunner.query(`
                CREATE INDEX "IDX_user_sessions_status" ON "user_sessions" ("status")
            `)
        }

        // Mettre à jour les sessions existantes sans status
        // Considérer toutes les sessions existantes comme actives par défaut
        await queryRunner.query(`
            UPDATE "user_sessions" 
            SET "status" = 'active' 
            WHERE "status" IS NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer l'index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_sessions_status"`)
        
        // Supprimer la colonne status
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN IF EXISTS "status"`)
    }
}