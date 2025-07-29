import { BackendHealthService } from './backend-health'
import { callClientApi } from '@/utils/backend-api'

export async function logStartupInfo() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'Non configurée'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'TopSteel ERP'
  
  console.log('\n')
  console.log('🏭 ===============================================')
  console.log(`🏭           ${appName} - FRONTEND`)
  console.log('🏭 ===============================================')
  console.log(`🚀 Frontend démarré sur: ${appUrl}`)
  console.log(`🔗 Backend API URL: ${apiUrl}`)
  console.log(`🌟 Environnement: ${process.env.NODE_ENV || 'development'}`)
  
  // Vérifier la connexion au backend
  if (typeof window === 'undefined') {
    // Côté serveur
    console.log('📡 Vérification de la connexion au backend...')
    
    try {
      const response = await callClientApi('config', {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      })
      
      if (response.ok) {
        console.log(`📍 Backend opérationnel sur: ${apiUrl}`)
      } else {
        console.log(`⚠️  Backend retourne une erreur ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Backend inaccessible!')
      console.error(`   URL tentée: config`)
      console.error(`   Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      console.log('\n💡 Vérifiez que:')
      console.log('   1. Le serveur backend est démarré (npm run dev dans apps/api)')
      console.log('   2. Le port est correct dans .env.local')
      console.log('   3. NEXT_PUBLIC_API_URL est bien configurée')
    }
  }
  
  console.log('\n📋 Configuration:')
  console.log(`   • API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'Non définie'}`)
  console.log(`   • APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Non définie'}`)
  console.log(`   • APP_NAME: ${process.env.NEXT_PUBLIC_APP_NAME || 'Non défini'}`)
  
  console.log('\n🔐 Authentification:')
  console.log('   • Email: admin@topsteel.tech')
  console.log('   • Mot de passe: TopSteel44!')
  console.log('   • Rôle: ADMIN')
  
  console.log('🏭 ===============================================\n')
}

// Hook pour utiliser côté client
export function useStartupLogger() {
  if (typeof window !== 'undefined') {
    const service = BackendHealthService.getInstance()
    service.subscribe((status) => {
      if (status.lastCheck.getTime() > Date.now() - 5000) { // Log seulement les 5 premières secondes
        console.log(`[Backend Health] ${status.status}: ${status.message}`)
      }
    })
  }
}