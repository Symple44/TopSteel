// Debug spécifique pour les préférences de menu

import { callClientApi } from '@/utils/backend-api'

export async function debugMenuPreferences() {
  
  const menuEndpoints = [
    'user/menu-preferences/custom-menu',
    'admin/menu-raw/configurations/active'
  ]
  
  for (const endpoint of menuEndpoints) {
    
    try {
      // Test avec différentes configurations
      const configurations = [
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        { method: 'GET', headers: { 'Accept': 'application/json' } },
        { method: 'GET' }
      ]
      
      for (let i = 0; i < configurations.length; i++) {
        const config = configurations[i]
        
        try {
          const response = await callClientApi(endpoint, config)
          const data = await response.json()
          
          
          // Vérifier la structure des données
          if (data && typeof data === 'object') {
            if (data.data) {
            }
          }
        } catch (error: any) {
          
          if (error?.message?.includes('CLIENT')) {
          }
        }
      }
    } catch (error: any) {
    }
    
    console.log('---')
  }
  
}

// Test automatique
if (typeof window !== 'undefined') {
  setTimeout(debugMenuPreferences, 3000)
}