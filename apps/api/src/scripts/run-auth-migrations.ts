#!/usr/bin/env ts-node
/**
 * Script pour exécuter les migrations AUTH
 */

import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../database/data-source-auth'

async function runAuthMigrations() {
  console.log('🔄 Exécution des migrations AUTH...\n')

  const dataSource = new DataSource(authDataSourceOptions)
  
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base AUTH établie')

    // Vérifier les migrations pendantes
    const hasPendingMigrations = await dataSource.showMigrations()
    console.log(`📋 Migrations en attente: ${hasPendingMigrations ? 'Oui' : 'Non'}`)

    // Exécuter les migrations
    const executedMigrations = await dataSource.runMigrations()
    
    if (executedMigrations.length > 0) {
      console.log('\n✅ Migrations exécutées:')
      executedMigrations.forEach(migration => {
        console.log(`   📝 ${migration.name}`)
      })
    } else {
      console.log('\n✅ Aucune migration à exécuter, la base est à jour')
    }

    console.log('\n🎉 Migrations AUTH terminées avec succès!')

  } catch (error: any) {
    console.error('❌ Erreur lors des migrations:', error.message)
    throw error
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runAuthMigrations().catch(console.error)
}

export { runAuthMigrations }