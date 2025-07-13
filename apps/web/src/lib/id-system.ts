/**
 * 🚀 SYSTÈME D'ID ENTERPRISE POUR ERP TOPSTEEL
 * Version robuste et évolutive avec séparation des concerns
 *
 * Fonctionnalités:
 * - SSR-Safe (pas d'erreurs hydratation)
 * - Performance optimisée avec cache
 * - Validation et parsing stricts
 * - Extensibilité pour nouveaux formats
 * - Monitoring et métriques intégrés
 * - Error boundaries intégrés
 */

import { useEffect, useState } from 'react'

// =============================================
// TYPES ET INTERFACES ENTERPRISE
// =============================================

export interface IDConfig {
  prefix?: string
  timestamp?: boolean
  checksum?: boolean
  length?: number
  format?: 'uuid' | 'nanoid' | 'base58' | 'hex' | 'base36'
  env?: 'production' | 'development' | 'test'
}

export interface ParsedID {
  prefix?: string
  timestamp?: number
  sequence?: number
  checksum?: string
  environment?: string
  nodeId?: string
  raw: string
  isValid: boolean
  metadata: {
    generatedAt: Date
    format: string
    version: string
  }
}

export interface IDMetrics {
  generated: number
  errors: number
  cacheHits: number
  cacheMisses: number
  performanceMs: number[]
}

// =============================================
// CONSTANTES MÉTIER ERP
// =============================================

export const ID_PREFIXES = {
  // Gestion commerciale
  PROJET: 'PRJ',
  DEVIS: 'DEV',
  FACTURE: 'FAC',
  COMMANDE: 'CMD',

  // Relations clients
  CLIENT: 'CLT',
  FOURNISSEUR: 'FOU',
  CONTACT: 'CNT',

  // Production et stock
  STOCK: 'STK',
  PRODUCTION: 'PRD',
  OPERATION: 'OPR',
  PLANNING: 'PLN',

  // Système
  USER: 'USR',
  SESSION: 'SES',
  UPLOAD: 'UPL',
  RAPPORT: 'RPT',
  TACHE: 'TSK',
  TOAST: 'TST',

  // Qualité et conformité
  CONTROLE: 'CTL',
  CERTIFICAT: 'CRT',
  AUDIT: 'AUD',
} as const

export const ID_FORMATS = {
  uuid: {
    length: 36,
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },
  nanoid: { length: 12, pattern: /^[A-Za-z0-9_-]+$/ },
  base58: {
    length: 10,
    pattern: /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/,
  },
  hex: { length: 16, pattern: /^[0-9a-f]+$/i },
  base36: { length: 8, pattern: /^[0-9a-z]+$/i },
} as const

// =============================================
// CACHE ET PERFORMANCE
// =============================================

// ID Cache as module-level functions
const idCache = new Map<string, ParsedID>()
const maxIdCacheSize = 1000
const idCacheMetrics: IDMetrics = {
  generated: 0,
  errors: 0,
  cacheHits: 0,
  cacheMisses: 0,
  performanceMs: [],
}

function getFromIdCache(key: string): ParsedID | undefined {
  const result = idCache.get(key)

  if (result) {
    idCacheMetrics.cacheHits++

    return result
  }
  idCacheMetrics.cacheMisses++

  return undefined
}

function setInIdCache(key: string, value: ParsedID): void {
  // Fix TypeScript strict: nettoyage du cache si plein
  if (idCache.size >= maxIdCacheSize) {
    // Méthode plus sûre : convertir en array pour éviter undefined
    const keys = Array.from(idCache.keys())

    if (keys.length > 0) {
      idCache.delete(keys[0]) // Supprimer la première (plus ancienne) clé
    }
  }
  idCache.set(key, value)
}

function getIdCacheMetrics(): IDMetrics {
  return { ...idCacheMetrics }
}

function recordIdGeneration(timeMs: number): void {
  idCacheMetrics.generated++
  idCacheMetrics.performanceMs.push(timeMs)

  // Garder seulement les 100 dernières mesures
  if (idCacheMetrics.performanceMs.length > 100) {
    idCacheMetrics.performanceMs = idCacheMetrics.performanceMs.slice(-100)
  }
}

function recordIdError(): void {
  idCacheMetrics.errors++
}

function clearIdCache(): void {
  idCache.clear()
  idCacheMetrics.generated = 0
  idCacheMetrics.errors = 0
  idCacheMetrics.cacheHits = 0
  idCacheMetrics.cacheMisses = 0
  idCacheMetrics.performanceMs = []
}

// =============================================
// GÉNÉRATEUR D'IDS ENTERPRISE
// =============================================

class IDGenerator {
  private static counter = 0
  private static nodeId: string
  private static isClient = typeof window !== 'undefined'
  private static environment: 'production' | 'development' | 'test'

