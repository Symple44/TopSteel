#!/usr/bin/env ts-node

/**
 * Script d'injection des données de métallurgie
 * TopSteel ERP - Charpente métallique complète
 *
 * Usage: npm run inject-metallurgy-data
 * ou: npx ts-node src/scripts/inject-metallurgy-data.ts
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Charger les variables d'environnement
config()

interface ScriptResult {
  name: string
  success: boolean
  duration: number
  articlesCreated?: number
  error?: string
}

class MetallurgyDataInjector {
  private dataSource: DataSource
  private scriptsPath: string
  private results: ScriptResult[] = []

  constructor() {
    this.scriptsPath = join(__dirname, '.')

    // Utiliser la base de données tenant TOPSTEEL par défaut
    const dbName = process.env.TENANT_DB_NAME || 'erp_topsteel_topsteel'

    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: dbName,
      logging: false,
    })
  }

  /**
   * Initialisation de la connexion base de données
   */
  async initialize(): Promise<void> {
    try {
      await this.dataSource.initialize()
      console.log('✅ Connexion base de données établie')

      // Pour une base tenant, nous assumons que l'ID société sera fourni dans les scripts
      // La table societes est dans la base auth, pas dans la base tenant
      console.log('ℹ️  Utilisation de la base tenant - les sociétés sont gérées dans la base auth')
    } catch (error) {
      console.error('❌ Erreur connexion base de données:', error)
      throw error
    }
  }

  /**
   * Création d'une société par défaut si nécessaire
   */
  private async createDefaultSociety(): Promise<void> {
    const societySQL = `
      INSERT INTO societes (
        id, code, raison_sociale, siret, tva_numero, 
        status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        'TOPSTEEL',
        'TopSteel Métallurgie',
        '12345678901234',
        'FR12345678901',
        'ACTIF',
        NOW(),
        NOW()
      ) ON CONFLICT (code) DO NOTHING;
    `

    await this.dataSource.query(societySQL)
    console.log('✅ Société "topsteel" créée')
  }

  /**
   * Exécution d'un script SQL
   */
  private async executeScript(scriptName: string, description: string): Promise<ScriptResult> {
    const startTime = Date.now()
    console.log(`\n🔄 ${description}...`)

    try {
      const scriptPath = join(this.scriptsPath, scriptName)

      if (!existsSync(scriptPath)) {
        throw new Error(`Script non trouvé: ${scriptPath}`)
      }

      const sqlContent = readFileSync(scriptPath, 'utf-8')

      // Statistiques avant
      const beforeCount = await this.getArticleCount()

      // Exécution du script
      await this.dataSource.query(sqlContent)

      // Statistiques après
      const afterCount = await this.getArticleCount()
      const articlesCreated = afterCount - beforeCount

      const duration = Date.now() - startTime

      console.log(`✅ ${description} terminé (${articlesCreated} articles créés en ${duration}ms)`)

      return {
        name: scriptName,
        success: true,
        duration,
        articlesCreated,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ Erreur lors de ${description}:`, error)

      return {
        name: scriptName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Obtenir le nombre total d'articles
   */
  private async getArticleCount(): Promise<number> {
    try {
      const result = await this.dataSource.query('SELECT COUNT(*) as count FROM articles')
      return parseInt(result[0].count)
    } catch {
      return 0
    }
  }

  /**
   * Injection complète de toutes les données
   */
  async injectAllData(): Promise<void> {
    console.log("🚀 DÉBUT DE L'INJECTION DES DONNÉES MÉTALLURGIE")
    console.log('================================================\n')

    const scripts = [
      {
        file: 'seed-system-settings.sql',
        description: 'Injection des paramètres système',
      },
      {
        file: 'insert_ipe_profiles.sql',
        description: 'Injection des profilés IPE',
      },
      {
        file: 'insert_hea_heb_profiles.sql',
        description: 'Injection des profilés HEA/HEB',
      },
      {
        file: 'inject-tubes-metalliques.sql',
        description: 'Injection des tubes métalliques',
      },
      {
        file: 'insert-fers-plats-ronds.sql',
        description: 'Injection des fers plats et ronds',
      },
      {
        file: 'inject-toles-metalliques.sql',
        description: 'Injection des tôles métalliques',
      },
      {
        file: 'insert_bardage_couverture.sql',
        description: 'Injection des éléments bardage/couverture',
      },
    ]

    // Exécution séquentielle des scripts
    for (const script of scripts) {
      const result = await this.executeScript(script.file, script.description)
      this.results.push(result)

      if (!result.success) {
        console.log('\n⚠️  Script échoué mais continuation...')
      }
    }

    await this.generateReport()
  }

  /**
   * Génération du rapport final
   */
  private async generateReport(): Promise<void> {
    console.log('\n================================================')
    console.log("📊 RAPPORT D'INJECTION FINAL")
    console.log('================================================')

    const successful = this.results.filter((r) => r.success)
    const failed = this.results.filter((r) => !r.success)

    console.log(`✅ Scripts réussis: ${successful.length}/${this.results.length}`)
    console.log(`❌ Scripts échoués: ${failed.length}/${this.results.length}`)

    const totalArticles = successful.reduce((sum, r) => sum + (r.articlesCreated || 0), 0)
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

    console.log(`📦 Total articles créés: ${totalArticles}`)
    console.log(`⏱️  Durée totale: ${totalDuration}ms`)

    // Détail par script
    console.log('\n📋 Détail par script:')
    this.results.forEach((result) => {
      const status = result.success ? '✅' : '❌'
      const articles = result.articlesCreated ? ` (${result.articlesCreated} articles)` : ''
      console.log(`${status} ${result.name}${articles}`)

      if (result.error) {
        console.log(`   🔍 Erreur: ${result.error}`)
      }
    })

    // Statistiques base de données
    try {
      console.log('\n📈 Statistiques base de données:')

      const familyStats = await this.dataSource.query(`
        SELECT 
          famille,
          COUNT(*) as nombre_articles,
          ROUND(AVG(prix_vente_ht), 2) as prix_moyen
        FROM articles 
        WHERE famille IN ('PROFILES_ACIER', 'TUBES_PROFILES', 'ACIERS_LONGS', 'TOLES_PLAQUES', 'COUVERTURE_BARDAGE')
        GROUP BY famille
        ORDER BY famille
      `)

      familyStats.forEach((stat: any) => {
        console.log(
          `   📁 ${stat.famille}: ${stat.nombre_articles} articles (prix moyen: ${stat.prix_moyen}€)`
        )
      })

      const totalStats = await this.dataSource.query(`
        SELECT 
          COUNT(*) as total,
          ROUND(AVG(prix_vente_ht), 2) as prix_moyen,
          ROUND(SUM(prix_vente_ht), 2) as valeur_totale
        FROM articles 
        WHERE famille IN ('PROFILES_ACIER', 'TUBES_PROFILES', 'ACIERS_LONGS', 'TOLES_PLAQUES', 'COUVERTURE_BARDAGE')
      `)

      if (totalStats.length > 0) {
        const stats = totalStats[0]
        console.log(`\n💰 TOTAUX:`)
        console.log(`   📦 Articles métallurgie: ${stats.total}`)
        console.log(`   💶 Prix moyen: ${stats.prix_moyen}€`)
        console.log(`   💎 Valeur catalogue: ${stats.valeur_totale}€`)
      }
    } catch (error) {
      console.log('⚠️  Impossible de récupérer les statistiques:', error)
    }

    console.log('\n🎉 INJECTION TERMINÉE !')
    console.log('================================================')
  }

  /**
   * Nettoyage et fermeture
   */
  async cleanup(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy()
      console.log('🔌 Connexion base de données fermée')
    }
  }
}

// Exécution du script
async function main() {
  const injector = new MetallurgyDataInjector()

  try {
    await injector.initialize()
    await injector.injectAllData()
  } catch (error) {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  } finally {
    await injector.cleanup()
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main().catch(console.error)
}

export { MetallurgyDataInjector }
