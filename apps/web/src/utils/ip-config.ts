// Utilitaire pour la configuration et détection automatique IP
import { createConnection } from 'net'

export type IPVersion = 'auto' | 'ipv4' | 'ipv6'

interface IPConfig {
  host: string
  apiUrl: string
  wsUrl: string
  isIPv6: boolean
}

/**
 * Teste la connectivité vers un host:port
 */
async function testConnection(host: string, port: number, timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port })
    const timer = setTimeout(() => {
      socket.destroy()
      resolve(false)
    }, timeout)

    socket.on('connect', () => {
      clearTimeout(timer)
      socket.destroy()
      resolve(true)
    })

    socket.on('error', () => {
      clearTimeout(timer)
      resolve(false)
    })
  })
}

/**
 * Auto-détecte l'IP disponible pour l'API
 */
async function autoDetectApiHost(port: number): Promise<{ host: string; isIPv6: boolean }> {
  const ipv4Host = process.env.API_HOST_IPV4 || '127.0.0.1'
  const ipv6Host = process.env.API_HOST_IPV6 || '::1'


  // Test IPv6 en premier (plus moderne)
  try {
    const ipv6Available = await testConnection(ipv6Host, port)
    if (ipv6Available) {
      return { host: ipv6Host, isIPv6: true }
    }
  } catch (error) {
  }

  // Fallback vers IPv4
  try {
    const ipv4Available = await testConnection(ipv4Host, port)
    if (ipv4Available) {
      return { host: ipv4Host, isIPv6: false }
    }
  } catch (error) {
  }

  // Aucun n'est disponible, fallback vers IPv4 par défaut
  return { host: ipv4Host, isIPv6: false }
}

/**
 * Configure les URLs selon la version IP
 */
export async function getIPConfig(): Promise<IPConfig> {
  const ipVersion = (process.env.IP_VERSION || 'auto') as IPVersion
  const apiPort = parseInt(process.env.API_PORT || '3002')
  const ipv4Host = process.env.API_HOST_IPV4 || '127.0.0.1'
  const ipv6Host = process.env.API_HOST_IPV6 || '::1'

  let host: string
  let isIPv6: boolean

  switch (ipVersion) {
    case 'ipv4':
      host = ipv4Host
      isIPv6 = false
      break

    case 'ipv6':
      host = ipv6Host
      isIPv6 = true
      break

    case 'auto':
    default:
      const detected = await autoDetectApiHost(apiPort)
      host = detected.host
      isIPv6 = detected.isIPv6
      break
  }

  // Format l'URL selon le type d'IP
  const formattedHost = isIPv6 ? `[${host}]` : host
  const apiUrl = `http://${formattedHost}:${apiPort}`
  const wsUrl = `ws://${formattedHost}:${apiPort}`

  return {
    host,
    apiUrl,
    wsUrl,
    isIPv6
  }
}

/**
 * Obtient l'URL de l'API avec auto-détection ou configuration
 */
export async function getApiUrl(): Promise<string> {
  // En mode production ou si NEXT_PUBLIC_API_URL est défini manuellement, l'utiliser
  if (process.env.NODE_ENV === 'production' || 
      (process.env.NEXT_PUBLIC_API_URL && process.env.IP_VERSION !== 'auto')) {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
  }

  // Sinon, utiliser l'auto-détection
  const config = await getIPConfig()
  return config.apiUrl
}

/**
 * Cache pour éviter de refaire la détection à chaque appel
 */
let cachedConfig: IPConfig | null = null
let cacheExpiry = 0
const CACHE_DURATION = 30000 // 30 secondes

export async function getCachedApiUrl(): Promise<string> {
  const now = Date.now()
  
  if (!cachedConfig || now > cacheExpiry) {
    cachedConfig = await getIPConfig()
    cacheExpiry = now + CACHE_DURATION
  }

  return cachedConfig.apiUrl
}