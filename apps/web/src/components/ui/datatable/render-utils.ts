import React from 'react'
import { ColumnConfig } from './types'

/**
 * Utilitaires pour le rendu sécurisé des cellules
 */
export class RenderUtils {
  
  /**
   * Convertit de manière sécurisée une valeur en string pour l'affichage React
   */
  static safeRender(value: any, column: ColumnConfig<any>): string {
    // Valeurs nulles/undefined
    if (value === null || value === undefined) {
      return ''
    }
    
    // Déjà une string
    if (typeof value === 'string') {
      return value
    }
    
    // Boolean
    if (typeof value === 'boolean') {
      return column.type === 'boolean' ? '' : (value ? 'Oui' : 'Non')
    }
    
    // Number
    if (typeof value === 'number') {
      if (isNaN(value)) return '0'
      
      // Appliquer le formatage de colonne si disponible
      if (column.format) {
        return this.formatNumber(value, column.format)
      }
      
      return value.toString()
    }
    
    // Date
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return ''
      
      switch (column.type) {
        case 'date':
          return value.toLocaleDateString('fr-FR')
        case 'datetime':
          return value.toLocaleString('fr-FR')
        default:
          return value.toLocaleDateString('fr-FR')
      }
    }
    
    // Arrays (pour multiselect par exemple)
    if (Array.isArray(value)) {
      return value.map(v => String(v)).join(', ')
    }
    
    // Objets
    if (typeof value === 'object') {
      try {
        // Cas spécial pour les traductions (objet avec des codes de langue)
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const keys = Object.keys(value)
          // Si c'est un objet de traductions avec des codes de langue
          if (keys.length <= 3 && keys.every(key => key.length === 2 || key === 'fr' || key === 'en' || key === 'es')) {
            const translations = keys.map(key => `${key}: "${value[key]}"`).join(', ')
            return `{${translations}}`
          }
          // Pour d'autres objets simples
          if (keys.length < 5) {
            return JSON.stringify(value, null, 0)
          }
        }
        return '[Object]'
      } catch {
        return '[Object]'
      }
    }
    
    // Autres types - conversion en string
    return String(value)
  }
  
  /**
   * Formate un nombre selon la configuration de la colonne
   */
  private static formatNumber(value: number, format: any): string {
    let result = value.toString()
    
    // Décimales
    if (format.decimals !== undefined) {
      result = value.toFixed(format.decimals)
    }
    
    // Devise
    if (format.currency) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: format.currency
      }).format(value)
    }
    
    // Préfixe/Suffixe
    if (format.prefix) result = format.prefix + result
    if (format.suffix) result = result + format.suffix
    
    return result
  }
  
  /**
   * Vérifie si une valeur peut être rendue de manière sécurisée par React
   */
  static isReactSafe(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      // Vérifier si c'est un élément React valide
      React.isValidElement(value) ||
      // Vérifier si c'est un tableau d'éléments React valides
      (Array.isArray(value) && value.every(item => 
        React.isValidElement(item) || 
        typeof item === 'string' || 
        typeof item === 'number' ||
        typeof item === 'boolean' ||
        item === null || 
        item === undefined
      ))
    )
  }
  
  /**
   * Convertit une valeur pour qu'elle soit sécurisée pour React
   */
  static makeReactSafe(value: any, column: ColumnConfig<any>): React.ReactNode {
    if (this.isReactSafe(value)) {
      // Si c'est une Date ou un Object, on les convertit
      if (value instanceof Date || (typeof value === 'object' && value !== null)) {
        return this.safeRender(value, column)
      }
      return value
    }
    
    return this.safeRender(value, column)
  }
}