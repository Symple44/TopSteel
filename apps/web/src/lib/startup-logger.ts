// import { BackendHealthService } from './backend-health' // Module not found
import { callClientApi } from '../utils/backend-api'

export async function logStartupInfo() {
  const _apiUrl = process?.env?.NEXT_PUBLIC_API_URL || 'Non configurée'
  const _appUrl = process?.env?.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
  const _appName = process?.env?.NEXT_PUBLIC_APP_NAME || 'TopSteel ERP'

  // Vérifier la connexion au backend
  if (typeof window === 'undefined') {
    try {
      const response = await callClientApi('config', {
        method: 'GET',
        signal: AbortSignal?.timeout(3000),
      })

      if (response?.ok) {
      } else {
      }
    } catch (_error) {}
  }
}

// Hook pour utiliser côté client
export function useStartupLogger() {
  if (typeof window !== 'undefined') {
  }
}
