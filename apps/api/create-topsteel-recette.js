require('dotenv').config({ path: '../../.env.local' });
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function createTopSteelRecette() {
  console.log('🚀 CRÉATION AUTOMATIQUE DE TOPSTEEL RECETTE VIA SCRIPT\n');

  // Clients pour les différentes bases
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  const authClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_auth',
  });

  try {
    await adminClient.connect();
    await authClient.connect();

    console.log('📊 ÉTAPE 1: Création de la base de données tenant');
    
    // 1. Créer la base de données
    const dbName = 'erp_topsteel_tsr';
    await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await adminClient.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Base créée: ${dbName}`);

    console.log('\n🏢 ÉTAPE 2: Création de la société dans AUTH');
    
    // 2. Créer la société
    const societeId = uuidv4();
    const insertSociete = `
      INSERT INTO societes (
        id, nom, code, status, plan, max_users, max_sites, 
        email, telephone, adresse, database_name, configuration
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, nom, code, database_name;
    `;
    
    const societeResult = await authClient.query(insertSociete, [
      societeId,
      'TopSteel Recette',
      'TSR',
      'ACTIVE',
      'PROFESSIONAL',
      10,
      3,
      'admin@topsteelrecette.com',
      '+33123456789',
      '123 Rue de Test, Paris 75001, France',
      dbName,
      JSON.stringify({
        ville: 'Paris',
        codePostal: '75001',
        pays: 'France',
        locale: 'fr',
        timezone: 'Europe/Paris',
        modules: ['clients', 'devis', 'projets', 'stocks']
      })
    ]);
    
    console.log('✅ Société créée:', societeResult.rows[0]);

    console.log('\n🏪 ÉTAPE 3: Création du site principal');
    
    // 3. Créer le site principal
    const siteId = uuidv4();
    const insertSite = `
      INSERT INTO sites (id, nom, code, societe_id, type, is_principal, actif, configuration) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nom, code;
    `;
    
    const siteResult = await authClient.query(insertSite, [
      siteId,
      'Site Principal TopSteel Recette',
      'TSR-MAIN',
      societeId,
      'PRODUCTION',
      true,
      true,
      JSON.stringify({
        description: 'Site principal TopSteel Recette',
        timezone: 'Europe/Paris',
        capacites: ['metallurgie', 'usinage', 'soudure']
      })
    ]);
    
    console.log('✅ Site créé:', siteResult.rows[0]);

    console.log('\n📦 ÉTAPE 4: Provisioning de la base tenant');
    
    // 4. Se connecter à la nouvelle base et la provisionner
    const tsrClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: dbName,
    });

    await tsrClient.connect();
    
    // Créer l'extension UUID
    await tsrClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Créer les tables métier
    const createTables = [
      `CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        name VARCHAR NOT NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE,
        email VARCHAR(255),
        telephone VARCHAR(50),
        adresse TEXT,
        ville VARCHAR(100),
        code_postal VARCHAR(10),
        pays VARCHAR(100) DEFAULT 'France',
        type_client VARCHAR(50) DEFAULT 'ENTREPRISE',
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS fournisseurs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE,
        email VARCHAR(255),
        telephone VARCHAR(50),
        adresse TEXT,
        ville VARCHAR(100),
        code_postal VARCHAR(10),
        pays VARCHAR(100) DEFAULT 'France',
        specialite VARCHAR(100),
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS materiaux (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom VARCHAR(255) NOT NULL,
        reference VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(100),
        famille VARCHAR(100),
        description TEXT,
        unite VARCHAR(20) DEFAULT 'kg',
        prix_unitaire DECIMAL(10,2),
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS stocks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        materiau_id UUID REFERENCES materiaux(id),
        quantite DECIMAL(10,3) DEFAULT 0,
        quantite_reservee DECIMAL(10,3) DEFAULT 0,
        seuil_minimum DECIMAL(10,3) DEFAULT 0,
        seuil_maximum DECIMAL(10,3),
        emplacement VARCHAR(255),
        cout_unitaire DECIMAL(10,2),
        derniere_entree TIMESTAMP,
        derniere_sortie TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS projets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom VARCHAR(255) NOT NULL,
        reference VARCHAR(100) UNIQUE NOT NULL,
        client_id UUID REFERENCES clients(id),
        description TEXT,
        statut VARCHAR(50) DEFAULT 'EN_COURS',
        date_debut DATE,
        date_fin_prevue DATE,
        date_fin_reelle DATE,
        budget_previsionnel DECIMAL(12,2),
        cout_reel DECIMAL(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of createTables) {
      await tsrClient.query(sql);
    }
    
    console.log('✅ Tables créées dans la base tenant');

    console.log('\n📊 ÉTAPE 5: Injection des données par défaut');
    
    // Insérer des données par défaut
    const insertClients = `
      INSERT INTO clients (nom, code, email, telephone, adresse, ville, code_postal, type_client) VALUES
      ('ACME Industrie', 'ACME001', 'contact@acme-industrie.fr', '01.23.45.67.89', '45 Avenue de l''Industrie', 'Lyon', '69000', 'ENTREPRISE'),
      ('Métallurgie Moderne', 'META001', 'info@meta-moderne.fr', '04.56.78.90.12', '12 Zone Industrielle Nord', 'Marseille', '13000', 'ENTREPRISE'),
      ('Construction Durable', 'CONST001', 'projet@construction-durable.fr', '02.34.56.78.90', '78 Boulevard des Bâtisseurs', 'Nantes', '44000', 'ENTREPRISE')
    `;
    
    const insertFournisseurs = `
      INSERT INTO fournisseurs (nom, code, email, telephone, adresse, ville, code_postal, specialite) VALUES
      ('Aciers de France', 'ACF001', 'vente@aciers-france.fr', '01.11.22.33.44', '123 Rue de la Métallurgie', 'Saint-Étienne', '42000', 'Aciers spéciaux'),
      ('Alliages Premium', 'ALL001', 'commercial@alliages-premium.fr', '03.22.33.44.55', '456 Zone Industrielle Est', 'Grenoble', '38000', 'Alliages légers'),
      ('Métaux Précieux Pro', 'MPP001', 'contact@metaux-precieux-pro.fr', '05.33.44.55.66', '789 Avenue des Métaux', 'Toulouse', '31000', 'Métaux précieux')
    `;
    
    const insertMateriaux = `
      INSERT INTO materiaux (nom, reference, type, famille, description, unite, prix_unitaire) VALUES
      ('Acier Inoxydable 316L', 'ACR-316L', 'Acier', 'Inoxydable', 'Acier inoxydable austénitique résistant à la corrosion', 'kg', 8.50),
      ('Aluminium 6061-T6', 'ALU-6061-T6', 'Aluminium', 'Alliage', 'Alliage d''aluminium traité thermiquement haute résistance', 'kg', 4.20),
      ('Cuivre C110', 'CUI-C110', 'Cuivre', 'Pur', 'Cuivre électrolytique haute conductivité', 'kg', 9.80),
      ('Laiton CuZn37', 'LAI-CZ37', 'Laiton', 'Alliage', 'Laiton pour usinage et découpage', 'kg', 6.50),
      ('Acier C45', 'ACR-C45', 'Acier', 'Carbone', 'Acier au carbone pour construction mécanique', 'kg', 1.85)
    `;
    
    const insertProjets = `
      INSERT INTO projets (nom, reference, client_id, description, statut, date_debut, date_fin_prevue, budget_previsionnel) VALUES
      ('Rénovation Ligne Production', 'PROJ-2025-001', (SELECT id FROM clients WHERE code = 'ACME001'), 'Modernisation complète de la ligne de production principale', 'EN_COURS', '2025-01-15', '2025-06-30', 75000.00),
      ('Fabrication Châssis Spéciaux', 'PROJ-2025-002', (SELECT id FROM clients WHERE code = 'META001'), 'Conception et fabrication de châssis métalliques sur mesure', 'PLANIFIE', '2025-02-01', '2025-04-15', 42000.00),
      ('Installation Système Manutention', 'PROJ-2025-003', (SELECT id FROM clients WHERE code = 'CONST001'), 'Installation d''un système de manutention automatisé', 'ETUDE', '2025-03-01', '2025-08-31', 120000.00)
    `;

    await tsrClient.query(insertClients);
    await tsrClient.query(insertFournisseurs);  
    await tsrClient.query(insertMateriaux);
    await tsrClient.query(insertProjets);
    
    console.log('✅ Données par défaut injectées:');
    console.log('   • 3 clients');
    console.log('   • 3 fournisseurs');
    console.log('   • 5 matériaux');
    console.log('   • 3 projets');

    // Créer quelques stocks
    const insertStocks = `
      INSERT INTO stocks (materiau_id, quantite, seuil_minimum, emplacement, cout_unitaire) 
      SELECT 
        id,
        (RANDOM() * 500 + 50)::DECIMAL(10,2),
        (RANDOM() * 50 + 10)::DECIMAL(10,2),
        'Zone-' || (RANDOM() * 10 + 1)::INT,
        prix_unitaire * (0.8 + RANDOM() * 0.4)
      FROM materiaux;
    `;
    
    await tsrClient.query(insertStocks);
    console.log('   • Stocks générés automatiquement');

    await tsrClient.end();

    console.log('\n🎉 TOPSTEEL RECETTE CRÉÉE AVEC SUCCÈS !');
    console.log(`📊 Société ID: ${societeId}`);
    console.log(`🏪 Site ID: ${siteId}`);
    console.log(`💾 Base de données: ${dbName}`);
    console.log('🌐 Code société: TSR');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await adminClient.end();
    await authClient.end();
  }
}

createTopSteelRecette();