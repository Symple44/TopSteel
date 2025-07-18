#!/usr/bin/env ts-node
/**
 * Script de réinitialisation complète de la base de données
 * Usage: npm run db:reset
 */

import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { DatabaseSyncService } from '../database/database-sync.service'
import { Logger } from '@nestjs/common'

const logger = new Logger('DatabaseReset')

async function resetDatabase() {
  logger.warn('⚠️  ATTENTION: Ce script va SUPPRIMER TOUTES LES DONNÉES de la base ⚠️')
  logger.warn('Vous avez 5 secondes pour annuler (Ctrl+C)...')
  
  // Délai de sécurité
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  try {
    // Créer une instance de l'application
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    })
    
    // Récupérer le service de synchronisation
    const syncService = app.get(DatabaseSyncService)
    
    logger.log('🔄 Début de la réinitialisation...')
    
    // Réinitialiser complètement la base
    await syncService.resetDatabase()
    
    logger.log('✅ Base de données réinitialisée avec succès!')
    logger.log('Vous pouvez maintenant redémarrer l\'application.')
    
    await app.close()
    process.exit(0)
  } catch (error) {
    logger.error('❌ Erreur lors de la réinitialisation:', error)
    process.exit(1)
  }
}

// Vérifier les arguments
const args = process.argv.slice(2)
if (args.includes('--force')) {
  logger.warn('Mode --force activé, pas de délai de sécurité')
  resetDatabase()
} else {
  resetDatabase()
}