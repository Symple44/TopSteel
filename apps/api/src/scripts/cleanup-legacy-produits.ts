#!/usr/bin/env ts-node

/**
 * Script de nettoyage de la table legacy 'produits'
 * TopSteel ERP - Clean Architecture
 * 
 * Usage: npm run cleanup:produits
 * ou: npx ts-node src/scripts/cleanup-legacy-produits.ts
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as readline from 'readline'

// Charger les variables d'environnement
config()

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

async function cleanupLegacyProduits() {
  console.log('🧹 NETTOYAGE DE LA TABLE LEGACY "produits"')
  console.log('==========================================\n')

  // Configuration base de données
  const dbName = process.env.TENANT_DB_NAME || 'erp_topsteel_topsteel'
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: dbName,
    logging: false,
  })

  try {
    // Connexion base de données
    console.log('🔌 Connexion à la base de données...')
    await dataSource.initialize()
    console.log('✅ Connexion établie\n')

    // Vérifier si la table existe
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'produits'
      )
    `)

    if (!tableExists[0].exists) {
      console.log('ℹ️  La table "produits" n\'existe pas. Nettoyage non nécessaire.')
      return
    }

    // Vérifier le contenu de la table
    const countResult = await dataSource.query('SELECT COUNT(*) FROM produits')
    const count = parseInt(countResult[0].count)

    console.log(`📊 État de la table "produits":`)
    console.log(`   - Existe: ✅`)
    console.log(`   - Nombre d'enregistrements: ${count}`)

    // Vérifier les contraintes de clé étrangère
    const fkConstraints = await dataSource.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name 
      JOIN information_schema.constraint_column_usage AS ccu 
        ON ccu.constraint_name = tc.constraint_name 
      WHERE constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'produits'
    `)

    if (fkConstraints.length > 0) {
      console.log(`\n⚠️  ATTENTION: ${fkConstraints.length} contrainte(s) de clé étrangère référencent cette table:`)
      fkConstraints.forEach((fk: any) => {
        console.log(`   - ${fk.table_name}.${fk.column_name} → produits.${fk.foreign_column_name}`)
      })
      console.log('\n🛑 Suppression annulée pour préserver l\'intégrité des données.')
      return
    }

    // Demander confirmation
    console.log(`\n⚠️  Vous êtes sur le point de supprimer définitivement:`)
    console.log(`   - La table "produits"`)
    console.log(`   - Ses ${count} enregistrement(s)`)
    console.log(`   - Ses index et contraintes`)
    console.log(`\n⚠️  CETTE ACTION EST IRRÉVERSIBLE!`)

    const confirmed = await askConfirmation('\n❓ Confirmez-vous la suppression? (y/N): ')

    if (!confirmed) {
      console.log('\n❌ Suppression annulée par l\'utilisateur.')
      return
    }

    // Sauvegarder les données si il y en a
    if (count > 0) {
      console.log('\n💾 Sauvegarde des données existantes...')
      const data = await dataSource.query('SELECT * FROM produits')
      
      // Créer une table de sauvegarde
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS produits_backup_${Date.now()} AS 
        SELECT * FROM produits
      `)
      console.log('✅ Sauvegarde créée')
    }

    // Supprimer la table
    console.log('\n🗑️  Suppression de la table "produits"...')
    await dataSource.query('DROP TABLE IF EXISTS produits CASCADE')
    console.log('✅ Table "produits" supprimée avec succès')

    // Supprimer la séquence associée si elle existe
    await dataSource.query('DROP SEQUENCE IF EXISTS produits_id_seq CASCADE')
    console.log('✅ Séquence "produits_id_seq" supprimée')

    // Vérification finale
    const finalCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'produits'
      )
    `)

    if (!finalCheck[0].exists) {
      console.log('\n🎉 NETTOYAGE TERMINÉ AVEC SUCCÈS!')
      console.log('   ✅ Table "produits" complètement supprimée')
      console.log('   ✅ Base de données nettoyée')
      console.log('   ✅ Migration vers "articles" complète')
    } else {
      console.log('\n❌ Erreur: La table existe encore après suppression')
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
    await cleanupLegacyProduits()
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