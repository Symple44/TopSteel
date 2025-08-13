import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'

interface LocationData {
  city: string
  country: string
  countryCode: string
  latitude?: number
  longitude?: number
  timezone?: string
}

interface DeviceInfo {
  browser: string
  os: string
  device: string
  isMobile: boolean
}

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name)

  constructor(private configService: ConfigService) {}

  /**
   * Extraire les informations de géolocalisation à partir d'une adresse IP
   */
  async getLocationFromIP(ipAddress: string): Promise<LocationData | null> {
    try {
      // En développement, utiliser des données factices pour les IPs locales
      if (this.isLocalIP(ipAddress)) {
        return {
          city: 'Développement Local',
          country: 'France',
          countryCode: 'FR',
          latitude: 48.8566,
          longitude: 2.3522,
          timezone: 'Europe/Paris',
        }
      }

      // Pour la production, intégrer avec un service de géolocalisation
      // comme MaxMind, IP-API, ou ipinfo.io
      const geoApiKey = this.configService.get<string>('GEO_API_KEY')

      if (!geoApiKey) {
        this.logger.warn('Clé API de géolocalisation manquante, utilisation de données par défaut')
        return this.getDefaultLocation()
      }

      // Exemple d'intégration avec ip-api.com (gratuit pour usage non-commercial)
      const response = await fetch(
        `http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone`
      )

      if (!response.ok) {
        throw new Error(`Erreur API géolocalisation: ${response.status}`)
      }

      const data = (await response.json()) as {
        status: string
        message?: string
        country?: string
        regionName?: string
        city?: string
        lat?: number
        lon?: number
        timezone?: string
      }

      if (data.status !== 'success') {
        this.logger.warn(`Géolocalisation échouée pour IP ${ipAddress}:`, data.message)
        return this.getDefaultLocation()
      }

      return {
        city: data.city || 'Inconnue',
        country: data.country || 'Inconnu',
        countryCode: (data as any).countryCode || data.country || 'XX',
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone,
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la géolocalisation de ${ipAddress}:`, error)
      return this.getDefaultLocation()
    }
  }

  /**
   * Parser les informations de l'User-Agent
   */
  parseUserAgent(userAgent: string): DeviceInfo {
    try {
      // Détection du navigateur
      let browser = 'Inconnu'
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browser = 'Chrome'
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox'
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari'
      } else if (userAgent.includes('Edg')) {
        browser = 'Edge'
      } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        browser = 'Opera'
      }

      // Détection de l'OS
      let os = 'Inconnu'
      if (userAgent.includes('Windows NT')) {
        const version = userAgent.match(/Windows NT (\d+\.\d+)/)
        if (version) {
          const versionMap: { [key: string]: string } = {
            '10.0': 'Windows 10/11',
            '6.3': 'Windows 8.1',
            '6.2': 'Windows 8',
            '6.1': 'Windows 7',
          }
          os = versionMap[version[1]] || 'Windows'
        } else {
          os = 'Windows'
        }
      } else if (userAgent.includes('Mac OS X')) {
        os = 'macOS'
      } else if (userAgent.includes('Linux')) {
        os = 'Linux'
      } else if (userAgent.includes('Android')) {
        os = 'Android'
      } else if (
        userAgent.includes('iOS') ||
        userAgent.includes('iPhone') ||
        userAgent.includes('iPad')
      ) {
        os = 'iOS'
      }

      // Détection du type d'appareil
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      )
      let device = 'Ordinateur'

      if (userAgent.includes('iPad')) {
        device = 'Tablette (iPad)'
      } else if (userAgent.includes('iPhone')) {
        device = 'Smartphone (iPhone)'
      } else if (userAgent.includes('Android')) {
        if (userAgent.includes('Mobile')) {
          device = 'Smartphone (Android)'
        } else {
          device = 'Tablette (Android)'
        }
      } else if (isMobile) {
        device = 'Appareil mobile'
      }

      return {
        browser,
        os,
        device,
        isMobile,
      }
    } catch (error) {
      this.logger.error('Erreur lors du parsing de User-Agent:', error)
      return {
        browser: 'Inconnu',
        os: 'Inconnu',
        device: 'Inconnu',
        isMobile: false,
      }
    }
  }

  /**
   * Vérifier si une IP est locale
   */
  private isLocalIP(ip: string): boolean {
    const localPatterns = [
      /^127\./, // 127.x.x.x
      /^10\./, // 10.x.x.x
      /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.x.x - 172.31.x.x
      /^192\.168\./, // 192.168.x.x
      /^::1$/, // IPv6 localhost
      /^localhost$/i, // localhost
      /^0\.0\.0\.0$/, // 0.0.0.0
    ]

    return localPatterns.some((pattern) => pattern.test(ip))
  }

  /**
   * Obtenir des données de localisation par défaut
   */
  private getDefaultLocation(): LocationData {
    return {
      city: 'Non déterminée',
      country: 'Non déterminé',
      countryCode: 'XX',
      timezone: 'UTC',
    }
  }

  /**
   * Extraire l'adresse IP réelle de la requête
   */
  extractRealIP(request: {
    headers: Record<string, string | undefined>
    connection?: { remoteAddress?: string }
    socket?: { remoteAddress?: string }
    ip?: string
  }): string {
    // Vérifier les headers de proxy
    const forwarded = request.headers['x-forwarded-for']
    const realIP = request.headers['x-real-ip']
    const cfConnectingIP = request.headers['cf-connecting-ip'] // Cloudflare

    if (cfConnectingIP) {
      return cfConnectingIP
    }

    if (realIP) {
      return realIP
    }

    if (forwarded) {
      // X-Forwarded-For peut contenir plusieurs IPs séparées par des virgules
      return forwarded.split(',')[0].trim()
    }

    // Fallback sur l'IP de connexion
    return (
      request.connection?.remoteAddress || request.socket?.remoteAddress || request.ip || '0.0.0.0'
    )
  }

  /**
   * Créer un résumé de session pour les logs
   */
  createSessionSummary(
    location: LocationData | null,
    deviceInfo: DeviceInfo,
    ipAddress: string
  ): string {
    const locationStr = location ? `${location.city}, ${location.country}` : 'Localisation inconnue'

    return `${deviceInfo.browser} sur ${deviceInfo.os} (${deviceInfo.device}) depuis ${locationStr} [${ipAddress}]`
  }

  /**
   * Détecter des connexions suspectes
   */
  async detectSuspiciousActivity(
    _userId: string,
    newLocation: LocationData | null,
    previousSessions: unknown[]
  ): Promise<{
    isSuspicious: boolean
    reasons: string[]
    riskLevel: 'low' | 'medium' | 'high'
  }> {
    const reasons: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    if (!newLocation || previousSessions.length === 0) {
      return { isSuspicious: false, reasons, riskLevel }
    }

    // Vérifier les connexions depuis des pays différents
    const recentSessions = previousSessions.filter((session) => {
      const sessionTime = new Date((session as any).loginTime)
      const now = new Date()
      const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60)
      return hoursDiff <= 24 // Dernières 24 heures
    })

    const recentCountries = new Set(
      recentSessions.map((session) => (session as any).location?.countryCode).filter(Boolean)
    )

    if (recentCountries.size > 0 && !recentCountries.has(newLocation.countryCode)) {
      reasons.push(`Connexion depuis un nouveau pays: ${newLocation.country}`)
      riskLevel = 'medium'
    }

    // Vérifier les connexions multiples simultanées
    const activeSessions = previousSessions.filter(
      (session) => (session as any).status === 'active'
    )
    if (activeSessions.length >= 3) {
      reasons.push(`Multiples sessions actives détectées (${activeSessions.length})`)
      riskLevel = 'high'
    }

    // Vérifier les connexions en dehors des heures habituelles
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) {
      reasons.push('Connexion en dehors des heures habituelles')
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
      riskLevel,
    }
  }
}
