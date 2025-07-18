import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { DatabaseIntegrityService } from '../modules/admin/services/database-integrity.service'

async function testSync() {
  console.log('Démarrage du test de synchronisation...')
  
  const app = await NestFactory.createApplicationContext(AppModule)
  const dbService = app.get(DatabaseIntegrityService)
  
  try {
    console.log('Test de connexion...')
    const connStatus = await dbService.checkDatabaseConnection()
    console.log('Connexion:', connStatus)
    
    if (!connStatus.connected) {
      console.error('Impossible de se connecter à la base de données')
      await app.close()
      return
    }
    
    console.log('Génération du rapport d\'intégrité...')
    const report = await dbService.generateIntegrityReport()
    console.log('Rapport:', {
      totalTables: report.summary.total,
      ok: report.summary.ok,
      missing: report.summary.missing,
      extra: report.summary.extra
    })
    
    if (report.summary.missing > 0) {
      console.log('Tables manquantes:', report.tableDetails
        .filter(t => t.status === 'missing')
        .map(t => t.name)
      )
      
      console.log('\nTentative de synchronisation...')
      const syncResult = await dbService.synchronizeDatabase()
      console.log('Résultat:', syncResult)
    } else {
      console.log('Toutes les tables sont présentes')
    }
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await app.close()
  }
}

testSync().catch(console.error)