  static {
    // Détection environnement
    IDGenerator.environment =
      (process.env.NODE_ENV as 'production' | 'development' | 'test') || 'development'

    // ID de nœud stable
    if (IDGenerator.isClient) {
      IDGenerator.nodeId = IDGenerator.initializeClientNodeId()
    } else {
      IDGenerator.nodeId = IDGenerator.initializeServerNodeId()
    }
  }

  private static initializeClientNodeId(): string {
    try {
      let nodeId = localStorage.getItem('topsteel_node_id')

      if (!nodeId || nodeId.length < 4) {
        nodeId = IDGenerator.generateSecureNodeId()
        localStorage.setItem('topsteel_node_id', nodeId)
      }

      return nodeId
    } catch (error) {
      console.warn('Cannot access localStorage, using fallback nodeId')

      return IDGenerator.generateFallbackNodeId()
    }
  }

  private static initializeServerNodeId(): string {
    // Utiliser variables d'environnement pour l'ID serveur
    const instanceId = process.env.INSTANCE_ID || process.env.HOSTNAME || 'server'

    return `${IDGenerator.environment.slice(0, 3)}-${instanceId.slice(0, 4)}`
  }

  private static generateSecureNodeId(): string {
    if (crypto.randomUUID) {
      return crypto.randomUUID().slice(0, 8)
    }

    if (crypto.getRandomValues) {
      const array = new Uint8Array(4)

      crypto.getRandomValues(array)

      return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
    }

    return IDGenerator.generateFallbackNodeId()
  }

  private static generateFallbackNodeId(): string {
    return Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 6)
  }

  /**
   * UUID V4 avec fallback robuste
   */
  static uuid(): string {
    const startTime = performance.now()

    try {
      let result: string

      if (IDGenerator.isClient && crypto.randomUUID) {
        result = crypto.randomUUID()
      } else if (IDGenerator.isClient) {
        result = IDGenerator.generateFallbackUUID()
      } else {
        result = IDGenerator.generateServerUUID()
      }

      recordIdGeneration(performance.now() - startTime)

      return result
    } catch (error) {
      recordIdError()
      console.error('UUID generation failed:', error)

      return IDGenerator.generateFallbackUUID()
    }
  }

  private static generateServerUUID(): string {
    // UUID déterministe pour SSR
    const timestamp = Date.now()
    const counter = (++IDGenerator.counter).toString(16).padStart(4, '0')
    const nodeId = IDGenerator.nodeId.padEnd(12, '0').slice(0, 12)

    return `${timestamp.toString(16).padStart(8, '0')}-0000-4000-8000-${counter}${nodeId}`
  }

  private static generateFallbackUUID(): string {
    // RFC 4122 version 4 compliant fallback

    const hexDigits = '0123456789abcdef'
    let uuid = ''

    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-'
      } else if (i === 14) {
        uuid += '4' // Version 4
      } else if (i === 19) {
        uuid += hexDigits[(Math.random() * 4) | (0 + 8)] // Variant 10
      } else {
        uuid += hexDigits[(Math.random() * 16) | 0]
      }
    }

    return uuid
  }

  /**
   * NanoID optimisé pour performance
   */
  static nanoid(length = 12, alphabet?: string): string {
    const startTime = performance.now()

    // Fix: Alphabet par défaut si undefined
    const defaultAlphabet =
      alphabet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    try {
      let result: string

      if (IDGenerator.isClient) {
        // Client : essayer crypto, sinon fallback
        try {
          // Test direct sans condition
          const testArray = new Uint8Array(1)

          crypto.getRandomValues(testArray)
          result = IDGenerator.generateSecureNanoId(length, defaultAlphabet)
        } catch {
          // Si crypto échoue, utiliser fallback
          result = IDGenerator.generateFallbackNanoId(length, defaultAlphabet)
        }
      } else {
        // Serveur : utiliser Node.js crypto ou fallback
        result = IDGenerator.generateServerNanoId(length, defaultAlphabet)
      }

      recordIdGeneration(performance.now() - startTime)

      return result
    } catch (error) {
      console.warn('NanoID generation failed, using fallback:', error)
      recordIdError()

      return IDGenerator.generateFallbackNanoId(length, defaultAlphabet)
    }
  }

  private static isSecureCryptoAvailable(): boolean {
    try {
      if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
        return false
      }

      // Test rapide pour vérifier que crypto.getRandomValues fonctionne
      const testArray = new Uint8Array(1)

      crypto.getRandomValues(testArray)

      return true
    } catch (error) {
      console.warn('Crypto.getRandomValues not available:', error)

      return false
    }
  }

  private static generateServerNanoId(length: number, alphabet: string): string {
    const timestamp = Date.now().toString(36)
    const counter = (++IDGenerator.counter).toString(36).padStart(3, '0')
    const combined = timestamp + counter + IDGenerator.nodeId

    return combined.slice(0, length)
  }

  private static generateSecureNanoId(length: number, alphabet: string): string {
    const bytes = new Uint8Array(length)

    crypto.getRandomValues(bytes)

    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
  }

  private static generateFallbackNanoId(length: number, alphabet: string): string {
    let result = ''

    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)]
    }

    return result
  }

  /**
   * ID métier avec configuration avancée
   */
  static business(prefix: keyof typeof ID_PREFIXES, config: IDConfig = {}): string {
    const startTime = performance.now()

    try {
      const prefixStr = ID_PREFIXES[prefix]
      const {
        timestamp = false,
        checksum = false,
        format = 'nanoid',
        length = 12,
        env = IDGenerator.environment,
      } = config

      let mainId: string

      switch (format) {
        case 'uuid':
          mainId = IDGenerator.uuid()
          break
        case 'base58':
          mainId = IDGenerator.generateBase58(length)
          break
        case 'hex':
          mainId = IDGenerator.generateHex(length)
          break
        case 'base36':
          mainId = IDGenerator.generateBase36(length)
          break
        default:
          mainId = IDGenerator.nanoid(length)
      }

      let result = prefixStr

      if (env !== 'production') {
        result += `-${env.slice(0, 3).toUpperCase()}`
      }

      if (timestamp) {
        result += `-${Date.now().toString(36)}`
      }

      result += `-${mainId}`

      if (checksum) {
        const checksumValue = IDGenerator.calculateChecksum(result)

        result += `-${checksumValue}`
      }

      recordIdGeneration(performance.now() - startTime)

      return result
    } catch (error) {
      recordIdError()
      console.error('Business ID generation failed:', error)

      return `${ID_PREFIXES[prefix]}-FALLBACK-${Date.now()}`
    }
  }

  private static generateBase58(length: number): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    let result = ''

    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)]
    }

    return result
  }

  private static generateHex(length: number): string {
    const alphabet = '0123456789abcdef'
    let result = ''

    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)]
    }

    return result
  }

  private static generateBase36(length: number): string {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
    let result = ''

    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)]
    }

    return result
  }

  private static calculateChecksum(input: string): string {
    let hash = 0

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)

      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36).slice(0, 4)
  }
}

