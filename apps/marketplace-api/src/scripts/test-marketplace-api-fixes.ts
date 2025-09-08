#!/usr/bin/env ts-node

/**
 * Script pour tester que les corrections du marketplace-api fonctionnent
 */

import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { Article, ArticleStatus } from '../shared/entities/erp/article.entity'
import { Societe } from '../shared/entities/erp/societe.entity'

// Charger les variables d'environnement
config()

async function testMarketplaceApiFixes() {
  // Configuration de connexion pour la base tenant (même config que TenantResolver)
  const tenantDbConfig = {
    type: 'postgres' as const,
    host: process.env.ERP_DB_HOST || 'localhost',
    port: parseInt(process.env.ERP_DB_PORT || '5432', 10),
    username: process.env.ERP_DB_USERNAME || 'postgres',
    password: process.env.ERP_DB_PASSWORD || 'postgres',
    database: 'erp_topsteel_topsteel',
    entities: [Article],
    logging: false,
  }

  // Configuration pour la base auth
  const authDbConfig = {
    type: 'postgres' as const,
    host: process.env.ERP_DB_HOST || 'localhost',
    port: parseInt(process.env.ERP_DB_PORT || '5432', 10),
    username: process.env.ERP_DB_USERNAME || 'postgres',
    password: process.env.ERP_DB_PASSWORD || 'postgres',
    database: 'erp_topsteel_topsteel', // Note: même base pour le test
    entities: [Societe],
    logging: false,
  }

  let tenantConnection: DataSource | null = null
  let authConnection: DataSource | null = null

  try {
    // Créer la connexion tenant
    tenantConnection = new DataSource(tenantDbConfig)
    await tenantConnection.initialize()

    // Créer la connexion auth
    authConnection = new DataSource(authDbConfig)
    await authConnection.initialize()

    const societeRepo = authConnection.getRepository(Societe)
    const societes = await societeRepo.find({
      where: { code: 'topsteel' },
      take: 1,
    })
    if (societes.length > 0) {
    }

    const articlesRepo = tenantConnection.getRepository(Article)

    // Cette requête causait l'erreur "la colonne article.societeId n'existe pas"
    const articlesQuery = articlesRepo
      .createQueryBuilder('article')
      .where('article.societeId = :societeId', {
        societeId: '123e4567-e89b-12d3-a456-426614174000',
      })
      .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
      .andWhere('article.isMarketplaceEnabled = true')
      .limit(5)

    await articlesQuery.getMany()

    const categoriesQuery = articlesRepo
      .createQueryBuilder('article')
      .select('DISTINCT article.famille', 'famille')
      .where('article.societeId = :societeId', {
        societeId: '123e4567-e89b-12d3-a456-426614174000',
      })
      .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
      .andWhere('article.isMarketplaceEnabled = true')
      .andWhere('article.famille IS NOT NULL')
      .orderBy('article.famille', 'ASC')

    await categoriesQuery.getRawMany()

    try {
      const testQuery = articlesRepo
        .createQueryBuilder('article')
        .where('article.societeId = :societeId', {
          societeId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
        .andWhere('article.isMarketplaceEnabled = true')
        .limit(10)

      const testArticles = await testQuery.getMany()

      // Test des méthodes utilitaires
      if (testArticles.length > 0) {
        // Article found for testing
      }
    } catch {
      // Ignore query errors during test
    }
  } finally {
    if (tenantConnection?.isInitialized) {
      await tenantConnection.destroy()
    }
    if (authConnection?.isInitialized) {
      await authConnection.destroy()
    }
  }
}

// Exécuter les tests
if (require.main === module) {
  testMarketplaceApiFixes()
    .then(() => {
      process.exit(0)
    })
    .catch(() => {
      process.exit(1)
    })
}

export { testMarketplaceApiFixes }
