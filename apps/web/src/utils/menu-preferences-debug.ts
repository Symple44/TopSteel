// Debug spécifique pour les préférences de menu

import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function debugMenuPreferences() {
  
  const menuEndpoints = [
    '/api/user/menu-preferences/custom-menu',
    '/api/admin/menu-raw/configurations/active',
    'http://127.0.0.1:3002/api/v1/user/menu-preferences/custom-menu',
    'http://127.0.0.1:3002/api/v1/admin/menu-raw/configurations/active'
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
          const response = await safeFetch(endpoint, config)
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