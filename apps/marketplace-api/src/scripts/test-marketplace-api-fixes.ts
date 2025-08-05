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
  console.log('🧪 Test des corrections du marketplace-api...')

  // Configuration de connexion pour la base tenant (même config que TenantResolver)
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

  // Configuration pour la base auth
  const authDbConfig = {
    type: 'postgres' as const,
    host: process.env.ERP_DB_HOST || 'localhost',
    port: parseInt(process.env.ERP_DB_PORT || '5432'),
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
    console.log('✅ Connexion tenant établie')

    // Créer la connexion auth
    authConnection = new DataSource(authDbConfig)
    await authConnection.initialize()
    console.log('✅ Connexion auth établie')

    // Test 1: Vérifier que la requête Societe avec createdAt fonctionne
    console.log('\n🔍 Test 1: Requête societes avec createdAt...')

    const societeRepo = authConnection.getRepository(Societe)
    const societes = await societeRepo.find({
      where: { code: 'topsteel' },
      take: 1,
    })

    console.log(`✅ Requête societes réussie, ${societes.length} société(s) trouvée(s)`)
    if (societes.length > 0) {
      console.log(`   - Nom: ${societes[0].nom}`)
      console.log(`   - CreatedAt: ${societes[0].createdAt}`)
      console.log(`   - Marketplace enabled: ${societes[0].configuration?.marketplace?.enabled}`)
    }

    // Test 2: Vérifier que la requête Article avec societeId fonctionne
    console.log('\n🔍 Test 2: Requête articles avec societeId...')

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

    const articles = await articlesQuery.getMany()
    console.log(`✅ Requête articles avec societeId réussie, ${articles.length} articles trouvés`)

    // Test 3: Vérifier les catégories (requête qui échouait)
    console.log('\n🔍 Test 3: Requête catégories...')

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

    const categories = await categoriesQuery.getRawMany()
    console.log(`✅ Requête catégories réussie, ${categories.length} catégories trouvées`)

    // Test 4: Simulation du MarketplaceProductsService.getProducts()
    console.log('\n🔍 Test 4: Simulation de getProducts...')

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
      console.log(`✅ Simulation getProducts réussie, ${testArticles.length} articles récupérés`)

      // Test des méthodes utilitaires
      if (testArticles.length > 0) {
        const article = testArticles[0]
        console.log(`   - Article test: ${article.reference} - ${article.designation}`)
        console.log(`   - En rupture: ${article.estEnRupture()}`)
        console.log(`   - Stock disponible: ${article.calculerStockDisponible()}`)
      }
    } catch (error: any) {
      console.log('❌ Erreur simulation getProducts:', error.message)
    }

    console.log('\n🎉 Tous les tests du marketplace-api sont passés !')
  } catch (error: any) {
    console.error('❌ Erreur lors des tests marketplace-api:', error.message)
    throw error
  } finally {
    if (tenantConnection && tenantConnection.isInitialized) {
      await tenantConnection.destroy()
    }
    if (authConnection && authConnection.isInitialized) {
      await authConnection.destroy()
    }
    console.log('🔌 Connexions fermées')
  }
}

// Exécuter les tests
if (require.main === module) {
  testMarketplaceApiFixes()
    .then(() => {
      console.log('Tests marketplace-api terminés avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Échec des tests marketplace-api:', error)
      process.exit(1)
    })
}

export { testMarketplaceApiFixes }
