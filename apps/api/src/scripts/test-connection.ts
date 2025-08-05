#!/usr/bin/env ts-node

/**
 * Script de test de connexion base de données
 * TopSteel ERP - Détection des bases disponibles
 */

import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

async function testConnection() {
  const dbConfig = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  }

  // Test des différentes bases possibles
  const possibleDatabases = [
    'erp_topsteel',
    'erp_topsteel_tenant',
    'erp_topsteel_auth',
    'topsteel_tenant',
    'topsteel_auth',
    'postgres', // Base par défaut
  ]

  for (const dbName of possibleDatabases) {
    const dataSource = new DataSource({
      ...dbConfig,
      database: dbName,
      logging: false,
    })

    try {
      await dataSource.initialize()

      // Test simple: compter les tables
      const _tables = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `)

      // Rechercher spécifiquement les tables d'articles et sociétés
      const importantTables = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('articles', 'societes', 'users', 'system_settings')
        ORDER BY table_name
      `)

      if (importantTables.length > 0) {
        // Vérifier les sociétés existantes
        try {
          const societes = await dataSource.query(
            'SELECT code, raison_sociale FROM societes LIMIT 5'
          )
          if (societes.length > 0) {
          }
        } catch (_e) {}

        // Vérifier les articles existants
        try {
          const _articleCount = await dataSource.query('SELECT COUNT(*) as count FROM articles')
        } catch (_e) {}
      }

      await dataSource.destroy()
    } catch (_error) {}
  }
}

// Exécution
testConnection().catch(console.error)
