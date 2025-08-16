#!/usr/bin/env ts-node

/**
 * Test du processus de login avec l'API réelle
 * Simule le processus réel de connexion et affiche les sociétés retournées
 */

import axios from 'axios'

const API_URL = process.env.API_URL || 'http://localhost:3002'

async function testRealAPILogin() {
  console.log('🔐 TEST DU LOGIN AVEC L\'API RÉELLE')
  console.log('='.repeat(80))
  console.log(`\n📡 API URL: ${API_URL}`)
  console.log()

  try {
    // Étape 1: Login initial
    console.log('📋 ÉTAPE 1: Login Initial')
    console.log('-'.repeat(40))
    
    const loginData = {
      login: 'admin@topsteel.com',  // Utilisateur de test
      password: 'Admin123!@#'        // Mot de passe par défaut
    }
    
    console.log(`📧 Email: ${loginData.login}`)
    console.log('🔑 Tentative de connexion...\n')

    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData)
      
      if (loginResponse.data.requiresMFA) {
        console.log('⚠️  MFA requis - non géré dans ce test')
        return
      }

      const { user, societes, requiresSocieteSelection, accessToken } = loginResponse.data

      console.log('✅ Login réussi !')
      console.log('\n👤 Utilisateur:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Nom: ${user.nom || 'N/A'}`)
      console.log(`   Prénom: ${user.prenom || 'N/A'}`)
      console.log(`   Rôle global: ${user.role}`)

      console.log('\n🏢 SOCIÉTÉS DISPONIBLES:')
      console.log('-'.repeat(40))
      
      if (societes && societes.length > 0) {
        console.log(`Nombre de sociétés: ${societes.length}`)
        console.log()
        
        societes.forEach((societe: any, index: number) => {
          console.log(`${index + 1}. ${societe.nom} (${societe.code})`)
          console.log(`   ID: ${societe.id}`)
          console.log(`   Rôle: ${societe.role}`)
          console.log(`   Par défaut: ${societe.isDefault ? 'Oui' : 'Non'}`)
          console.log(`   Permissions: ${societe.permissions?.join(', ') || 'Aucune'}`)
          if (societe.sites && societe.sites.length > 0) {
            console.log(`   Sites: ${societe.sites.map((s: any) => s.nom).join(', ')}`)
          }
          console.log()
        })
      } else {
        console.log('⚠️  Aucune société disponible')
      }

      console.log(`Sélection de société requise: ${requiresSocieteSelection ? 'Oui' : 'Non'}`)

      // Si une seule société ou société par défaut, tester la connexion à cette société
      if (societes && societes.length > 0) {
        const defaultSociete = societes.find((s: any) => s.isDefault) || societes[0]
        
        console.log('\n📋 ÉTAPE 2: Sélection de Société')
        console.log('-'.repeat(40))
        console.log(`🏢 Sélection de: ${defaultSociete.nom}`)
        
        try {
          const societeResponse = await axios.post(
            `${API_URL}/auth/login-societe/${defaultSociete.id}`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          )

          console.log('✅ Connexion à la société réussie !')
          console.log('\n📊 Détails de la session:')
          console.log(`   Session ID: ${societeResponse.data.sessionId}`)
          console.log(`   Token expiré dans: ${societeResponse.data.tokens.expiresIn} secondes`)
          
          const userInfo = societeResponse.data.user
          console.log('\n👤 Contexte utilisateur:')
          console.log(`   Email: ${userInfo.email}`)
          console.log(`   Rôle dans la société: ${userInfo.role}`)
          console.log(`   Société: ${userInfo.societe.nom} (${userInfo.societe.code})`)
          console.log(`   Database: ${userInfo.societe.databaseName}`)
          console.log(`   Permissions: ${userInfo.permissions?.slice(0, 3).join(', ')}...`)

        } catch (error: any) {
          console.log('❌ Erreur lors de la sélection de société:', error.response?.data?.message || error.message)
        }
      }

    } catch (error: any) {
      if (error.response) {
        console.log('❌ Erreur de connexion:')
        console.log(`   Status: ${error.response.status}`)
        console.log(`   Message: ${error.response.data?.message || 'Erreur inconnue'}`)
      } else if (error.request) {
        console.log('❌ Impossible de contacter l\'API')
        console.log('   Vérifiez que l\'API est démarrée sur le port 3002')
      } else {
        console.log('❌ Erreur:', error.message)
      }
    }

  } catch (error: any) {
    console.error('❌ Erreur fatale:', error.message)
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 FIN DU TEST')
  console.log('='.repeat(80))
}

// Exécuter le test
if (require.main === module) {
  testRealAPILogin().catch(error => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
}

export { testRealAPILogin }