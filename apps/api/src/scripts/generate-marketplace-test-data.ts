import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { ModuleRegistryService } from '../modules/marketplace/services/module-registry.service'
import { MarketplaceService } from '../modules/marketplace/services/marketplace.service'
import { HrAggregatorService } from '../modules/marketplace/real-modules/hr-aggregator/services/hr-aggregator.service'
import { ProcurementPoolService } from '../modules/marketplace/real-modules/procurement-pool/services/procurement-pool.service'

async function generateTestData() {
  console.log('🚀 Génération des données de test pour la Marketplace...')

  const app = await NestFactory.createApplicationContext(AppModule)
  
  try {
    const moduleRegistryService = app.get(ModuleRegistryService)
    const marketplaceService = app.get(MarketplaceService)

    // 1. Enregistrer les modules dans le registre
    console.log('📋 Enregistrement des modules réels...')
    console.log('  ℹ️ Les modules sont enregistrés automatiquement au démarrage')

    // 2. Vérifier la configuration du module RH
    console.log('👥 Configuration du module RH...')
    await generateHrTestData(app)

    // 3. Vérifier la configuration du module Achats
    console.log('🛒 Configuration du module Achats...')
    await generateProcurementTestData(app)

    // 4. Informations sur les statistiques
    console.log('📊 Statistiques marketplace...')
    await generateMarketplaceStats(app)

    console.log('✅ Génération des données de test terminée!')
    console.log('\n📈 Statistiques du registre:')
    console.log(JSON.stringify(moduleRegistryService.getRegistryStats(), null, 2))

  } catch (error) {
    console.error('❌ Erreur lors de la génération des données de test:', error)
  } finally {
    await app.close()
  }
}

async function generateHrTestData(app: any) {
  try {
    console.log('  ℹ️ Module HR nécessite configuration réelle des APIs (HelloWork, Indeed, LinkedIn)')
    console.log('     - HelloWork: API Key requise')
    console.log('     - Indeed: Publisher Account requis')
    console.log('     - LinkedIn: App avec Jobs API requise')
  } catch (error) {
    console.error('  ❌ Erreur:', error instanceof Error ? error.message : String(error))
  }
}

async function generateProcurementTestData(app: any) {
  try {
    console.log('  ℹ️ Module Achats prêt à fonctionner avec de vrais fournisseurs')
    console.log('     - Ajoutez vos fournisseurs via l\'API')
    console.log('     - Créez des demandes d\'achat réelles')
    console.log('     - Formez des pools avec de vrais participants')
  } catch (error) {
    console.error('  ❌ Erreur:', error instanceof Error ? error.message : String(error))
  }
}

async function generateMarketplaceStats(app: any) {
  try {
    console.log('  ℹ️ Statistiques marketplace non générées - utilisation réelle requise')
    console.log('     - Les téléchargements seront comptés lors des vraies installations')
    console.log('     - Les évaluations viendront des vrais utilisateurs')
    console.log('     - Utilisez l\'API pour voir les statistiques réelles')
  } catch (error) {
    console.error('  ❌ Erreur:', error instanceof Error ? error.message : String(error))
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  generateTestData().catch(console.error)
}

export { generateTestData }