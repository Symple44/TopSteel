// apps/api/src/scripts/test-shutdown-reboot.ts
import { Logger } from '@nestjs/common'
import { EnhancedServerManager } from '../config/enhanced-server-manager'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const logger = new Logger('ShutdownTest')

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testShutdownAndReboot() {
  logger.log('🧪 === TEST DE SHUTDOWN ET REBOOT ===')
  
  try {
    // 1. Diagnostic initial
    logger.log('📊 1. Diagnostic initial des ports...')
    const diagPort3002 = await EnhancedServerManager.diagnosePort(3002)
    const diagPort3003 = await EnhancedServerManager.diagnosePort(3003)
    
    logger.log('Port 3002:', diagPort3002)
    logger.log('Port 3003:', diagPort3003)
    
    // 2. Tester le nettoyage des ports occupés
    logger.log('🧹 2. Test de nettoyage des ports...')
    
    if (!diagPort3002.available) {
      logger.log('Nettoyage du port 3002...')
      const success3002 = await EnhancedServerManager.cleanupPort(3002, 3)
      logger.log(`Port 3002 nettoyé: ${success3002 ? '✅' : '❌'}`)
    }
    
    if (!diagPort3003.available) {
      logger.log('Nettoyage du port 3003...')
      const success3003 = await EnhancedServerManager.cleanupPort(3003, 3)
      logger.log(`Port 3003 nettoyé: ${success3003 ? '✅' : '❌'}`)
    }
    
    // 3. Vérification post-nettoyage
    logger.log('🔍 3. Vérification post-nettoyage...')
    await sleep(2000)
    
    const isPort3002Available = await EnhancedServerManager.isPortAvailable(3002)
    const isPort3003Available = await EnhancedServerManager.isPortAvailable(3003)
    
    logger.log(`Port 3002 disponible: ${isPort3002Available ? '✅' : '❌'}`)
    logger.log(`Port 3003 disponible: ${isPort3003Available ? '✅' : '❌'}`)
    
    // 4. Test de démarrage rapide
    logger.log('🚀 4. Test de démarrage...')
    const startCommand = 'cd apps/api && node dist/main.js'
    
    // Démarrer l'API en arrière-plan
    const childProcess = exec(startCommand, (error, stdout, stderr) => {
      if (error && !error.killed) {
        logger.error('Erreur de démarrage:', error)
      }
    })
    
    logger.log('⏳ Attente du démarrage de l\'API...')
    await sleep(8000)
    
    // 5. Vérifier que l'API répond
    logger.log('📡 5. Test de connectivité...')
    try {
      const { stdout } = await execAsync('curl -s http://localhost:3002/api/v1/health || curl -s http://localhost:3003/api/v1/health')
      logger.log('✅ API répond correctement')
    } catch (error) {
      logger.warn('⚠️  API ne répond pas encore')
    }
    
    // 6. Test d'arrêt gracieux
    logger.log('🛑 6. Test d\'arrêt gracieux...')
    if (childProcess.pid) {
      // Envoyer SIGTERM (arrêt gracieux)
      process.kill(childProcess.pid, 'SIGTERM')
      logger.log('Signal SIGTERM envoyé')
      
      // Attendre l'arrêt
      await sleep(5000)
      
      // Vérifier que les ports sont libérés
      const isPort3002Free = await EnhancedServerManager.isPortAvailable(3002)
      const isPort3003Free = await EnhancedServerManager.isPortAvailable(3003)
      
      logger.log(`Après SIGTERM - Port 3002: ${isPort3002Free ? '✅ libre' : '❌ occupé'}`)
      logger.log(`Après SIGTERM - Port 3003: ${isPort3003Free ? '✅ libre' : '❌ occupé'}`)
    }
    
    // 7. Nettoyage final et test de redémarrage immédiat
    logger.log('🔄 7. Test de redémarrage immédiat...')
    await EnhancedServerManager.cleanupOrphanedProcesses()
    await sleep(2000)
    
    // Nouveau démarrage
    const restartProcess = exec(startCommand, (error, stdout, stderr) => {
      if (error && !error.killed) {
        logger.error('Erreur de redémarrage:', error)
      }
    })
    
    await sleep(6000)
    
    // Test final
    try {
      const { stdout } = await execAsync('curl -s http://localhost:3002/api/v1/health || curl -s http://localhost:3003/api/v1/health')
      logger.log('✅ Redémarrage réussi - API répond')
    } catch (error) {
      logger.warn('⚠️  Problème lors du redémarrage')
    }
    
    // Arrêt final
    if (restartProcess.pid) {
      process.kill(restartProcess.pid, 'SIGTERM')
    }
    
    logger.log('🎉 === TEST TERMINÉ ===')
    
  } catch (error) {
    logger.error('❌ Erreur durant le test:', error)
  }
  
  // Nettoyage final
  await EnhancedServerManager.cleanupOrphanedProcesses()
  process.exit(0)
}

// Exécuter le test
testShutdownAndReboot().catch(error => {
  logger.error('Test failed:', error)
  process.exit(1)
})