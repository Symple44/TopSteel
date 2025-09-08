import DOMPurify from 'isomorphic-dompurify'

/**
 * Protection XSS avancée avec DOMPurify
 * Remplace la sanitisation native par une solution robuste et éprouvée
 */

// Configuration DOMPurify par défaut
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'a', 'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'hr'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target',
    'rel', 'width', 'height', 'style'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  IN_PLACE: false,
  USE_PROFILES: {},
  FORBID_CONTENTS: ['script', 'style'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
}

// Configuration stricte pour les inputs utilisateur
const STRICT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span'],
  ALLOWED_ATTR: ['class'],
  KEEP_CONTENT: true,
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
  FORBID_ATTR: ['id', 'style', 'onerror', 'onload', 'onclick'],
}

// Configuration pour le contenu Markdown
const MARKDOWN_CONFIG: DOMPurify.Config = {
  ...DEFAULT_CONFIG,
  ALLOWED_TAGS: [
    ...DEFAULT_CONFIG.ALLOWED_TAGS!,
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'kbd', 'del', 'ins', 'mark',
    'sup', 'sub', 'small', 'figure', 'figcaption'
  ],
  ALLOWED_ATTR: [
    ...DEFAULT_CONFIG.ALLOWED_ATTR!,
    'data-language', 'data-line-numbers', 'data-highlighted'
  ],
}

// Configuration pour les emails
const EMAIL_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'a', 'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'div',
    'h1', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'hr'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'width', 'height', 'style', 'bgcolor', 'align', 'valign'],
  ALLOWED_STYLES: {
    '*': {
      'color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/],
      'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/],
      'font-size': [/^\d+(?:px|em|rem|%)$/],
      'text-align': [/^(?:left|right|center|justify)$/],
      'font-weight': [/^(?:normal|bold|\d{3})$/],
    }
  },
}

/**
 * Classe principale pour la protection XSS
 */
export class XSSProtection {
  private static instance: XSSProtection
  private purifier: typeof DOMPurify

  private constructor() {
    this.purifier = DOMPurify
    this.setupHooks()
  }

  /**
   * Obtient l'instance singleton
   */
  static getInstance(): XSSProtection {
    if (!XSSProtection.instance) {
      XSSProtection.instance = new XSSProtection()
    }
    return XSSProtection.instance
  }

  /**
   * Configure les hooks DOMPurify pour un contrôle avancé
   */
  private setupHooks(): void {
    // Hook pour logger les éléments supprimés (en dev uniquement)
    if (process.env.NODE_ENV === 'development') {
      this.purifier.addHook('afterSanitizeElements', (node) => {
        if (node.nodeType === 1 && node.nodeName === 'SCRIPT') {
          console.warn('🔒 XSS: Script tag blocked', node)
        }
      })
    }

    // Hook pour ajouter des attributs de sécurité aux liens
    this.purifier.addHook('afterSanitizeAttributes', (node) => {
      if ('target' in node) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    })
  }

  /**
   * Sanitise du HTML avec la configuration par défaut
   */
  sanitize(dirty: string, config?: DOMPurify.Config): string {
    if (!dirty || typeof dirty !== 'string') {
      return ''
    }

    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    return this.purifier.sanitize(dirty, finalConfig) as string
  }

