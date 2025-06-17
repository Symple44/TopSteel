// apps/api/src/database/seeds/1700000001-InitialData.ts
import * as bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialData1700000001 implements MigrationInterface {
    name = 'InitialData1700000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insérer les paramètres système
        await queryRunner.query(`
            INSERT INTO parametres (cle, valeur, type_valeur, description, categorie) VALUES
            ('COMPANY_NAME', 'TOPSTEEL', 'STRING', 'Nom de l''entreprise', 'GENERAL'),
            ('COMPANY_SIRET', '12345678901234', 'STRING', 'SIRET de l''entreprise', 'GENERAL'),
            ('COMPANY_TVA', 'FR12345678901', 'STRING', 'Numéro de TVA intracommunautaire', 'GENERAL'),
            ('DEFAULT_TVA_RATE', '20', 'NUMBER', 'Taux de TVA par défaut (%)', 'COMPTABILITE'),
            ('INVOICE_PREFIX', 'FAC', 'STRING', 'Préfixe des numéros de facture', 'COMPTABILITE'),
            ('QUOTE_PREFIX', 'DEV', 'STRING', 'Préfixe des numéros de devis', 'COMPTABILITE'),
            ('PROJECT_PREFIX', 'PRJ', 'STRING', 'Préfixe des références projet', 'PROJETS'),
            ('ORDER_PREFIX', 'CMD', 'STRING', 'Préfixe des numéros de commande', 'ACHATS'),
            ('PRODUCTION_PREFIX', 'OF', 'STRING', 'Préfixe des ordres de fabrication', 'PRODUCTION')
        `);

        // Créer l'utilisateur admin
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        await queryRunner.query(`
            INSERT INTO users (email, password, nom, prenom, role) VALUES
            ('admin@topsteel.fr', '${hashedPassword}', 'Admin', 'System', 'ADMIN')
        `);

        // Créer quelques clients de test
        await queryRunner.query(`
            INSERT INTO clients (type, nom, email, telephone, siret, adresse) VALUES
            ('PROFESSIONNEL', 'Entreprise TEST SA', 'contact@test.fr', '0123456789', '12345678901234', 
             '{"rue": "123 Rue du Test", "code_postal": "44000", "ville": "Nantes", "pays": "France"}'),
            ('PARTICULIER', 'Jean Dupont', 'jean.dupont@email.fr', '0612345678', NULL,
             '{"rue": "456 Avenue Example", "code_postal": "44100", "ville": "Nantes", "pays": "France"}')
        `);

        // Créer quelques produits de test
        await queryRunner.query(`
            INSERT INTO produits (reference, designation, categorie, unite, prix_achat, prix_vente, actif) VALUES
            ('PROF-001', 'Profilé acier 100x50x3', 'PROFILE', 'ML', 15.50, 23.25, true),
            ('TOLE-001', 'Tôle acier 2mm', 'TOLE', 'M2', 45.00, 67.50, true),
            ('TUBE-001', 'Tube carré 40x40x2', 'TUBE', 'ML', 8.20, 12.30, true)
        `);

        // Initialiser les stocks
        await queryRunner.query(`
            INSERT INTO stocks (produit_id, quantite_disponible, quantite_minimale, quantite_maximale, emplacement)
            SELECT id, 100, 20, 500, 'A1-' || SUBSTRING(reference FROM 1 FOR 4)
            FROM produits
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les données de test
        await queryRunner.query(`DELETE FROM stocks`);
        await queryRunner.query(`DELETE FROM produits`);
        await queryRunner.query(`DELETE FROM clients WHERE nom IN ('Entreprise TEST SA', 'Jean Dupont')`);
        await queryRunner.query(`DELETE FROM users WHERE email = 'admin@topsteel.fr'`);
        await queryRunner.query(`DELETE FROM parametres`);
    }
}