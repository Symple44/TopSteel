// apps/web/src/lib/id-system.ts - SYSTÈME D'ID ENTERPRISE
/**
 * 🚀 SYSTÈME D'ID ENTERPRISE POUR ERP TOPSTEEL
 * 
 * Fonctionnalités:
 * - SSR-Safe (pas d'erreurs hydratation)
 * - Crypto.randomUUID() quand disponible  
 * - IDs déterministes pour SSR
 * - IDs avec préfixes métier
 * - Validation et parsing
 * - Performance optimisée
 */

// ✅ TYPES ENTERPRISE
export interface IDConfig {
  prefix?: string
  timestamp?: boolean
  checksum?: boolean
  length?: number
  format?: 'uuid' | 'nanoid' | 'base58' | 'hex'
}

export interface ParsedID {
  prefix?: string
  timestamp?: number
  sequence?: number
  checksum?: string
  raw: string
  isValid: boolean
}

// ✅ CONSTANTES MÉTIER ERP
export const ID_PREFIXES = {
  PROJET: 'PRJ',
  DEVIS: 'DEV', 
  FACTURE: 'FAC',
  CLIENT: 'CLT',
  FOURNISSEUR: 'FOU',
  STOCK: 'STK',
  PRODUCTION: 'PRD',
  USER: 'USR',
  TOAST: 'TST',
  SESSION: 'SES',
  UPLOAD: 'UPL',
  RAPPORT: 'RPT',
  TACHE: 'TSK',
  COMMANDE: 'CMD'
} as const

// ✅ GÉNÉRATEURS SSR-SAFE
class IDGenerator {
  private static counter = 0
  private static nodeId: string
  private static isClient = typeof window !== 'undefined'

  static {
    // ✅ ID de nœud stable (pas de Math.random côté serveur)
    if (typeof window !== 'undefined') {
      // Côté client: ID persistant ou généré
      this.nodeId = this.getOrCreateNodeId()
    } else {
      // Côté serveur: ID déterministe
      this.nodeId = 'srv' + (process.env.NODE_ENV === 'production' ? 'prd' : 'dev')
    }
  }

  /**
   * ✅ ID de nœud persistant côté client
   */
  private static getOrCreateNodeId(): string {
    try {
      let nodeId = localStorage.getItem('topsteel_node_id')
      if (!nodeId) {
        // Utiliser crypto.randomUUID si disponible, sinon fallback
        nodeId = crypto.randomUUID?.()?.slice(0, 8) || 
                 Date.now().toString(36) + 'clt'
        localStorage.setItem('topsteel_node_id', nodeId)
      }
      return nodeId
    } catch {
      return 'clt' + Date.now().toString(36).slice(-4)
    }
  }

