require('dotenv').config({ path: '../../.env.local' });
const { Client } = require('pg');

async function provisionTSR() {
  console.log('⚙️ PROVISIONING COMPLET DE LA BASE TSR\n');
  
  const tsrClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_tsr',
  });

  try {
    await tsrClient.connect();
    
    // Créer l'extension UUID
    await tsrClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ Extension UUID créée');
    
    // Créer la table migrations
    await tsrClient.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        name VARCHAR NOT NULL
      )
    `);
    console.log('✅ Table migrations créée');
    
    // Créer les tables métier principales
    const tables = [
      {
        name: 'clients',
        sql: `
          CREATE TABLE IF NOT EXISTS clients (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nom VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            telephone VARCHAR(50),
            adresse TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'fournisseurs',
        sql: `
          CREATE TABLE IF NOT EXISTS fournisseurs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nom VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            telephone VARCHAR(50),
            adresse TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'materiaux',
        sql: `
          CREATE TABLE IF NOT EXISTS materiaux (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nom VARCHAR(255) NOT NULL,
            reference VARCHAR(100) UNIQUE,
            type VARCHAR(100),
            description TEXT,
            unite VARCHAR(20) DEFAULT 'kg',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'stocks',
        sql: `
          CREATE TABLE IF NOT EXISTS stocks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            materiau_id UUID REFERENCES materiaux(id),
            quantite DECIMAL(10,2) DEFAULT 0,
            seuil_minimum DECIMAL(10,2) DEFAULT 0,
            emplacement VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
    ];
    
    for (const table of tables) {
      await tsrClient.query(table.sql);
      console.log(`✅ Table ${table.name} créée`);
    }
    
    // Insérer quelques données par défaut
    console.log('\n📦 INSERTION DES DONNÉES PAR DÉFAUT:');
    
    // Données clients
    await tsrClient.query(`
      INSERT INTO clients (nom, email, telephone, adresse) VALUES
      ('Client Test 1', 'client1@test.com', '+33123456789', '123 Rue Test'),
      ('Client Test 2', 'client2@test.com', '+33987654321', '456 Avenue Test')
      ON CONFLICT DO NOTHING
    `);
    console.log('   • 2 clients de test insérés');
    
    // Données matériaux
    await tsrClient.query(`
      INSERT INTO materiaux (nom, reference, type, description, unite) VALUES
      ('Acier inoxydable 304', 'ACR-304', 'Acier', 'Acier inoxydable qualité alimentaire', 'kg'),
      ('Aluminium 6061', 'ALU-6061', 'Aluminium', 'Alliage aluminium haute résistance', 'kg'),
      ('Cuivre C101', 'CUI-C101', 'Cuivre', 'Cuivre pur pour conductivité électrique', 'kg')
      ON CONFLICT (reference) DO NOTHING
    `);
    console.log('   • 3 matériaux de base insérés');
    
    // Données fournisseurs
    await tsrClient.query(`
      INSERT INTO fournisseurs (nom, email, telephone, adresse) VALUES
      ('Fournisseur Acier SA', 'contact@acier.com', '+33144556677', '789 Zone Industrielle'),
      ('Métaux & Co', 'info@metaux.com', '+33155667788', '321 Boulevard Métallurgie')
      ON CONFLICT DO NOTHING
    `);
    console.log('   • 2 fournisseurs de test insérés');
    
    await tsrClient.end();
    console.log('\n🎉 PROVISIONING TSR TERMINÉ AVEC SUCCÈS !');
    
  } catch (error) {
    console.error('❌ Erreur provisioning:', error.message);
  }
}

provisionTSR();