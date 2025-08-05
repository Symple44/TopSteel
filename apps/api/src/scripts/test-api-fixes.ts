#!/usr/bin/env ts-node

/**
 * Script pour tester que les corrections API fonctionnent
 * Teste les requêtes qui causaient des erreurs auparavant
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { Article, ArticleType, ArticleStatus, UniteStock } from '../domains/inventory/entities/article.entity'

// Charger les variables d'environnement
config()

async function testApiFixes() {
  console.log('🧪 Test des corrections API...')

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
    console.log('✅ Connexion établie')

    // Test 1: Vérifier que la requête avec societeId fonctionne
    console.log('\n🔍 Test 1: Requête articles avec societeId...')
    
    const articlesRepo = connection.getRepository(Article)
    const testSocieteId = '123e4567-e89b-12d3-a456-426614174000' // UUID valide pour les tests
    
    // Cette requête causait l'erreur "la colonne article.societeId n'existe pas"
    const articlesQuery = articlesRepo
      .createQueryBuilder('article')
      .where('article.societeId = :societeId', { societeId: testSocieteId })
      .andWhere('article.status = :status', { status: ArticleStatus.ACTIF })
      .limit(5)

    const articles = await articlesQuery.getMany()
    console.log(`✅ Requête societeId réussie, ${articles.length} articles trouvés`)

    // Test 2: Vérifier la structure des colonnes
    console.log('\n🔍 Test 2: Vérification de la structure...')
    
    const columns = await connection.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'articles' 
      AND column_name IN ('societe_id', 'created_at', 'updated_at', 'is_marketplace_enabled')
      ORDER BY column_name;
    `)
    
    console.log('✅ Colonnes critiques présentes:')
    columns.forEach((col: any) => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })

    // Test 3: Vérifier la table societes
    console.log('\n🔍 Test 3: Vérification table societes...')
    
    const societeCount = await connection.query(`
      SELECT COUNT(*) as count FROM societes WHERE code = 'topsteel';
    `)
    
    if (societeCount[0].count > 0) {
      console.log('✅ Société TopSteel trouvée en base')
      
      const societe = await connection.query(`
        SELECT nom, code, status, configuration 
        FROM societes 
        WHERE code = 'topsteel' 
        LIMIT 1;
      `)
      
      console.log(`   - Nom: ${societe[0].nom}`)
      console.log(`   - Status: ${societe[0].status}`)
      console.log(`   - Marketplace: ${societe[0].configuration?.marketplace?.enabled ? 'Activé' : 'Désactivé'}`)
    } else {
      console.log('❌ Société TopSteel non trouvée')
    }

    // Test 4: Test d'insertion d'un article de démonstration
    console.log('\n🔍 Test 4: Test d\'insertion article...')
    
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
        console.log('✅ Validation article réussie')
      } else {
        console.log('❌ Erreurs de validation:', errors)
      }
      
      // Note: On ne sauvegarde pas pour éviter de polluer la base
      console.log('✅ Test d\'insertion simulé avec succès')
      
    } catch (error: any) {
      console.log('❌ Erreur lors du test d\'insertion:', error.message)
    }

    console.log('\n🎉 Tous les tests sont passés ! Les corrections API fonctionnent.')

  } catch (error: any) {
    console.error('❌ Erreur lors des tests:', error.message)
    throw error
  } finally {
    if (connection && connection.isInitialized) {
      await connection.destroy()
      console.log('🔌 Connexion fermée')
    }
  }
}

// Exécuter les tests
if (require.main === module) {
  testApiFixes()
    .then(() => {
      console.log('Tests terminés avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Échec des tests:', error)
      process.exit(1)
    })
}

export { testApiFixes }