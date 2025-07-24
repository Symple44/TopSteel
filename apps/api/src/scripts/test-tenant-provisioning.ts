import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { TenantProvisioningService } from '../modules/societes/services/tenant-provisioning.service'
import { SocietePlan } from '../modules/societes/entities/societe.entity'

async function testTenantProvisioning() {
  console.log('🚀 Test du provisioning de tenant\n')

  const app = await NestFactory.createApplicationContext(AppModule)
  const tenantService = app.get(TenantProvisioningService)

  try {
    // Données de test pour une nouvelle société
    const testSociete = {
      nom: 'Métallurgie ACME Test',
      code: 'ACMETEST',
      siret: '12345678901234',
      email: 'contact@acmetest.com',
      plan: SocietePlan.PROFESSIONAL,
      maxUsers: 10,
      maxSites: 2,
      configuration: {
        modules: ['production', 'stocks', 'qualite'],
        locale: 'fr-FR',
        timezone: 'Europe/Paris'
      }
    }

    console.log('📋 Données de la société de test:')
    console.log(`   - Nom: ${testSociete.nom}`)
    console.log(`   - Code: ${testSociete.code}`)
    console.log(`   - Plan: ${testSociete.plan}`)
    console.log(`   - Max utilisateurs: ${testSociete.maxUsers}`)
    console.log('')

    // Test 1: Créer une nouvelle société avec DB
    console.log('🎯 Test 1: Création d\'une société avec DB...')
    const createResult = await tenantService.createTenantWithDatabase(testSociete)
    
    console.log('📊 Résultat de la création:')
    console.log(`   - Succès: ${createResult.success}`)
    console.log(`   - Base de données: ${createResult.databaseName}`)
    console.log(`   - Message: ${createResult.message}`)
    if (createResult.error) {
      console.log(`   - Erreur: ${createResult.error}`)
    }
    console.log('')

    if (createResult.success) {
      // Attendre quelques secondes pour que tout soit bien initialisé
      console.log('⏳ Attente de 3 secondes...\n')
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Test 2: Vérifier que la société a été créée
      console.log('🔍 Test 2: Vérification de la création...')
      
      // Vérifier la base de données
      const { execSync } = require('child_process')
      try {
        const dbCheck = execSync(`psql -h localhost -U postgres -l | grep ${createResult.databaseName}`, { encoding: 'utf8' })
        console.log(`   ✅ Base de données "${createResult.databaseName}" trouvée`)
      } catch (error) {
        console.log(`   ❌ Base de données "${createResult.databaseName}" non trouvée`)
      }

      // Test 3: Tenter de créer une société avec le même code (doit échouer)
      console.log('\n🎯 Test 3: Tentative de création en doublon (doit échouer)...')
      const duplicateResult = await tenantService.createTenantWithDatabase({
        nom: 'Société doublon',
        code: testSociete.code, // Même code
      })
      
      console.log('📊 Résultat de la tentative de doublon:')
      console.log(`   - Succès: ${duplicateResult.success} (devrait être false)`)
      console.log(`   - Message: ${duplicateResult.message}`)
      if (duplicateResult.error) {
        console.log(`   - Erreur: ${duplicateResult.error}`)
      }
      console.log('')

      // Test 4: Supprimer la société de test
      console.log('🗑️ Test 4: Suppression de la société de test...')
      
      // D'abord, récupérer l'ID de la société
      const societesService = app.get('SocietesService')
      const societe = await societesService.findByCode(testSociete.code)
      
      if (societe) {
        const deleteResult = await tenantService.deleteTenantWithDatabase(societe.id)
        
        console.log('📊 Résultat de la suppression:')
        console.log(`   - Succès: ${deleteResult.success}`)
        console.log(`   - Message: ${deleteResult.message}`)
        if (deleteResult.error) {
          console.log(`   - Erreur: ${deleteResult.error}`)
        }
      }
    }

    console.log('\n🎉 Tests terminés!')

  } catch (error) {
    console.error('❌ Erreur lors des tests:', (error as Error).message)
  } finally {
    await app.close()
  }
}

// Exécuter les tests
testTenantProvisioning().catch(console.error)