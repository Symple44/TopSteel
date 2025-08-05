#!/usr/bin/env ts-node

/**
 * Script de nettoyage direct de la table system_settings
 * TopSteel ERP - Clean Architecture
 *
 * Supprime la table system_settings devenue obsolète après migration vers auth
 * Usage: npm run cleanup:system-settings
 */

import { config } from 'dotenv'
import { DataSource } from 'typeorm'

config()

async function cleanupSystemSettings() {
  console.log('🧹 NETTOYAGE DE LA TABLE SYSTEM_SETTINGS')
  console.log('=======================================\n')

  // Connexion base tenant
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.TENANT_DB_NAME || 'erp_topsteel_topsteel',
    logging: false,
  })

  try {
    console.log('🔌 Connexion à la base tenant...')
    await dataSource.initialize()
    console.log('✅ Connexion établie\n')

    // Vérifier si la table existe
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_settings'
      )
    `)

    if (!tableExists[0].exists) {
      console.log("ℹ️  La table system_settings n'existe déjà plus.")
      return
    }

    // Vérifier le contenu
    const count = await dataSource.query('SELECT COUNT(*) FROM system_settings')
    console.log(`📊 Enregistrements dans system_settings: ${count[0].count}`)

    if (count[0].count > 0) {
      // Afficher le contenu avant suppression
      const content = await dataSource.query(
        'SELECT category, key FROM system_settings ORDER BY category, key'
      )
      console.log('\n📋 Contenu à supprimer:')
      content.forEach((row: any, index: number) => {
        console.log(`   ${index + 1}. ${row.category}.${row.key}`)
      })
    }

    // Supprimer le contenu
    console.log('\n🗑️  Suppression du contenu...')
    await dataSource.query('DELETE FROM system_settings')
    console.log('✅ Contenu supprimé')

    // Supprimer la table
    console.log('\n🗑️  Suppression de la table system_settings...')
    await dataSource.query('DROP TABLE IF EXISTS system_settings CASCADE')
    console.log('✅ Table system_settings supprimée')

    // Vérification finale
    const finalCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_settings'
      )
    `)

    if (finalCheck[0].exists) {
      console.log('\n❌ Erreur: La table existe encore après suppression')
    } else {
      console.log('\n🎉 NETTOYAGE TERMINÉ AVEC SUCCÈS!')
      console.log('   ✅ Table system_settings complètement supprimée')
      console.log('   ✅ Architecture des paramètres maintenant cohérente')
      console.log('   📍 Paramètres système dans parameters_system (base auth)')
    }
  } catch (error) {
    console.error('\n💥 ERREUR lors du nettoyage:', error)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
      console.log('\n🔌 Connexion fermée')
    }
  }
}

// Exécution du script
async function main() {
  try {
    await cleanupSystemSettings()
    console.log('\n✨ Script terminé avec succès')
  } catch (error) {
    console.error('\n💥 ERREUR FATALE:', error)
    process.exit(1)
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error)
}
