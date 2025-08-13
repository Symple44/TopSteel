import sanitizeHtml from 'sanitize-html'
import type { SearchMetadata } from '../types/search-types'

/**
 * Sanitise les highlights de recherche pour éviter les attaques XSS
 * Conserve uniquement les balises <mark> pour le highlighting
 */
export function sanitizeSearchHighlights(
  highlight: Record<string, string[]> | undefined
): Record<string, string[]> | undefined {
  if (!highlight) {
    return undefined
  }

  const sanitized: Record<string, string[]> = {}

  for (const [field, values] of Object.entries(highlight)) {
    sanitized[field] = values.map((value) =>
      sanitizeHtml(value, {
        allowedTags: ['mark'], // Autoriser uniquement les balises mark pour le highlighting
        allowedAttributes: {}, // Pas d'attributs autorisés
        allowedSchemes: [], // Pas de schémas d'URL autorisés
        disallowedTagsMode: 'discard', // Supprimer les balises non autorisées
      })
    )
  }

  return sanitized
}

/**
 * Sanitise un texte simple en supprimant toutes les balises HTML
 */
export function sanitizeText(text: string | undefined): string | undefined {
  if (!text) {
    return text
  }

  return sanitizeHtml(text, {
    allowedTags: [], // Aucune balise autorisée
    allowedAttributes: {},
    allowedSchemes: [],
    disallowedTagsMode: 'discard',
  })
}

/**
 * Sanitise les résultats de recherche complets
 */
export interface SearchResultToSanitize {
  title?: string
  description?: string
  highlight?: Record<string, string[]>
  metadata?: SearchMetadata
}

export function sanitizeSearchResult<T extends SearchResultToSanitize>(result: T): T {
  return {
    ...result,
    title: sanitizeText(result.title) || result.title,
    description: sanitizeText(result.description) || result.description,
    highlight: sanitizeSearchHighlights(result.highlight),
    // Ne pas sanitiser les metadata car elles peuvent contenir des données structurées
  }
}

/**
 * Sanitise un tableau de résultats de recherche
 */
export function sanitizeSearchResults<T extends SearchResultToSanitize>(results: T[]): T[] {
  return results.map((result) => sanitizeSearchResult(result))
}
