#!/usr/bin/env ts-node

/**
 * Script pour tester que les corrections API fonctionnent
 * Teste les requêtes qui causaient des erreurs auparavant
 */

import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import {
  Article,
  ArticleStatus,
  ArticleType,
  UniteStock,
} from '../domains/inventory/entities/article.entity'

// Charger les variables d'environnement
config()

async function testApiFixes() {
  // Configuration de connexion
  const tenantDbConfig = {
    type: 'postgres' as const,
    host: process.env.ERP_DB_HOST || 'localhost',
    port: parseInt(process.env.ERP_DB_PORT || '5432'),
    username: process.env.ERP_DB_USERNAME || 'postgres',
    password: process.env.ERP_DB_PASSWORD || 'postgres',
    database: 'erp_topsteel_topsteel',
    entities: [Article],
    logging: false,
  }

  let connection: DataSource | null = null

  try {
    // Créer la connexion
    connection = new DataSource(tenantDbConfig)
    await connection.initialize()

    const articlesRepo = connection.getRepository(Article)
    const testSocieteId = '123e4567-e89b-12d3-a456-426614174000' // UUID valide pour les tests

    // Cette requête causait l'erreur "la colonne article.societeId n'existe pas"
    const articlesQuery = articlesRepo
      .createQueryBuilder('article')
      .where('article.societeId = :societeId', { societeId: testSocieteId })
      .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
      .limit(5)

    const _articles = await articlesQuery.getMany()

    const columns = await connection.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'articles' 
      AND column_name IN ('societe_id', 'created_at', 'updated_at', 'is_marketplace_enabled')
      ORDER BY column_name;
    `)
    columns.forEach((_col: any) => {})

    const societeCount = await connection.query(`
      SELECT COUNT(*) as count FROM societes WHERE code = 'topsteel';
    `)

    if (societeCount[0].count > 0) {
      const _societe = await connection.query(`
        SELECT nom, code, status, configuration 
        FROM societes 
        WHERE code = 'topsteel' 
        LIMIT 1;
      `)
    } else {
    }

    try {
      // Créer un article de test
      const testArticle = new Article()
      testArticle.reference = 'TEST-001'
      testArticle.designation = 'Article de test'
      testArticle.type = ArticleType.PRODUIT_FINI
      testArticle.status = ArticleStatus.ACTIF
      testArticle.uniteStock = UniteStock.PIECE
      testArticle.gereEnStock = true
      testArticle.societeId = testSocieteId // Cette propriété doit maintenant fonctionner

      // Valider l'article
      const errors = testArticle.validate()
      if (errors.length === 0) {
      } else {
      }
    } catch (_error: any) {}
  } catch (error: any) {
    throw error
  } finally {
    if (connection?.isInitialized) {
      await connection.destroy()
    }
  }
}

// Exécuter les tests
if (require.main === module) {
  testApiFixes()
    .then(() => {
      process.exit(0)
    })
    .catch((_error) => {
      process.exit(1)
    })
}

export { testApiFixes }
