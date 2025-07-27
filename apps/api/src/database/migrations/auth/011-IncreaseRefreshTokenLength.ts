import { MigrationInterface, QueryRunner } from "typeorm"

export class IncreaseRefreshTokenLength1737919904000 implements MigrationInterface {
    name = 'IncreaseRefreshTokenLength1737919904000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Augmenter la taille du champ refreshToken de 500 à 2000 caractères
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "refreshToken" TYPE character varying(2000)`)
        
        console.log('✅ Longueur du champ refreshToken augmentée à 2000 caractères')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revenir à la taille précédente
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "refreshToken" TYPE character varying(500)`)
        
        console.log('✅ Longueur du champ refreshToken réduite à 500 caractères')
    }
}