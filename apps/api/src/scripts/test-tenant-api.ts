// import fetch from 'node-fetch'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(__dirname, '../../../.env') })

interface TenantProvisioningResult {
  success: boolean
  databaseName: string
  message: string
  error?: string
}

async function testTenantAPI() {
  const baseUrl = 'http://localhost:3006/api'
  
  console.log('🚀 Test de l\'API de provisioning de tenant\n')
  console.log(`URL de base: ${baseUrl}`)
  console.log('⚠️  Assurez-vous que l\'application est démarrée (npm run dev)\n')

  try {
    // Données de test
    const testTenant = {
      nom: 'TopSteel Recette',
      code: 'TSR',
      email: 'admin@topsteelrecette.com',
      plan: 'PROFESSIONAL',
      maxUsers: 10,
      maxSites: 3,
      configuration: {
        modules: ['production', 'stocks'],
        locale: 'fr-FR',
        timezone: 'Europe/Paris'
      }
    }

    console.log('📋 Données du tenant de test:')
    console.log(JSON.stringify(testTenant, null, 2))
    console.log('')

    // Test 1: Créer un tenant
    console.log('🎯 Test 1: Création d\'un tenant via API...')
    
    const createResponse = await globalThis.fetch(`${baseUrl}/societes/provision-tenant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTenant)
    })

    if (!createResponse.ok) {
      console.error(`❌ Erreur HTTP ${createResponse.status}: ${createResponse.statusText}`)
      const errorText = await createResponse.text()
      console.error('Détails:', errorText)
      return
    }

    const createResult: TenantProvisioningResult = await createResponse.json() as TenantProvisioningResult
    
    console.log('📊 Résultat de la création:')
    console.log(`   - Succès: ${createResult.success}`)
    console.log(`   - Base de données: ${createResult.databaseName}`)
    console.log(`   - Message: ${createResult.message}`)
    if (createResult.error) {
      console.log(`   - Erreur: ${createResult.error}`)
    }
    console.log('')

    if (createResult.success) {
      // Test 2: Lister les sociétés
      console.log('🔍 Test 2: Vérification via liste des sociétés...')
      
      const listResponse = await globalThis.fetch(`${baseUrl}/societes`)
      if (listResponse.ok) {
        const societes = await listResponse.json() as any[]
        const createdSociete = societes.find((s: any) => s.code === testTenant.code)
        
        if (createdSociete) {
          console.log(`   ✅ Société trouvée: ${createdSociete.nom}`)
          console.log(`   - ID: ${createdSociete.id}`)
          console.log(`   - Status: ${createdSociete.status}`)
          console.log(`   - Database: ${createdSociete.databaseName}`)
        } else {
          console.log(`   ❌ Société avec le code "${testTenant.code}" non trouvée`)
        }
      }
      console.log('')

      // Test 3: Tenter de créer un doublon
      console.log('🎯 Test 3: Tentative de création en doublon...')
      
      const duplicateResponse = await globalThis.fetch(`${baseUrl}/societes/provision-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: 'Société doublon',
          code: testTenant.code, // Même code
        })
      })

      if (duplicateResponse.ok) {
        const duplicateResult: TenantProvisioningResult = await duplicateResponse.json() as TenantProvisioningResult
        console.log('📊 Résultat de la tentative de doublon:')
        console.log(`   - Succès: ${duplicateResult.success} (devrait être false)`)
        console.log(`   - Message: ${duplicateResult.message}`)
        if (duplicateResult.error) {
          console.log(`   - Erreur: ${duplicateResult.error}`)
        }
      } else {
        console.log(`   ✅ Requête rejetée comme attendu: ${duplicateResponse.status}`)
      }
    }

    console.log('\n🎉 Tests terminés!')
    console.log('\n💡 Pour nettoyer, utilisez l\'endpoint DELETE /societes/{id}/destroy-tenant')

  } catch (error) {
    console.error('❌ Erreur lors des tests:', (error as Error).message)
  }
}

// Attendre un peu avant de commencer
setTimeout(() => {
  testTenantAPI().catch(console.error)
}, 1000)