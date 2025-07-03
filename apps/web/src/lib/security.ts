/**
 * ✅ SECURITY UTILITIES ENTERPRISE - VERSION COMPATIBLE
 * 
 * Fonctionnalités:
 * - Validation et sanitisation des données
 * - Protection XSS et injection (sans DOMPurify)
 * - Chiffrement et déchiffrement
 * - Rate limiting côté client
 * - Audit de sécurité automatique
 */

import { z } from 'zod'

// ✅ SANITISATION XSS - VERSION NATIVE
export class SecurityUtils {
  /**
   * Nettoie le HTML pour prévenir les attaques XSS (version native)
   */
  static sanitizeHtml(html: string): string {
    if (typeof window === 'undefined') {
      // SSR: validation basique mais robuste
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed[^>]*>/gi, '')
        .replace(/<link[^>]*>/gi, '')
        .replace(/<meta[^>]*>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/onload=/gi, '')
        .replace(/onerror=/gi, '')
        .replace(/onclick=/gi, '')
        .replace(/onmouseover=/gi, '')
    }
    
    // Client: utiliser la méthode native du navigateur
    const temp = document.createElement('div')
    temp.textContent = html
    return temp.innerHTML
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
  }

  /**
   * Nettoie une chaîne de caractères
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>\"']/g, '') // Retire les caractères dangereux
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .trim()
      .substring(0, 1000) // Limite la longueur
  }

  /**
   * Valide et nettoie un email
   */
  static sanitizeEmail(email: string): string | null {
    const emailSchema = z.string().email().max(254)
    
    try {
      return emailSchema.parse(email.toLowerCase().trim())
    } catch {
      return null
    }
  }

  /**
   * Valide une URL
   */
  static sanitizeUrl(url: string): string | null {
    try {
      const parsed = new URL(url)
      
      // Seulement HTTP/HTTPS
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null
      }
      
      // Pas de localhost en production
      if (process.env.NODE_ENV === 'production' && 
          (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
        return null
      }
      
      return parsed.toString()
    } catch {
      return null
    }
  }

  /**
   * Chiffrement simple côté client
   */
  static async encryptData(data: string, key: string): Promise<string> {
    if (typeof window === 'undefined') return data
    
    try {
      const encoder = new TextEncoder()
      const keyData = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key.padEnd(32, '0').substring(0, 32)),
        'AES-GCM',
        false,
        ['encrypt']
      )
      
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyData,
        encoder.encode(data)
      )
      
      const result = new Uint8Array(iv.length + encrypted.byteLength)
      result.set(iv)
      result.set(new Uint8Array(encrypted), iv.length)
      
      return btoa(String.fromCharCode.apply(null, Array.from(result)))
    } catch (error) {
      console.error('Encryption failed:', error)
      return data
    }
  }

  /**
   * Déchiffrement simple côté client
   */
  static async decryptData(encryptedData: string, key: string): Promise<string> {
    if (typeof window === 'undefined') return encryptedData
    
    try {
      const data = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      )
      
      const iv = data.slice(0, 12)
      const encrypted = data.slice(12)
      
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      
      const keyData = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key.padEnd(32, '0').substring(0, 32)),
        'AES-GCM',
        false,
        ['decrypt']
      )
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyData,
        encrypted
      )
      
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Decryption failed:', error)
      return ''
    }
  }

  /**
   * Rate limiting côté client
   */
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests: number[] = []
    
    return {
      isAllowed(): boolean {
        const now = Date.now()
        const windowStart = now - windowMs
        
        // Nettoyer les anciennes requêtes
        while (requests.length > 0 && requests[0] < windowStart) {
          requests.shift()
        }
        
        // Vérifier la limite
        if (requests.length >= maxRequests) {
          return false
        }
        
        requests.push(now)
        return true
      },
      
      getRemaining(): number {
        return Math.max(0, maxRequests - requests.length)
      },
      
      getResetTime(): number {
        return requests.length > 0 ? requests[0] + windowMs : Date.now()
      }
    }
  }

  /**
   * Génère un token CSRF
   */
  static generateCSRFToken(): string {
    if (typeof window === 'undefined') {
      return Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15)
    }
    
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Audit de sécurité automatique
   */
  static auditSecurity(): SecurityAuditReport {
    const issues: string[] = []
    const warnings: string[] = []

    // Vérifications côté client
    if (typeof window !== 'undefined') {
      // HTTPS
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        issues.push('Application non servie en HTTPS')
      }

      // Secure Cookies
      if (document.cookie && !document.cookie.includes('Secure')) {
        warnings.push('Cookies non sécurisés détectés')
      }

      // Content Security Policy
      if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        warnings.push('Content Security Policy non détecté')
      }

      // Mixed Content
      const insecureElements = document.querySelectorAll('[src^="http://"], [href^="http://"]')
      if (insecureElements.length > 0) {
        warnings.push(`${insecureElements.length} éléments non sécurisés détectés`)
      }

      // Local Storage sensible
      if (localStorage.getItem('password') || localStorage.getItem('token')) {
        issues.push('Données sensibles stockées en local')
      }
    }

    return {
      issues,
      warnings,
      score: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 5)),
      timestamp: new Date().toISOString()
    }
  }
}

export interface SecurityAuditReport {
  issues: string[]
  warnings: string[]
  score: number
  timestamp: string
}

// ✅ SCHÉMAS ZOD SÉCURISÉS
export const secureSchemas = {
  email: z.string().email().max(254).transform(val => val.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'Mot de passe trop court')
    .max(128, 'Mot de passe trop long')
    .regex(/(?=.*[a-z])/, 'Doit contenir une minuscule')
    .regex(/(?=.*[A-Z])/, 'Doit contenir une majuscule')
    .regex(/(?=.*\d)/, 'Doit contenir un chiffre')
    .regex(/(?=.*[^a-zA-Z\d])/, 'Doit contenir un caractère spécial'),
  
  url: z.string().url().max(2048).refine(url => {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }, 'URL non sécurisée'),
  
  phoneNumber: z.string().regex(/^\+33[1-9]\d{8}$/, 'Numéro de téléphone français invalide'),
  
  siret: z.string().length(14).regex(/^\d{14}$/, 'SIRET invalide'),
  
  filename: z.string()
    .max(255)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Nom de fichier invalide')
    .refine(name => !name.startsWith('.'), 'Nom de fichier invalide'),
  
  html: z.string().transform(SecurityUtils.sanitizeHtml),
  
  userInput: z.string().max(1000).transform(SecurityUtils.sanitizeString)
}
