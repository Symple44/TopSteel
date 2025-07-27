import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { ModuleRegistryService } from '../modules/marketplace/services/module-registry.service'
import { MarketplaceService } from '../modules/marketplace/services/marketplace.service'

async function testModuleOperations() {
  console.log('🧪 Test des opérations de modules Marketplace...')

  const app = await NestFactory.createApplicationContext(AppModule)
  
  try {
    const moduleRegistryService = app.get(ModuleRegistryService)
    const marketplaceService = app.get(MarketplaceService)

    console.log('\n📋 Modules enregistrés:')
    const registeredModules = moduleRegistryService.getRegisteredModules()
    for (const [key, registration] of registeredModules.entries()) {
      console.log(`  - ${key}: ${registration.moduleInfo.displayName}`)
    }

    // Test avec le tenant de test
    const testTenantId = 'test-tenant-123'
    const testUserId = 'test-user-admin'

    // Récupérer les modules disponibles
    const availableModules = await marketplaceService.findAllModules()
    console.log(`\n🏪 ${availableModules.length} modules disponibles dans la marketplace`)

    for (const module of availableModules) {
      console.log(`\n🔧 Test du module: ${module.displayName}`)
      
      try {
        // 1. Vérifier si le module peut être installé
        const validation = await moduleRegistryService.validateModuleInstallation(
          module.moduleKey, 
          testTenantId
        )
        
        console.log(`  📋 Validation d'installation: ${validation.canInstall ? '✅' : '❌'}`)
        if (!validation.canInstall) {
          console.log(`     Raisons: ${validation.reasons.join(', ')}`)
          continue
        }

        // 2. Tester l'installation
        console.log('  📦 Installation du module...')
        const installResult = await marketplaceService.installModule({
          tenantId: testTenantId,
          moduleId: module.id,
          configuration: {
            environment: 'test',
            autoStart: true,
            features: module.metadata?.supportedFeatures?.slice(0, 2) || []
          }
        }, testUserId)

        if (installResult.success) {
          console.log('  ✅ Installation réussie')
          console.log(`     ID d'installation: ${installResult.installationId}`)
        } else {
          console.log('  ❌ Échec d\'installation')
          console.log(`     Erreurs: ${installResult.errors?.join(', ')}`)
          continue
        }

        // 3. Vérifier que le module is installé
        const isInstalled = await marketplaceService.isModuleInstalled(testTenantId, module.id)
        console.log(`  🔍 Module installé: ${isInstalled ? '✅' : '❌'}`)

        // 4. Récupérer les modules installés
        const installedModules = await marketplaceService.getInstalledModules(testTenantId)
        const ourModule = installedModules.find(inst => inst.moduleId === module.id)
        if (ourModule) {
          console.log(`  📊 Statut: ${ourModule.status}`)
          console.log(`  📅 Installé le: ${ourModule.installedAt?.toISOString()}`)
        }

        // 5. Ajouter une évaluation de test
        console.log('  ⭐ Ajout d\'une évaluation...')
        try {
          await marketplaceService.rateModule(
            module.id,
            `${testUserId}-${Date.now()}`,
            5,
            'Module testé avec succès - fonctionne parfaitement!'
          )
          console.log('  ✅ Évaluation ajoutée')
        } catch (error) {
          console.log('  ⚠️ Évaluation déjà existante ou erreur')
        }

        // 6. Tester la désinstallation
        console.log('  🗑️ Désinstallation du module...')
        const uninstallResult = await marketplaceService.uninstallModule(
          testTenantId,
          module.id,
          testUserId
        )

        if (uninstallResult.success) {
          console.log('  ✅ Désinstallation réussie')
        } else {
          console.log('  ❌ Échec de désinstallation')
          console.log(`     Message: ${uninstallResult.message}`)
        }

        // 7. Vérifier que le module n'est plus installé
        const isStillInstalled = await marketplaceService.isModuleInstalled(testTenantId, module.id)
        console.log(`  🔍 Module encore installé: ${isStillInstalled ? '❌' : '✅'}`)

      } catch (error) {
        console.log(`  ❌ Erreur lors du test: ${error.message}`)
      }
    }

    // Test des statistiques
    console.log('\n📊 Test des statistiques:')
    const stats = moduleRegistryService.getRegistryStats()
    console.log(`  - Total modules: ${stats.totalModules}`)
    console.log(`  - Catégories: ${Object.keys(stats.categoryCounts).join(', ')}`)
    console.log(`  - Types de tarification: ${Object.keys(stats.pricingTypes).join(', ')}`)
    console.log(`  - Éditeurs: ${stats.publishers.join(', ')}`)

    // Test de recherche par catégorie
    console.log('\n🔍 Test de recherche par catégorie:')
    const hrModules = moduleRegistryService.getModulesByCategory('HR')
    console.log(`  - Modules RH: ${hrModules.length}`)
    
    const procurementModules = moduleRegistryService.getModulesByCategory('PROCUREMENT')
    console.log(`  - Modules Achats: ${procurementModules.length}`)

    console.log('\n✅ Tests terminés avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
  } finally {
    await app.close()
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  testModuleOperations().catch(console.error)
}

export { testModuleOperations }