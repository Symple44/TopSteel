#!/usr/bin/env ts-node

import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { CreateSearchIndexes20250811 } from '../core/database/migrations/topsteel/20250811-CreateSearchIndexes'

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../../../.env') })

// Configuration des bases de données
const dbPrefix = process.env.DB_PREFIX || 'erp_topsteel'
const databases = [
  {
    name: 'topsteel (tenant)',
    database: `${dbPrefix}_topsteel`, // erp_topsteel_topsteel
  },
  {
    name: 'auth',
    database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
  },
  {
    name: 'shared',
    database: process.env.DB_SHARED_NAME || 'erp_topsteel_shared',
  }
]

async function runSearchIndexesMigration() {
  console.log('🔍 Création des index de recherche pour TopSteel...\n')

  for (const db of databases) {
    console.log(`📊 Base de données: ${db.name} (${db.database})`)
    console.log('----------------------------------------')

    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: db.database,
      schema: 'public',
      synchronize: false,
      logging: false,
    })

    try {
      // Initialiser la connexion
      await dataSource.initialize()
      console.log('✅ Connexion établie')

      // Créer un query runner
      const queryRunner = dataSource.createQueryRunner()
      await queryRunner.connect()

      // Vérifier si les tables existent avant de créer les index
      const tables = [
        'partners',
        'articles',
        'materials',
        'projets',
        'devis',
        'factures',
        'commandes',
        'menu_items',
        'users',
        'societes',
        'shared_materials',
        'price_rules',
        'notifications',
        'query_builders'
      ]

      console.log('\n🔍 Vérification des tables...')
      const existingTables: string[] = []
      
      for (const table of tables) {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${table}'
          )
        `)
        
        if (result[0].exists) {
          existingTables.push(table)
          console.log(`  ✓ Table '${table}' trouvée`)
        } else {
          console.log(`  ✗ Table '${table}' non trouvée`)
        }
      }

      if (existingTables.length === 0) {
        console.log('\n⚠️ Aucune table trouvée dans cette base de données')
        await queryRunner.release()
        await dataSource.destroy()
        continue
      }

      // Exécuter la migration pour les tables existantes
      console.log('\n📦 Création des index de recherche...')
      
      // Activer les extensions PostgreSQL
      try {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`)
        console.log('  ✓ Extension pg_trgm activée')
      } catch (error) {
        console.log('  ⚠️ Extension pg_trgm déjà activée ou erreur:', error.message)
      }

      try {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`)
        console.log('  ✓ Extension unaccent activée')
      } catch (error) {
        console.log('  ⚠️ Extension unaccent déjà activée ou erreur:', error.message)
      }

      // Créer les index pour chaque table existante
      for (const table of existingTables) {
        try {
          console.log(`\n  📑 Création des index pour '${table}'...`)
          
          // Index spécifiques par table
          switch(table) {
            case 'partners':
              await createPartnersIndexes(queryRunner)
              break
            case 'articles':
              await createArticlesIndexes(queryRunner)
              break
            case 'materials':
              await createMaterialsIndexes(queryRunner)
              break
            case 'projets':
              await createProjetsIndexes(queryRunner)
              break
            case 'devis':
              await createDevisIndexes(queryRunner)
              break
            case 'factures':
              await createFacturesIndexes(queryRunner)
              break
            case 'menu_items':
              await createMenuItemsIndexes(queryRunner)
              break
            case 'users':
              await createUsersIndexes(queryRunner)
              break
            case 'societes':
              await createSocietesIndexes(queryRunner)
              break
            // Ajouter d'autres cas si nécessaire
          }
          
          console.log(`    ✅ Index créés pour '${table}'`)
        } catch (error) {
          console.log(`    ⚠️ Erreur lors de la création des index pour '${table}':`, error.message)
        }
      }

      // Libérer les ressources
      await queryRunner.release()
      await dataSource.destroy()
      
      console.log(`\n✅ Migration terminée pour la base ${db.name}\n`)

    } catch (error) {
      console.error(`❌ Erreur pour la base ${db.name}:`, error)
      if (dataSource.isInitialized) {
        await dataSource.destroy()
      }
    }
  }

  console.log('\n🎉 Migration des index de recherche terminée avec succès!')
}

// Fonctions pour créer les index par table
async function createPartnersIndexes(queryRunner: any) {
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_partners_search 
    ON partners USING gin(
      to_tsvector('french', 
        coalesce(denomination, '') || ' ' || 
        coalesce(code, '') || ' ' ||
        coalesce(email, '')
      )
    );
  `)
  
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_partners_code ON partners(code);
    CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
  `)
}

async function createArticlesIndexes(queryRunner: any) {
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_articles_search
    ON articles USING gin(
      to_tsvector('french',
        coalesce(designation, '') || ' ' ||
        coalesce(reference, '')
      )
    );
  `)
  
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_articles_reference ON articles(reference);
  `)
}

async function createMaterialsIndexes(queryRunner: any) {
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_materials_search
    ON materials USING gin(
      to_tsvector('french',
        coalesce(nom, '') || ' ' ||
        coalesce(reference, '')
      )
    );
  `)
  
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_materials_reference ON materials(reference);
  `)
}

async function createProjetsIndexes(queryRunner: any) {
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_projets_search
    ON projets USING gin(
      to_tsvector('french',
        coalesce(nom, '') || ' ' ||
        coalesce(code, '')
      )
    );
  `)
  
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_projets_code ON projets(code);
  `)
}

async function createDevisIndexes(queryRunner: any) {
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_devis_search
    ON devis USING gin(
      to_tsvector('french',
        coalesce(numero, '') || ' ' ||
        coalesce(objet, '')
      )
    );
  `)
  
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_devis_numero ON devis(numero);
  `)
}

async function createFacturesIndexes(queryRunner: any) {
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_factures_search
    ON factures USING gin(
      to_tsvector('french',
        coalesce(numero, '') || ' ' ||
        coalesce(objet, '')
      )
    );
  `)
  
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_factures_numero ON factures(numero);
  `)
}

async function createMenuItemsIndexes(queryRunner: any) {
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_menu_items_search
    ON menu_items USING gin(
      to_tsvector('french',
        coalesce(title, '')
      )
    );
  `)
  
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_menu_items_visible ON menu_items("isVisible");
    CREATE INDEX IF NOT EXISTS idx_menu_items_type ON menu_items(type);
  `)
}

async function createUsersIndexes(queryRunner: any) {
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_users_search
    ON users USING gin(
      to_tsvector('french',
        coalesce(nom, '') || ' ' ||
        coalesce(prenom, '') || ' ' ||
        coalesce(email, '')
      )
    );
  `)
  
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `)
}

async function createSocietesIndexes(queryRunner: any) {
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_societes_search
    ON societes USING gin(
      to_tsvector('french',
        coalesce(nom, '') || ' ' ||
        coalesce(code, '')
      )
    );
  `)
  
  await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_societes_code ON societes(code);
  `)
}

// Exécuter le script
runSearchIndexesMigration()
  .then(() => {
    console.log('\n✨ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })