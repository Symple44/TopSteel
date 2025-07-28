// Initialisation de la configuration IP au démarrage
import { getIPConfig } from './ip-config'

let configInitialized = false

export async function initIPConfig() {
  if (configInitialized) return

  try {
    const config = await getIPConfig()
    
    // Mettre à jour les variables d'environnement dynamiquement
    if (process.env.IP_VERSION === 'auto') {
      process.env.NEXT_PUBLIC_API_URL = config.apiUrl
      process.env.INTERNAL_API_URL = config.apiUrl
      process.env.NEXT_PUBLIC_WS_URL = config.wsUrl
      
    }

    configInitialized = true
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation IP:', error)
  }
}

// Auto-initialisation si ce fichier est importé
if (typeof window === 'undefined') { // Côté serveur uniquement
  initIPConfig()
}