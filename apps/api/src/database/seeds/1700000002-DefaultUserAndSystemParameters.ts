// apps/api/src/database/seeds/1700000002-DefaultUserAndSystemParameters.ts
import * as bcrypt from 'bcrypt'
import type { MigrationInterface, QueryRunner } from 'typeorm'

export class DefaultUserAndSystemParameters1700000002 implements MigrationInterface {
  name = 'DefaultUserAndSystemParameters1700000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Créer l'utilisateur administrateur par défaut
    const hashedPassword = await bcrypt.hash('TopSteel2025!', 10)
    
    const userResult = await queryRunner.query(`
      INSERT INTO users (email, password, nom, prenom, role, actif, description) 
      VALUES ('admin@topsteel.com', $1, 'Admin', 'System', 'ADMIN', true, 'Utilisateur administrateur par défaut')
      RETURNING id
    `, [hashedPassword])

    const adminUserId = userResult[0].id

    // 2. Créer les paramètres utilisateur par défaut pour l'admin
    await queryRunner.query(`
      INSERT INTO user_settings (userId, profile, company, preferences) 
      VALUES ($1, $2, $3, $4)
    `, [
      adminUserId,
      JSON.stringify({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@topsteel.com',
        position: 'Administrateur Système',
        department: 'Administration'
      }),
      JSON.stringify({
        name: 'TopSteel Métallerie',
        address: '123 Rue de l\'Industrie',
        city: 'Lyon',
        postalCode: '69001',
        country: 'France'
      }),
      JSON.stringify({
        language: 'fr',
        timezone: 'Europe/Paris',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      })
    ])