// =============================================
// PARSER ET VALIDATION
// =============================================

class IDParser {
  static parse(id: string): ParsedID {
    const cached = getFromIdCache(id)

    if (cached) return cached

    const startTime = performance.now()

    try {
      const result: ParsedID = {
        raw: id,
        isValid: false,
        metadata: {
          generatedAt: new Date(),
          format: 'unknown',
          version: '2.0.0',
        },
      }

      // Validation format basique
      if (!id || typeof id !== 'string' || id.length < 3) {
        setInIdCache(id, result)

        return result
      }

      // Parse prefix
      const parts = id.split('-')

      if (parts.length >= 2) {
        const potentialPrefix = parts[0]
        const prefixKeys = Object.keys(ID_PREFIXES) as Array<keyof typeof ID_PREFIXES>
        const matchingPrefix = prefixKeys.find((key) => ID_PREFIXES[key] === potentialPrefix)

        if (matchingPrefix) {
          result.prefix = potentialPrefix
          result.isValid = true

          // Parse environment
          if (parts.length >= 3 && ['DEV', 'TEST', 'PROD'].includes(parts[1])) {
            result.environment = parts[1].toLowerCase() as 'development' | 'test' | 'production'
          }

          // Parse timestamp si présent
          if (parts.length >= 3) {
            const timestampPart = parts[result.environment ? 2 : 1]

            if (timestampPart && /^[0-9a-z]+$/.test(timestampPart)) {
              const timestamp = Number.parseInt(timestampPart, 36)

              if (!Number.isNaN(timestamp) && timestamp > 1000000) {
                result.timestamp = timestamp
              }
            }
          }

          // Déterminer le format
          const mainPart = parts[parts.length - (result.checksum ? 2 : 1)]

          if (mainPart) {
            for (const [format, config] of Object.entries(ID_FORMATS)) {
              if (config.pattern.test(mainPart)) {
                result.metadata.format = format
                break
              }
            }
          }
        }
      }

      // Validation UUID direct
      if (!result.isValid && ID_FORMATS.uuid.pattern.test(id)) {
        result.isValid = true
        result.metadata.format = 'uuid'
      }

      recordIdGeneration(performance.now() - startTime)
      setInIdCache(id, result)

      return result
    } catch (error) {
      recordIdError()
      console.error('ID parsing failed:', error)

      const fallbackResult: ParsedID = {
        raw: id,
        isValid: false,
        metadata: {
          generatedAt: new Date(),
          format: 'error',
          version: '2.0.0',
        },
      }

      setInIdCache(id, fallbackResult)

      return fallbackResult
    }
  }