  /**
   * ✅ UUID V4 SSR-Safe avec fallback enterprise
   */
  static uuid(): string {
    if (this.isClient && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    
    // ✅ Fallback déterministe pour SSR
    if (!this.isClient) {
      // Côté serveur: utiliser timestamp + compteur
      return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`
    }

    // ✅ Fallback client sans crypto.randomUUID
    return this.generateFallbackUUID()
  }

  /**
   * ✅ NanoID style enterprise (plus court que UUID)
   */
  static nanoId(length = 12): string {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    
    if (!this.isClient) {
      // ✅ Côté serveur: séquence déterministe
      const timestamp = Date.now().toString(36)
      const counter = (++this.counter).toString(36).padStart(4, '0')
      return (timestamp + counter + this.nodeId).slice(0, length)
    }

    // ✅ Côté client: crypto sécurisé
    if (crypto.getRandomValues) {
      const bytes = new Uint8Array(length)
      crypto.getRandomValues(bytes)
      return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('')
    }

    // ✅ Fallback ultime
    return this.generateDeterministicId(length)
  }

  /**
   * ✅ ID métier avec préfixe et format enterprise
   */
  static business(prefix: keyof typeof ID_PREFIXES, config: IDConfig = {}): string {
    const prefixStr = ID_PREFIXES[prefix]
    const timestamp = config.timestamp ? Date.now().toString(36) : ''
    const sequence = (++this.counter).toString(36).padStart(3, '0')
    
    let id = ''
    
    switch (config.format) {
      case 'uuid':
        id = this.uuid()
        break
      case 'nanoid':
        id = this.nanoId(config.length || 8)
        break
      default:
        // Format enterprise par défaut
        id = timestamp + sequence + this.nodeId.slice(0, 3)
    }

    const fullId = `${prefixStr}-${id}`
    
    // ✅ Ajouter checksum si demandé
    if (config.checksum) {
      const checksum = this.calculateChecksum(fullId)
      return `${fullId}-${checksum}`
    }
    
    return fullId
  }

  /**
   * ✅ ID simple pour usage général (remplace generateId)
   */
  static simple(): string {
    if (!this.isClient) {
      // ✅ SSR: déterministe
      return `id_${Date.now().toString(36)}_${(++this.counter).toString(36)}`
    }
    
    // ✅ Client: crypto sécurisé
    return this.nanoId(10)
  }

  /**
   * ✅ UUID fallback sans crypto
   */
  private static generateFallbackUUID(): string {
    const timestamp = Date.now()
    const random1 = Math.floor(Math.random() * 0x10000)
    const random2 = Math.floor(Math.random() * 0x10000)
    const counter = ++this.counter % 0x10000
    
    return [
      timestamp.toString(16).padStart(8, '0'),
      random1.toString(16).padStart(4, '0'),
      '4' + random2.toString(16).padStart(3, '0'),
      '8' + counter.toString(16).padStart(3, '0'),
      Date.now().toString(16).slice(-12).padStart(12, '0')
    ].join('-')
  }

  /**
   * ✅ ID déterministe pour SSR
   */
  private static generateDeterministicId(length: number): string {
    const timestamp = Date.now().toString(36)
    const counter = (++this.counter).toString(36)
    const nodeId = this.nodeId
    
    return (timestamp + counter + nodeId)
      .slice(0, length)
      .padEnd(length, '0')
  }

  /**
   * ✅ Checksum pour validation
   */
  private static calculateChecksum(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).slice(0, 4)
  }
}

// ✅ UTILITAIRES DE PARSING ET VALIDATION
export class IDParser {
  /**
   * Parse un ID métier
   */
  static parse(id: string): ParsedID {
    const parts = id.split('-')
    const hasPrefix = parts.length >= 2 && parts[0].length === 3
    
    if (!hasPrefix) {
      return { raw: id, isValid: false }
    }

    const [prefix, main, checksum] = parts
    const isValid = Object.values(ID_PREFIXES).includes(prefix as any)
    
    return {
      prefix,
      timestamp: this.extractTimestamp(main),
      sequence: this.extractSequence(main),
      checksum,
      raw: id,
      isValid
    }
  }

  /**
   * Valide un ID
   */
  static validate(id: string, expectedPrefix?: keyof typeof ID_PREFIXES): boolean {
    const parsed = this.parse(id)
    
    if (!parsed.isValid) return false
    
    if (expectedPrefix && parsed.prefix !== ID_PREFIXES[expectedPrefix]) {
      return false
    }
    
    // Valider checksum si présent
    if (parsed.checksum) {
      const withoutChecksum = id.substring(0, id.lastIndexOf('-'))
      const expectedChecksum = IDGenerator['calculateChecksum'](withoutChecksum)
      return parsed.checksum === expectedChecksum
    }
    
    return true
  }

  private static extractTimestamp(main: string): number | undefined {
    // Tenter d'extraire timestamp du début
    const timestampPart = main.slice(0, 8)
    const timestamp = parseInt(timestampPart, 36)
    return isNaN(timestamp) ? undefined : timestamp
  }

  private static extractSequence(main: string): number | undefined {
    // Tenter d'extraire séquence
    const sequencePart = main.slice(8, 11)
    const sequence = parseInt(sequencePart, 36)
    return isNaN(sequence) ? undefined : sequence
  }
}

// ✅ EXPORTS PUBLICS
export const ID = {
  // Générateurs
  uuid: () => IDGenerator.uuid(),
  nano: (length?: number) => IDGenerator.nanoId(length),
  simple: () => IDGenerator.simple(),
  
  // Métier
  projet: () => IDGenerator.business('PROJET', { timestamp: true }),
  devis: () => IDGenerator.business('DEVIS', { timestamp: true, checksum: true }),
  client: () => IDGenerator.business('CLIENT', { format: 'nanoid' }),
  toast: () => IDGenerator.business('TOAST'),
  session: () => IDGenerator.business('SESSION', { format: 'uuid' }),
  
  // Utilitaires
  parse: (id: string) => IDParser.parse(id),
  validate: (id: string, prefix?: keyof typeof ID_PREFIXES) => IDParser.validate(id, prefix),
  
  // Legacy (pour compatibilité)
  generate: () => IDGenerator.simple(),
}

// ✅ HOOK REACT SSR-SAFE
export function useClientId(prefix?: keyof typeof ID_PREFIXES): string {
  const [id, setId] = React.useState<string>('')
  
  React.useEffect(() => {
    // ✅ Générer ID seulement côté client
    const newId = prefix ? IDGenerator.business(prefix) : IDGenerator.simple()
    setId(newId)
  }, [prefix])
  
  return id
}