    // 3. Insérer les paramètres système avec valeurs par défaut
    await queryRunner.query(`
      INSERT INTO system_parameters (key, value, type, category, description, defaultValue, isEditable) VALUES
      
      -- GÉNÉRAL
      ('COMPANY_NAME', 'TopSteel Métallerie', 'STRING', 'GENERAL', 'Nom de l''entreprise', 'TopSteel Métallerie', true),
      ('COMPANY_SIRET', '12345678901234', 'STRING', 'GENERAL', 'SIRET de l''entreprise', '', true),
      ('COMPANY_TVA', 'FR12345678901', 'STRING', 'GENERAL', 'Numéro de TVA intracommunautaire', '', true),
      ('COMPANY_ADDRESS', '123 Rue de l''Industrie, 69001 Lyon, France', 'STRING', 'GENERAL', 'Adresse de l''entreprise', '', true),
      ('COMPANY_PHONE', '+33 1 23 45 67 89', 'STRING', 'GENERAL', 'Téléphone de l''entreprise', '', true),
      ('COMPANY_EMAIL', 'contact@topsteel.com', 'STRING', 'GENERAL', 'Email de l''entreprise', '', true),
      ('DEFAULT_LANGUAGE', 'fr', 'STRING', 'GENERAL', 'Langue par défaut de l''application', 'fr', true),
      ('SUPPORTED_LANGUAGES', '["fr", "en", "es", "de", "it", "ar"]', 'JSON', 'GENERAL', 'Langues supportées', '["fr", "en"]', true),
      
      -- COMPTABILITÉ
      ('DEFAULT_TVA_RATE', '20', 'NUMBER', 'COMPTABILITE', 'Taux de TVA par défaut (%)', '20', true),
      ('INVOICE_PREFIX', 'FAC', 'STRING', 'COMPTABILITE', 'Préfixe des numéros de facture', 'FAC', true),
      ('QUOTE_PREFIX', 'DEV', 'STRING', 'COMPTABILITE', 'Préfixe des numéros de devis', 'DEV', true),
      ('INVOICE_VALIDITY_DAYS', '30', 'NUMBER', 'COMPTABILITE', 'Durée de validité des factures (jours)', '30', true),
      ('QUOTE_VALIDITY_DAYS', '30', 'NUMBER', 'COMPTABILITE', 'Durée de validité des devis (jours)', '30', true),
      
      -- PROJETS
      ('PROJECT_PREFIX', 'PRJ', 'STRING', 'PROJETS', 'Préfixe des références projet', 'PRJ', true),
      ('PROJECT_DEFAULT_MARGIN', '25', 'NUMBER', 'PROJETS', 'Marge par défaut des projets (%)', '25', true),
      ('PROJECT_STATUSES', '["NOUVEAU", "EN_COURS", "EN_ATTENTE", "TERMINE", "ANNULE"]', 'JSON', 'PROJETS', 'Statuts disponibles pour les projets', '["NOUVEAU", "EN_COURS", "TERMINE"]', true),
      
      -- PRODUCTION
      ('PRODUCTION_PREFIX', 'OF', 'STRING', 'PRODUCTION', 'Préfixe des ordres de fabrication', 'OF', true),
      ('PRODUCTION_STATUSES', '["PLANIFIE", "EN_COURS", "PAUSE", "TERMINE", "ANNULE"]', 'JSON', 'PRODUCTION', 'Statuts disponibles pour la production', '["PLANIFIE", "EN_COURS", "TERMINE"]', true),
      ('DEFAULT_WORK_HOURS_START', '08:00', 'STRING', 'PRODUCTION', 'Heure de début de travail par défaut', '08:00', true),
      ('DEFAULT_WORK_HOURS_END', '17:00', 'STRING', 'PRODUCTION', 'Heure de fin de travail par défaut', '17:00', true),
      
      -- ACHATS
      ('ORDER_PREFIX', 'CMD', 'STRING', 'ACHATS', 'Préfixe des numéros de commande', 'CMD', true),
      ('SUPPLIER_PAYMENT_TERMS', '["COMPTANT", "30_JOURS", "45_JOURS", "60_JOURS"]', 'JSON', 'ACHATS', 'Conditions de paiement fournisseurs', '["30_JOURS"]', true),
      
      -- STOCKS
      ('STOCK_ALERT_THRESHOLD', '10', 'NUMBER', 'STOCKS', 'Seuil d''alerte stock par défaut', '10', true),
      ('STOCK_UNITS', '["KG", "ML", "M2", "M3", "PIECE", "TONNE"]', 'JSON', 'STOCKS', 'Unités de mesure disponibles', '["PIECE", "KG", "ML"]', true),
      ('MATERIAL_CATEGORIES', '["PROFILE", "TOLE", "TUBE", "ROND", "PLAT", "CORNIERE", "AUTRE"]', 'JSON', 'STOCKS', 'Catégories de matériaux', '["PROFILE", "TOLE", "TUBE"]', true),
      
      -- NOTIFICATIONS
      ('EMAIL_NOTIFICATIONS_ENABLED', 'true', 'BOOLEAN', 'NOTIFICATION', 'Activer les notifications par email', 'true', true),
      ('SMS_NOTIFICATIONS_ENABLED', 'false', 'BOOLEAN', 'NOTIFICATION', 'Activer les notifications par SMS', 'false', true),
      ('NOTIFICATION_EMAIL_SENDER', 'noreply@topsteel.com', 'STRING', 'NOTIFICATION', 'Adresse email d''expédition', 'noreply@topsteel.com', true),
      
      -- SÉCURITÉ
      ('PASSWORD_MIN_LENGTH', '8', 'NUMBER', 'SECURITY', 'Longueur minimale des mots de passe', '8', true),
      ('PASSWORD_REQUIRE_UPPERCASE', 'true', 'BOOLEAN', 'SECURITY', 'Exiger une majuscule dans les mots de passe', 'true', true),
      ('PASSWORD_REQUIRE_LOWERCASE', 'true', 'BOOLEAN', 'SECURITY', 'Exiger une minuscule dans les mots de passe', 'true', true),
      ('PASSWORD_REQUIRE_NUMBERS', 'true', 'BOOLEAN', 'SECURITY', 'Exiger un chiffre dans les mots de passe', 'true', true),
      ('PASSWORD_REQUIRE_SPECIAL', 'true', 'BOOLEAN', 'SECURITY', 'Exiger un caractère spécial dans les mots de passe', 'true', true),
      ('SESSION_TIMEOUT_MINUTES', '480', 'NUMBER', 'SECURITY', 'Durée de session en minutes', '480', true),
      ('MAX_LOGIN_ATTEMPTS', '5', 'NUMBER', 'SECURITY', 'Nombre maximum de tentatives de connexion', '5', true),
      ('TWO_FACTOR_ENABLED', 'false', 'BOOLEAN', 'SECURITY', 'Activer l''authentification à deux facteurs', 'false', true),
      ('TWO_FACTOR_ENFORCE', 'OPTIONAL', 'STRING', 'SECURITY', 'Application du 2FA (OPTIONAL, ALL_USERS, ADMINS_ONLY)', 'OPTIONAL', true),
      ('GOOGLE_OAUTH_ENABLED', 'false', 'BOOLEAN', 'SECURITY', 'Activer l''authentification Google OAuth', 'false', true),
      ('GOOGLE_OAUTH_CLIENT_ID', '', 'STRING', 'SECURITY', 'Client ID Google OAuth', '', true),
      ('GOOGLE_OAUTH_CLIENT_SECRET', '', 'STRING', 'SECURITY', 'Client Secret Google OAuth', '', true),
      ('MICROSOFT_OAUTH_ENABLED', 'false', 'BOOLEAN', 'SECURITY', 'Activer l''authentification Microsoft OAuth', 'false', true),
      ('MICROSOFT_OAUTH_CLIENT_ID', '', 'STRING', 'SECURITY', 'Client ID Microsoft OAuth', '', true),
      ('MICROSOFT_OAUTH_CLIENT_SECRET', '', 'STRING', 'SECURITY', 'Client Secret Microsoft OAuth', '', true)
    `)

    // 4. Créer un client et un projet de démonstration
    await queryRunner.query(`
      INSERT INTO clients (type, nom, email, telephone, siret, adresse, actif) VALUES
      ('PROFESSIONNEL', 'Entreprise Démo SA', 'demo@exemple.fr', '0123456789', '12345678901234', 
       '{"rue": "123 Rue de la Démo", "code_postal": "69000", "ville": "Lyon", "pays": "France"}', true),
      ('PARTICULIER', 'Jean Démo', 'jean.demo@email.fr', '0612345678', NULL,
       '{"rue": "456 Avenue de Test", "code_postal": "69100", "ville": "Villeurbanne", "pays": "France"}', true)
    `)

    console.log('✅ Utilisateur par défaut créé:')
    console.log('   Email: admin@topsteel.com')
    console.log('   Mot de passe: TopSteel2025!')
    console.log('✅ Paramètres système initialisés')
    console.log('✅ Données de démonstration créées')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les données de test
    await queryRunner.query(`DELETE FROM clients WHERE nom IN ('Entreprise Démo SA', 'Jean Démo')`)
    await queryRunner.query(`DELETE FROM system_parameters`)
    await queryRunner.query(`DELETE FROM user_settings WHERE userId IN (SELECT id FROM users WHERE email = 'admin@topsteel.com')`)
    await queryRunner.query(`DELETE FROM users WHERE email = 'admin@topsteel.com'`)
  }
}