  static validate(id: string, expectedPrefix?: keyof typeof ID_PREFIXES): boolean {
    try {
      const parsed = IDParser.parse(id)

      if (!parsed.isValid) return false

      if (expectedPrefix && parsed.prefix !== ID_PREFIXES[expectedPrefix]) {
        return false
      }

      return true
    } catch (error) {
      recordIdError()
      console.error('ID validation failed:', error)

      return false
    }
  }
}

// =============================================
// API PUBLIQUE ENTERPRISE
// =============================================

export const ID = {
  // Générateurs principaux
  uuid: () => IDGenerator.uuid(),
  nano: (length?: number) => IDGenerator.nanoid(length),

  // Générateurs métier
  projet: (config?: Partial<IDConfig>) =>
    IDGenerator.business('PROJET', { timestamp: true, ...config }),
  devis: (config?: Partial<IDConfig>) =>
    IDGenerator.business('DEVIS', { timestamp: true, checksum: true, ...config }),
  facture: (config?: Partial<IDConfig>) =>
    IDGenerator.business('FACTURE', { timestamp: true, checksum: true, ...config }),
  client: (config?: Partial<IDConfig>) =>
    IDGenerator.business('CLIENT', { format: 'base58', ...config }),
  commande: (config?: Partial<IDConfig>) =>
    IDGenerator.business('COMMANDE', { timestamp: true, ...config }),
  stock: (config?: Partial<IDConfig>) =>
    IDGenerator.business('STOCK', { format: 'hex', ...config }),
  production: (config?: Partial<IDConfig>) =>
    IDGenerator.business('PRODUCTION', { timestamp: true, ...config }),
  user: (config?: Partial<IDConfig>) => IDGenerator.business('USER', { format: 'uuid', ...config }),
  session: (config?: Partial<IDConfig>) =>
    IDGenerator.business('SESSION', { format: 'uuid', ...config }),
  toast: (config?: Partial<IDConfig>) =>
    IDGenerator.business('TOAST', { format: 'nanoid', length: 8, ...config }),

  // Utilitaires
  parse: (id: string) => IDParser.parse(id),
  validate: (id: string, prefix?: keyof typeof ID_PREFIXES) => IDParser.validate(id, prefix),

  // Métriques et cache
  getMetrics: () => getIdCacheMetrics(),
  clearCache: () => clearIdCache(),

  // Générateur personnalisé
  custom: (prefix: keyof typeof ID_PREFIXES, config?: IDConfig) =>
    IDGenerator.business(prefix, config),

  // Legacy (compatibilité)
  generate: () => IDGenerator.nanoid(),
  simple: () => IDGenerator.nanoid(8),
}

// =============================================
// HOOK REACT SSR-SAFE
// =============================================

/**
 * Hook React pour génération d'ID côté client
 * Évite les erreurs d'hydratation SSR
 */
export function useClientId(prefix?: keyof typeof ID_PREFIXES, config?: Partial<IDConfig>): string {
  const [id, setId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const newId = prefix ? IDGenerator.business(prefix, config) : IDGenerator.nanoid()

      setId(newId)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      setError(errorMessage)
      console.error('useClientId failed:', errorMessage)

      // Fallback ID en cas d'erreur
      setId(`fallback-${Date.now()}`)
    }
  }, [prefix, config])

  // Log de l'erreur pour monitoring
  useEffect(() => {
    if (error) {
      recordIdError()
    }
  }, [error])

  return id
}

/**
 * Hook pour accéder aux métriques d'ID
 */
export function useIDMetrics(): IDMetrics & {
  averageGenerationTime: number
  errorRate: number
  cacheHitRate: number
} {
  const [metrics, setMetrics] = useState<IDMetrics>(() => getIdCacheMetrics())

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getIdCacheMetrics())
    }, 5000) // Mise à jour toutes les 5 secondes

    return () => clearInterval(interval)
  }, [])

  const averageGenerationTime =
    metrics.performanceMs.length > 0
      ? metrics.performanceMs.reduce((a, b) => a + b, 0) / metrics.performanceMs.length
      : 0

  const errorRate = metrics.generated > 0 ? (metrics.errors / metrics.generated) * 100 : 0

  const totalRequests = metrics.cacheHits + metrics.cacheMisses
  const cacheHitRate = totalRequests > 0 ? (metrics.cacheHits / totalRequests) * 100 : 0

  return {
    ...metrics,
    averageGenerationTime: Math.round(averageGenerationTime * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100,
    cacheHitRate: Math.round(cacheHitRate * 100) / 100,
  }
}

// Export par défaut pour compatibilité
export default ID
