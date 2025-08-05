#!/usr/bin/env ts-node

/**
 * Script pour corriger la structure de base de données et synchroniser les entités
 * Résout les problèmes de colonnes manquantes (societeId, createdAt, etc.)
 */

import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

async function fixDatabaseStructure() {
  console.log('🔧 Démarrage de la correction de la structure de base de données...')

  // Configuration de connexion pour la base tenant
  const tenantDbConfig = {
    type: 'postgres' as const,
    host: process.env.ERP_DB_HOST || 'localhost',
    port: parseInt(process.env.ERP_DB_PORT || '5432'),
    username: process.env.ERP_DB_USERNAME || 'postgres',
    password: process.env.ERP_DB_PASSWORD || 'postgres',
    database: 'erp_topsteel_topsteel', // Base spécifique à TopSteel
    logging: true,
  }

  console.log('📂 Configuration de connexion:', {
    host: tenantDbConfig.host,
    port: tenantDbConfig.port,
    username: tenantDbConfig.username,
    database: tenantDbConfig.database,
  })

  let connection: DataSource | null = null

  try {
    // Créer la connexion
    connection = new DataSource(tenantDbConfig)
    await connection.initialize()
    console.log('✅ Connexion à la base de données établie')

    // Vérifier si la table articles existe et sa structure
    console.log('\n🔍 Vérification de la structure de la table articles...')

    const articlesTableExists = await connection.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'articles'
      );
    `)

    if (articlesTableExists[0].exists) {
      console.log('✅ Table articles trouvée')

      // Vérifier si la colonne societe_id existe
      const societeIdColumnExists = await connection.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'articles'
          AND column_name = 'societe_id'
        );
      `)

      if (societeIdColumnExists[0].exists) {
        console.log('✅ Colonne societe_id présente')
      } else {
        console.log('❌ Colonne societe_id manquante. Ajout...')
        await connection.query(`
          ALTER TABLE articles ADD COLUMN IF NOT EXISTS societe_id UUID NOT NULL DEFAULT uuid_generate_v4();
          CREATE INDEX IF NOT EXISTS idx_articles_societe_id ON articles (societe_id);
        `)
        console.log('✅ Colonne societe_id ajoutée')
      }

      // Vérifier si les colonnes marketplace existent
      const marketplaceColumnExists = await connection.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'articles'
          AND column_name = 'is_marketplace_enabled'
        );
      `)

      if (marketplaceColumnExists[0].exists) {
        console.log('✅ Colonnes marketplace présentes')
      } else {
        console.log('❌ Colonnes marketplace manquantes. Ajout...')
        await connection.query(`
          ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_marketplace_enabled BOOLEAN DEFAULT false;
          ALTER TABLE articles ADD COLUMN IF NOT EXISTS marketplace_settings JSONB NULL;
        `)
        console.log('✅ Colonnes marketplace ajoutées')
      }
    } else {
      console.log('❌ Table articles introuvable. Exécution de la migration...')

      // Créer la table articles avec la structure correcte
      await connection.query(`
        -- Créer les enums s'ils n'existent pas
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'article_type') THEN
            CREATE TYPE article_type AS ENUM (
              'MATIERE_PREMIERE', 'PRODUIT_FINI', 'PRODUIT_SEMI_FINI',
              'FOURNITURE', 'CONSOMMABLE', 'SERVICE'
            );
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'article_status') THEN
            CREATE TYPE article_status AS ENUM (
              'ACTIF', 'INACTIF', 'OBSOLETE', 'EN_COURS_CREATION'
            );
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_stock') THEN
            CREATE TYPE unite_stock AS ENUM (
              'PCS', 'KG', 'G', 'M', 'CM', 'MM',
              'M2', 'M3', 'L', 'ML', 'T', 'H'
            );
          END IF;
        END$$;

        -- Créer la table articles
        CREATE TABLE IF NOT EXISTS articles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          version INTEGER DEFAULT 1,
          created_by_id UUID NULL,
          updated_by_id UUID NULL,
          deleted_by_id UUID NULL,
          societe_id UUID NOT NULL,
          site_id UUID NULL,
          reference VARCHAR(30) UNIQUE NOT NULL,
          designation VARCHAR(255) NOT NULL,
          description TEXT NULL,
          type article_type NOT NULL,
          status article_status DEFAULT 'ACTIF',
          famille VARCHAR(50) NULL,
          sous_famille VARCHAR(50) NULL,
          marque VARCHAR(100) NULL,
          modele VARCHAR(50) NULL,
          unite_stock unite_stock DEFAULT 'PCS',
          unite_achat unite_stock NULL,
          unite_vente unite_stock NULL,
          coefficient_achat DECIMAL(10,4) DEFAULT 1,
          coefficient_vente DECIMAL(10,4) DEFAULT 1,
          gere_en_stock BOOLEAN DEFAULT true,
          stock_physique DECIMAL(15,4) DEFAULT 0,
          stock_reserve DECIMAL(15,4) DEFAULT 0,
          stock_disponible DECIMAL(15,4) DEFAULT 0,
          stock_mini DECIMAL(15,4) NULL,
          stock_maxi DECIMAL(15,4) NULL,
          stock_securite DECIMAL(15,4) NULL,
          prix_achat_standard DECIMAL(12,4) NULL,
          prix_achat_moyen DECIMAL(12,4) NULL,
          prix_vente_ht DECIMAL(12,4) NULL,
          taux_tva DECIMAL(5,2) NULL,
          taux_marge DECIMAL(5,2) NULL,
          fournisseur_principal_id UUID NULL,
          reference_fournisseur VARCHAR(50) NULL,
          delai_approvisionnement VARCHAR(10) NULL,
          quantite_mini_commande DECIMAL(15,4) NULL,
          quantite_multiple_commande DECIMAL(15,4) NULL,
          poids DECIMAL(10,4) NULL,
          volume DECIMAL(10,4) NULL,
          longueur DECIMAL(8,4) NULL,
          largeur DECIMAL(8,4) NULL,
          hauteur DECIMAL(8,4) NULL,
          couleur VARCHAR(50) NULL,
          compte_comptable_achat VARCHAR(20) NULL,
          compte_comptable_vente VARCHAR(20) NULL,
          compte_comptable_stock VARCHAR(20) NULL,
          code_douanier VARCHAR(10) NULL,
          code_ean VARCHAR(30) NULL,
          caracteristiques_techniques JSONB DEFAULT '{}',
          informations_logistiques JSONB DEFAULT '{}',
          metadonnees JSONB DEFAULT '{}',
          date_creation_fiche DATE NULL,
          date_derniere_modification DATE NULL,
          date_dernier_inventaire DATE NULL,
          date_dernier_mouvement DATE NULL,
          -- Colonnes marketplace
          is_marketplace_enabled BOOLEAN DEFAULT false,
          marketplace_settings JSONB NULL
        );

        -- Créer les index
        CREATE INDEX IF NOT EXISTS idx_articles_reference ON articles (reference);
        CREATE INDEX IF NOT EXISTS idx_articles_designation ON articles (designation);
        CREATE INDEX IF NOT EXISTS idx_articles_type ON articles (type);
        CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status);
        CREATE INDEX IF NOT EXISTS idx_articles_famille ON articles (famille);
        CREATE INDEX IF NOT EXISTS idx_articles_societe_id ON articles (societe_id);
        CREATE INDEX IF NOT EXISTS idx_articles_gere_en_stock ON articles (gere_en_stock);
        CREATE INDEX IF NOT EXISTS idx_articles_code_ean ON articles (code_ean);
      `)

      console.log('✅ Table articles créée avec succès')
    }

    // Vérifier la table societes dans la base auth
    console.log('\n🔍 Vérification de la table societes...')

    const societeTableExists = await connection.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'societes'
      );
    `)

    if (societeTableExists[0].exists) {
      console.log('✅ Table societes trouvée')
    } else {
      console.log('❌ Table societes introuvable. Création...')
      await connection.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'societe_status') THEN
            CREATE TYPE societe_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL');
          END IF;
        END$$;

        CREATE TABLE IF NOT EXISTS societes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          version INTEGER DEFAULT 1,
          created_by_id UUID NULL,
          updated_by_id UUID NULL,
          deleted_by_id UUID NULL,
          nom VARCHAR(255) NOT NULL,
          code VARCHAR(100) UNIQUE NOT NULL,
          siret VARCHAR(20) NULL,
          tva VARCHAR(20) NULL,
          adresse TEXT NULL,
          code_postal VARCHAR(10) NULL,
          ville VARCHAR(100) NULL,
          pays VARCHAR(100) NULL,
          telephone VARCHAR(20) NULL,
          email VARCHAR(255) NULL,
          website VARCHAR(255) NULL,
          status societe_status DEFAULT 'TRIAL',
          database_name VARCHAR(100) NOT NULL,
          database_host VARCHAR(100) NULL,
          database_port INTEGER NULL,
          max_users INTEGER DEFAULT 5,
          max_sites INTEGER DEFAULT 1,
          max_storage_bytes BIGINT NULL,
          date_activation DATE NULL,
          date_expiration DATE NULL,
          configuration JSONB DEFAULT '{}',
          metadata JSONB NULL
        );

        CREATE INDEX IF NOT EXISTS idx_societes_nom ON societes (nom);
        CREATE INDEX IF NOT EXISTS idx_societes_code ON societes (code);
        CREATE INDEX IF NOT EXISTS idx_societes_status ON societes (status);
      `)
      console.log('✅ Table societes créée')
    }

    // Insérer une société de test TopSteel si elle n'existe pas
    const topsteelExists = await connection.query(`
      SELECT EXISTS (
        SELECT FROM societes 
        WHERE code = 'topsteel'
      );
    `)

    if (topsteelExists[0].exists) {
      console.log('✅ Société TopSteel existe')
    } else {
      console.log('❌ Société TopSteel manquante. Création...')
      await connection.query(`
        INSERT INTO societes (
          nom, code, status, database_name,
          configuration, created_at, updated_at
        ) VALUES (
          'TopSteel',
          'topsteel', 
          'ACTIVE',
          'erp_topsteel_topsteel',
          '{"marketplace": {"enabled": true, "storeName": "TopSteel", "description": "Boutique en ligne TopSteel"}}',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        );
      `)
      console.log('✅ Société TopSteel créée')
    }

    console.log('\n🎉 Correction de la structure de base de données terminée avec succès !')
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
    throw error
  } finally {
    if (connection && connection.isInitialized) {
      await connection.destroy()
      console.log('🔌 Connexion fermée')
    }
  }
}

// Exécuter le script
if (require.main === module) {
  fixDatabaseStructure()
    .then(() => {
      console.log('Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Échec du script:', error)
      process.exit(1)
    })
}

export { fixDatabaseStructure }