  /**
   * Sanitise strictement pour les inputs utilisateur
   */
  sanitizeUserInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    // Limite la longueur avant sanitisation
    const truncated = input.slice(0, 10000)
    return this.purifier.sanitize(truncated, STRICT_CONFIG) as string
  }

  /**
   * Sanitise du contenu Markdown converti en HTML
   */
  sanitizeMarkdown(html: string): string {
    if (!html || typeof html !== 'string') {
      return ''
    }

    return this.purifier.sanitize(html, MARKDOWN_CONFIG) as string
  }

  /**
   * Sanitise du contenu pour les emails
   */
  sanitizeEmail(html: string): string {
    if (!html || typeof html !== 'string') {
      return ''
    }

    return this.purifier.sanitize(html, EMAIL_CONFIG) as string
  }

  /**
   * Sanitise une URL
   */
  sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return ''
    }

    // Vérifie les protocoles autorisés
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:']
    
    try {
      const urlObj = new URL(url)
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return ''
      }
      return url
    } catch {
      // Si ce n'est pas une URL valide, essayer de la traiter comme relative
      if (url.startsWith('/') || url.startsWith('#')) {
        return url
      }
      return ''
    }
  }

  /**
   * Sanitise les attributs de style CSS
   */
  sanitizeStyles(styles: string): string {
    if (!styles || typeof styles !== 'string') {
      return ''
    }

    // Supprime les propriétés dangereuses
    const dangerous = [
      'javascript:',
      'expression(',
      'behavior:',
      'vbscript:',
      '-moz-binding',
      '@import',
      '@charset'
    ]

    let clean = styles
    dangerous.forEach(pattern => {
      clean = clean.replace(new RegExp(pattern, 'gi'), '')
    })

    return clean
  }

  /**
   * Sanitise un objet JSON pour l'affichage
   */
  sanitizeJSON(obj: unknown): string {
    try {
      const jsonString = JSON.stringify(obj, null, 2)
      // Échappe les caractères HTML dans le JSON
      return jsonString
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    } catch {
      return '{}'
    }
  }

  /**
   * Vérifie si une chaîne contient du contenu potentiellement dangereux
   */
  isDangerous(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false
    }

    const patterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\(/i,
      /expression\(/i,
      /vbscript:/i,
      /data:text\/html/i,
    ]

    return patterns.some(pattern => pattern.test(content))
  }

  /**
   * Échappe le HTML pour l'affichage sûr (sans sanitisation)
   */
  escapeHtml(unsafe: string): string {
    if (!unsafe || typeof unsafe !== 'string') {
      return ''
    }

    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    }

    return unsafe.replace(/[&<>"'/]/g, (char) => map[char])
  }

  /**
   * Déséchappe le HTML échappé
   */
  unescapeHtml(safe: string): string {
    if (!safe || typeof safe !== 'string') {
      return ''
    }

    const map: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x2F;': '/',
    }

    return safe.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;/g, (entity) => map[entity])
  }

  /**
   * Nettoie les attributs d'un élément
   */
  cleanAttributes(element: HTMLElement): void {
    const dangerousAttrs = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
    
    dangerousAttrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr)
      }
    })
  }

  /**
   * Obtient les statistiques de sanitisation (dev only)
   */
  getStats(): { removed: number; sanitized: number } | null {
    if (process.env.NODE_ENV !== 'development') {
      return null
    }

    // DOMPurify ne fournit pas de statistiques natives
    // Cette méthode pourrait être étendue avec un système de tracking personnalisé
    return {
      removed: 0,
      sanitized: 0,
    }
  }
}

// Instance singleton exportée
export const xssProtection = XSSProtection.getInstance()

// Fonctions utilitaires exportées pour compatibilité
export const sanitizeHtml = (html: string) => xssProtection.sanitize(html)
export const sanitizeUserInput = (input: string) => xssProtection.sanitizeUserInput(input)
export const sanitizeMarkdown = (md: string) => xssProtection.sanitizeMarkdown(md)
export const sanitizeUrl = (url: string) => xssProtection.sanitizeUrl(url)
export const escapeHtml = (unsafe: string) => xssProtection.escapeHtml(unsafe)
export const isDangerous = (content: string) => xssProtection.isDangerous(content)

// Hook React pour utiliser XSS protection
export function useXSSProtection() {
  const sanitize = (content: string, config?: DOMPurify.Config) => {
    return xssProtection.sanitize(content, config)
  }

  const sanitizeInput = (input: string) => {
    return xssProtection.sanitizeUserInput(input)
  }

  const checkDanger = (content: string) => {
    return xssProtection.isDangerous(content)
  }

  return {
    sanitize,
    sanitizeInput,
    sanitizeUrl: xssProtection.sanitizeUrl,
    escapeHtml: xssProtection.escapeHtml,
    checkDanger,
  }
}

// Composant React pour afficher du contenu sanitisé
interface SafeHtmlProps {
  content: string
  className?: string
  as?: keyof JSX.IntrinsicElements
  config?: DOMPurify.Config
}

export function SafeHtml({ 
  content, 
  className, 
  as: Component = 'div',
  config 
}: SafeHtmlProps) {
  const sanitized = xssProtection.sanitize(content, config)
  
  return (
    <Component 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}