// apps/api/src/scripts/cleanup-ports.ts
import { Logger } from '@nestjs/common'
import { EnhancedServerManager } from '../config/enhanced-server-manager'

const logger = new Logger('PortCleanup')

async function cleanupPorts() {
  logger.log('🧹 === NETTOYAGE DES PORTS ===')
  
  try {
    const ports = [3002, 3003, 3004, 3005]
    
    for (const port of ports) {
      logger.log(`🔍 Diagnostic du port ${port}...`)
      const diagnosis = await EnhancedServerManager.diagnosePort(port)
      
      if (!diagnosis.available) {
        logger.log(`⚠️  Port ${port} occupé, nettoyage...`)
        const success = await EnhancedServerManager.cleanupPort(port, 2)
        logger.log(`Port ${port}: ${success ? '✅ libéré' : '❌ échec'}`)
      } else {
        logger.log(`✅ Port ${port} déjà disponible`)
      }
    }
    
    // Nettoyage des processus orphelins
    logger.log('🧹 Nettoyage des processus orphelins...')
    await EnhancedServerManager.cleanupOrphanedProcesses()
    
    logger.log('✅ Nettoyage terminé')
    
  } catch (error) {
    logger.error('❌ Erreur lors du nettoyage:', error)
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  cleanupPorts().then(() => process.exit(0)).catch(err => {
    console.error(err)
    process.exit(1)
  })
}

export { cleanupPorts }