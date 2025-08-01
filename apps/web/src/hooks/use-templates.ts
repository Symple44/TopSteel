/**
 * Hook pour gérer les templates d'interface
 * Fichier: apps/web/src/hooks/use-templates.ts
 */

import { useCallback, useMemo } from 'react'
import {
  getTemplateById,
  predefinedTemplates,
  type Template,
} from '@/lib/templates/predefined-templates'
import { useAppearanceSettings } from './use-appearance-settings'

interface UseTemplatesReturn {
  templates: Template[]
  currentTemplate: Template | null
  isTemplateApplied: (templateId: string) => boolean
  applyTemplate: (template: Template) => Promise<void>
  findMatchingTemplate: () => Template | null
  getTemplateScore: (template: Template) => number
}

/**
 * Hook pour gérer l'application et la détection des templates
 */
export function useTemplates(): UseTemplatesReturn {
  const { settings, updateSetting, saveSettings } = useAppearanceSettings()

  /**
   * Vérifie si un template spécifique est actuellement appliqué
   */
  const isTemplateApplied = useCallback(
    (templateId: string): boolean => {
      const template = getTemplateById(templateId)
      if (!template) return false

      return Object.entries(template.settings).every(
        ([key, value]) => settings[key as keyof typeof settings] === value
      )
    },
    [settings]
  )

  /**
   * Calcule un score de correspondance entre les settings actuels et un template
   * Score de 0 à 100, 100 = correspondance parfaite
   */
  const getTemplateScore = useCallback(
    (template: Template): number => {
      const totalSettings = Object.keys(template.settings).length
      let matchingSettings = 0

      Object.entries(template.settings).forEach(([key, value]) => {
        if (settings[key as keyof typeof settings] === value) {
          matchingSettings++
        }
      })

      return Math.round((matchingSettings / totalSettings) * 100)
    },
    [settings]
  )

  /**
   * Trouve le template qui correspond le mieux aux settings actuels
   */
  const findMatchingTemplate = useCallback((): Template | null => {
    let bestMatch: Template | null = null
    let bestScore = 0

    predefinedTemplates.forEach((template) => {
      const score = getTemplateScore(template)
      if (score === 100) {
        // Correspondance parfaite trouvée
        bestMatch = template
        return
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = template
      }
    })

    // Ne retourner un template que si le score est assez élevé (>= 80%)
    return bestScore >= 80 ? bestMatch : null
  }, [getTemplateScore])

  /**
   * Template actuellement appliqué (correspondance parfaite uniquement)
   */
  const currentTemplate = useMemo((): Template | null => {
    return predefinedTemplates.find((template) => isTemplateApplied(template.id)) || null
  }, [isTemplateApplied])

  /**
   * Applique un template en mettant à jour tous ses paramètres
   */
  const applyTemplate = useCallback(
    async (template: Template): Promise<void> => {
      // Appliquer tous les paramètres du template
      Object.entries(template.settings).forEach(([key, value]) => {
        updateSetting(key as keyof typeof template.settings, value)
      })

      // Sauvegarder les paramètres
      await saveSettings()
    },
    [updateSetting, saveSettings]
  )

  return {
    templates: predefinedTemplates,
    currentTemplate,
    isTemplateApplied,
    applyTemplate,
    findMatchingTemplate,
    getTemplateScore,
  }
}

/**
 * Hook pour obtenir des recommandations de templates basées sur l'usage
 */
export function useTemplateRecommendations() {
  const { settings } = useAppearanceSettings()
  const { getTemplateScore } = useTemplates()

  /**
   * Recommande des templates basés sur les préférences actuelles
   */
  const getRecommendations = useCallback(
    (maxResults: number = 4): Template[] => {
      // Créer une liste de templates avec leurs scores
      const templatesWithScores = predefinedTemplates.map((template) => ({
        template,
        score: getTemplateScore(template),
      }))

      // Trier par score décroissant et prendre les meilleurs
      return templatesWithScores
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map((item) => item.template)
    },
    [getTemplateScore]
  )

  /**
   * Recommande des templates similaires à celui actuellement utilisé
   */
  const getSimilarTemplates = useCallback(
    (currentTemplateId: string, maxResults: number = 3): Template[] => {
      const currentTemplate = getTemplateById(currentTemplateId)
      if (!currentTemplate) return []

      return predefinedTemplates
        .filter((template) => template.id !== currentTemplateId)
        .filter(
          (template) =>
            // Templates de la même catégorie ou avec des paramètres similaires
            template.category === currentTemplate.category ||
            template.settings.theme === currentTemplate.settings.theme ||
            template.settings.accentColor === currentTemplate.settings.accentColor
        )
        .slice(0, maxResults)
    },
    []
  )

  return {
    getRecommendations,
    getSimilarTemplates,
  }
}
