'use client'

import { useMemo } from 'react'
import type { ColorRule } from './ColorRuleManager'
import type { ColumnConfig } from './types'

export interface ColorRuleResult {
  backgroundColor?: string
  color?: string
  matchedRules: string[] // Noms des règles appliquées
}

export function useColorRules<T = any>(data: T[], columns: ColumnConfig<T>[], rules: ColorRule[]) {
  // Créer une carte des styles pour chaque cellule/ligne
  const styleMap = useMemo(() => {
    const map = new Map<string, ColorRuleResult>()

    // Trier les règles par priorité (plus petit = plus prioritaire)
    const sortedRules = [...rules]
      .filter((rule) => rule.enabled)
      .sort((a, b) => a.priority - b.priority)

    data.forEach((row, rowIndex) => {
      const appliedRowRules: ColorRule[] = []

      columns.forEach((column) => {
        // Obtenir la valeur de la cellule
        const cellValue = column.getValue ? column.getValue(row) : (row as any)[column.key]
        const appliedCellRules: ColorRule[] = []

        // Évaluer chaque règle pour cette cellule
        sortedRules.forEach((rule) => {
          if (rule.columnId !== column.id) return

          const matches = evaluateRule(cellValue, rule)
          if (matches) {
            if (rule.applyTo === 'cell') {
              appliedCellRules.push(rule)
            } else if (rule.applyTo === 'row') {
              appliedRowRules.push(rule)
            }
          }
        })

        // Créer la clé pour cette cellule
        const cellKey = `${rowIndex}-${column.id}`

        // Appliquer les règles (la première règle dans la liste triée gagne)
        const cellRule = appliedCellRules[0]
        if (cellRule) {
          map.set(cellKey, {
            backgroundColor: cellRule.backgroundColor,
            color: cellRule.textColor,
            matchedRules: [cellRule.name],
          })
        }
      })

      // Appliquer les règles de ligne (pour toutes les cellules de la ligne)
      const rowRule = appliedRowRules[0]
      if (rowRule) {
        columns.forEach((column) => {
          const cellKey = `${rowIndex}-${column.id}`
          // Ne pas écraser une règle de cellule spécifique
          if (!map.has(cellKey)) {
            map.set(cellKey, {
              backgroundColor: rowRule.backgroundColor,
              color: rowRule.textColor,
              matchedRules: [rowRule.name],
            })
          }
        })
      }
    })

    return map
  }, [data, columns, rules])

  // Fonction pour obtenir le style d'une cellule
  const getCellStyle = (rowIndex: number, columnId: string): ColorRuleResult | undefined => {
    return styleMap.get(`${rowIndex}-${columnId}`)
  }

  // Fonction pour obtenir le style d'une ligne (si toutes les cellules ont le même style)
  const getRowStyle = (rowIndex: number): ColorRuleResult | undefined => {
    const firstColumnId = columns[0]?.id
    if (!firstColumnId) return undefined

    const firstCellStyle = getCellStyle(rowIndex, firstColumnId)
    if (!firstCellStyle) return undefined

    // Vérifier si toutes les cellules de la ligne ont le même style
    const allCellsMatch = columns.every((column) => {
      const cellStyle = getCellStyle(rowIndex, column.id)
      return (
        cellStyle?.backgroundColor === firstCellStyle.backgroundColor &&
        cellStyle?.color === firstCellStyle.color
      )
    })

    return allCellsMatch ? firstCellStyle : undefined
  }

  return {
    getCellStyle,
    getRowStyle,
    hasRules: rules.some((rule) => rule.enabled),
    totalRules: rules.length,
    activeRules: rules.filter((rule) => rule.enabled).length,
  }
}

// Fonction pour évaluer une règle sur une valeur
function evaluateRule(value: any, rule: ColorRule): boolean {
  // Normaliser la valeur
  const normalizedValue = normalizeValue(value)
  const ruleValue = normalizeValue(rule.value)
  const ruleValue2 = normalizeValue(rule.value2)

  switch (rule.condition) {
    case 'equals':
      return normalizedValue === ruleValue

    case 'contains':
      return (
        typeof normalizedValue === 'string' &&
        typeof ruleValue === 'string' &&
        normalizedValue.toLowerCase().includes(ruleValue.toLowerCase())
      )

    case 'greater':
      return (
        typeof normalizedValue === 'number' &&
        typeof ruleValue === 'number' &&
        normalizedValue > ruleValue
      )

    case 'less':
      return (
        typeof normalizedValue === 'number' &&
        typeof ruleValue === 'number' &&
        normalizedValue < ruleValue
      )

    case 'between':
      return (
        typeof normalizedValue === 'number' &&
        typeof ruleValue === 'number' &&
        typeof ruleValue2 === 'number' &&
        normalizedValue >= ruleValue &&
        normalizedValue <= ruleValue2
      )

    case 'empty':
      return (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
      )

    case 'not_empty':
      return !(
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
      )

    default:
      return false
  }
}

// Fonction pour normaliser les valeurs avant comparaison
function normalizeValue(value: any): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    // Essayer de convertir en nombre si c'est numérique
    const numericValue = parseFloat(value)
    if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
      return numericValue
    }
    return value
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

export default useColorRules
