import type { FormulaContext } from './types'

/**
 * Moteur de formules pour le DataTable
 * Supporte les formules Excel-like : =A1+B1, =SUM(A:A), =IF(A1>0,B1,C1)
 */
export class FormulaEngine<T = any> {
  private context: FormulaContext<T>

  constructor(context: FormulaContext<T>) {
    this.context = context
  }

  /**
   * Évalue une formule
   */
  evaluate(expression: string): any {
    try {
      // Supprimer le = du début si présent
      const formula = expression.startsWith('=') ? expression.slice(1) : expression

      // Remplacer les références de cellules par les valeurs
      const processedFormula = this.processReferences(formula)

      // Évaluer l'expression
      return this.evaluateExpression(processedFormula)
    } catch (_error) {
      return '#ERROR'
    }
  }

  /**
   * Remplace les références de cellules (A1, B2, etc.) par les valeurs
   */
  private processReferences(formula: string): string {
    // Regex pour capturer les références de cellules (A1, B2, etc.)
    const cellRefRegex = /([A-Z]+)(\d+)/g

    return formula.replace(cellRefRegex, (_match, column, row) => {
      const rowIndex = parseInt(row, 10) - 1
      const value = this.getCellValue(column, rowIndex)
      return this.formatValueForExpression(value)
    })
  }

  /**
   * Obtient la valeur d'une cellule par référence colonne
   */
  private getCellValue(columnRef: string, rowIndex: number): any {
    // Convertir A, B, C... en index de colonne
    const columnIndex = this.columnRefToIndex(columnRef)

    if (columnIndex < 0 || columnIndex >= this.context.columns.length) {
      return 0
    }

    const column = this.context.columns[columnIndex]
    return this.context.getValue(column.id, rowIndex)
  }

  /**
   * Convertit une référence de colonne (A, B, AA, etc.) en index numérique
   */
  private columnRefToIndex(ref: string): number {
    let index = 0
    for (let i = 0; i < ref.length; i++) {
      index = index * 26 + (ref.charCodeAt(i) - 65 + 1)
    }
    return index - 1
  }

  /**
   * Formate une valeur pour l'utiliser dans une expression JavaScript
   */
  private formatValueForExpression(value: unknown): string {
    if (value === null || value === undefined) return '0'
    if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value.toString()
    if (value instanceof Date) return value.getTime().toString()
    return '0'
  }

  /**
   * Évalue une expression JavaScript
   */
  private evaluateExpression(expression: string): any {
    // Remplacer les fonctions Excel par des équivalents JavaScript
    let processedExpression = expression

    // Fonction SUM
    processedExpression = processedExpression.replace(
      /SUM\(([A-Z]+):([A-Z]+)\)/g,
      (_match, startCol, endCol) => {
        const startIndex = this.columnRefToIndex(startCol)
        const endIndex = this.columnRefToIndex(endCol)
        const values = []

        for (let i = startIndex; i <= endIndex; i++) {
          if (i >= 0 && i < this.context.columns.length) {
            const column = this.context.columns[i]
            for (let row = 0; row < this.context.data.length; row++) {
              const value = this.context.getValue(column.id, row)
              if (typeof value === 'number') {
                values.push(value)
              }
            }
          }
        }

        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0).toString() : '0'
      }
    )

    // Fonction AVERAGE
    processedExpression = processedExpression.replace(
      /AVERAGE\(([A-Z]+):([A-Z]+)\)/g,
      (_match, startCol, endCol) => {
        const startIndex = this.columnRefToIndex(startCol)
        const endIndex = this.columnRefToIndex(endCol)
        const values = []

        for (let i = startIndex; i <= endIndex; i++) {
          if (i >= 0 && i < this.context.columns.length) {
            const column = this.context.columns[i]
            for (let row = 0; row < this.context.data.length; row++) {
              const value = this.context.getValue(column.id, row)
              if (typeof value === 'number') {
                values.push(value)
              }
            }
          }
        }

        return values.length > 0
          ? (values.reduce((sum, val) => sum + val, 0) / values.length).toString()
          : '0'
      }
    )

    // Fonction COUNT (compte les cellules non vides)
    processedExpression = processedExpression.replace(
      /COUNT\(([A-Z]+):([A-Z]+)\)/g,
      (_match, startCol, endCol) => {
        const startIndex = this.columnRefToIndex(startCol)
        const endIndex = this.columnRefToIndex(endCol)
        let count = 0

        for (let i = startIndex; i <= endIndex; i++) {
          if (i >= 0 && i < this.context.columns.length) {
            const column = this.context.columns[i]
            for (let row = 0; row < this.context.data.length; row++) {
              const value = this.context.getValue(column.id, row)
              if (value !== null && value !== undefined && value !== '') {
                count++
              }
            }
          }
        }

        return count.toString()
      }
    )

    // Fonction COUNTA (compte les cellules avec des nombres)
    processedExpression = processedExpression.replace(
      /COUNTA\(([A-Z]+):([A-Z]+)\)/g,
      (_match, startCol, endCol) => {
        const startIndex = this.columnRefToIndex(startCol)
        const endIndex = this.columnRefToIndex(endCol)
        let count = 0

        for (let i = startIndex; i <= endIndex; i++) {
          if (i >= 0 && i < this.context.columns.length) {
            const column = this.context.columns[i]
            for (let row = 0; row < this.context.data.length; row++) {
              const value = this.context.getValue(column.id, row)
              if (typeof value === 'number') {
                count++
              }
            }
          }
        }

        return count.toString()
      }
    )

    // Fonction IF
    processedExpression = processedExpression.replace(
      /IF\(([^,]+),([^,]+),([^)]+)\)/g,
      '(($1) ? ($2) : ($3))'
    )

    // Fonction MAX
    processedExpression = processedExpression.replace(
      /MAX\(([A-Z]+):([A-Z]+)\)/g,
      (_match, startCol, endCol) => {
        const startIndex = this.columnRefToIndex(startCol)
        const endIndex = this.columnRefToIndex(endCol)
        const values = []

        for (let i = startIndex; i <= endIndex; i++) {
          if (i >= 0 && i < this.context.columns.length) {
            const column = this.context.columns[i]
            for (let row = 0; row < this.context.data.length; row++) {
              const value = this.context.getValue(column.id, row)
              if (typeof value === 'number') {
                values.push(value)
              }
            }
          }
        }

        return values.length > 0 ? Math.max(...values).toString() : '0'
      }
    )

    // Fonction MIN
    processedExpression = processedExpression.replace(
      /MIN\(([A-Z]+):([A-Z]+)\)/g,
      (_match, startCol, endCol) => {
        const startIndex = this.columnRefToIndex(startCol)
        const endIndex = this.columnRefToIndex(endCol)
        const values = []

        for (let i = startIndex; i <= endIndex; i++) {
          if (i >= 0 && i < this.context.columns.length) {
            const column = this.context.columns[i]
            for (let row = 0; row < this.context.data.length; row++) {
              const value = this.context.getValue(column.id, row)
              if (typeof value === 'number') {
                values.push(value)
              }
            }
          }
        }

        return values.length > 0 ? Math.min(...values).toString() : '0'
      }
    )

    // Fonctions mathématiques avancées
    processedExpression = processedExpression.replace(
      /ROUND\(([^,]+),([^)]+)\)/g,
      '(Math.round(($1) * Math.pow(10, $2)) / Math.pow(10, $2))'
    )
    processedExpression = processedExpression.replace(/FLOOR\(/g, 'Math.floor(')
    processedExpression = processedExpression.replace(/CEIL\(/g, 'Math.ceil(')
    processedExpression = processedExpression.replace(/ABS\(/g, 'Math.abs(')
    processedExpression = processedExpression.replace(/SQRT\(/g, 'Math.sqrt(')
    processedExpression = processedExpression.replace(/POWER\(/g, 'Math.pow(')

    // Fonctions de texte
    processedExpression = processedExpression.replace(
      /UPPER\(([^)]+)\)/g,
      '($1).toString().toUpperCase()'
    )
    processedExpression = processedExpression.replace(
      /LOWER\(([^)]+)\)/g,
      '($1).toString().toLowerCase()'
    )
    processedExpression = processedExpression.replace(/LEN\(([^)]+)\)/g, '($1).toString().length')
    processedExpression = processedExpression.replace(
      /LEFT\(([^,]+),([^)]+)\)/g,
      '($1).toString().substring(0, $2)'
    )
    processedExpression = processedExpression.replace(
      /RIGHT\(([^,]+),([^)]+)\)/g,
      '($1).toString().slice(-($2))'
    )
    processedExpression = processedExpression.replace(
      /MID\(([^,]+),([^,]+),([^)]+)\)/g,
      '($1).toString().substring(($2)-1, ($2)-1+($3))'
    )

    // Fonctions logiques
    processedExpression = processedExpression.replace(/AND\(([^)]+)\)/g, '($1)')
    processedExpression = processedExpression.replace(/OR\(([^)]+)\)/g, '($1)')
    processedExpression = processedExpression.replace(/NOT\(([^)]+)\)/g, '!($1)')

    // Fonctions de date
    processedExpression = processedExpression.replace(/TODAY\(\)/g, 'new Date().getTime()')
    processedExpression = processedExpression.replace(/NOW\(\)/g, 'new Date().getTime()')
    processedExpression = processedExpression.replace(
      /YEAR\(([^)]+)\)/g,
      'new Date($1).getFullYear()'
    )
    processedExpression = processedExpression.replace(
      /MONTH\(([^)]+)\)/g,
      '(new Date($1).getMonth() + 1)'
    )
    processedExpression = processedExpression.replace(/DAY\(([^)]+)\)/g, 'new Date($1).getDate()')

    // Évaluer l'expression de manière sécurisée
    return this.safeEval(processedExpression)
  }

  /**
   * Évaluation sécurisée d'expression JavaScript
   */
  private safeEval(expression: string): any {
    try {
      // Vérifier que l'expression ne contient pas de code malveillant
      if (this.containsMaliciousCode(expression)) {
        return '#SECURITY_ERROR'
      }

      // Créer une fonction qui limite l'accès au contexte global
      const func = new Function(
        'Math',
        'Date',
        'String',
        'Number',
        'Boolean',
        `'use strict'; return ${expression}`
      )
      return func(Math, Date, String, Number, Boolean)
    } catch (_error) {
      return '#ERROR'
    }
  }

  /**
   * Vérifie si l'expression contient du code malveillant
   */
  private containsMaliciousCode(expression: string): boolean {
    const forbidden = [
      'eval',
      'Function',
      'constructor',
      'prototype',
      'window',
      'document',
      'global',
      'process',
      'require',
      'import',
      'fetch',
      'XMLHttpRequest',
      '__proto__',
      'delete',
      'while',
      'for',
    ]

    return forbidden.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(expression))
  }

  /**
   * Obtient toutes les dépendances d'une formule (colonnes référencées)
   */
  static getDependencies(formula: string): string[] {
    const dependencies = new Set<string>()
    const cellRefRegex = /([A-Z]+)(\d+)/g
    let match: RegExpExecArray | null

    match = cellRefRegex.exec(formula)
    while (match !== null) {
      dependencies.add(match[1])
      match = cellRefRegex.exec(formula)
    }

    // Ajouter les plages de colonnes (A:Z)
    const rangeRegex = /([A-Z]+):([A-Z]+)/g
    match = rangeRegex.exec(formula)
    while (match !== null) {
      const start = match[1]
      const end = match[2]
      // Ajouter toutes les colonnes dans la plage
      dependencies.add(start)
      dependencies.add(end)
      match = rangeRegex.exec(formula)
    }

    return Array.from(dependencies)
  }

  /**
   * Valide une formule
   */
  static validateFormula(formula: string): { valid: boolean; error?: string } {
    try {
      // Vérifications basiques
      if (!formula.trim()) {
        return { valid: false, error: 'Formule vide' }
      }

      // Vérifier les parenthèses équilibrées
      let openParens = 0
      for (const char of formula) {
        if (char === '(') openParens++
        if (char === ')') openParens--
        if (openParens < 0) {
          return { valid: false, error: 'Parenthèses non équilibrées' }
        }
      }

      if (openParens !== 0) {
        return { valid: false, error: 'Parenthèses non fermées' }
      }

      return { valid: true }
    } catch (_error) {
      return { valid: false, error: 'Formule invalide' }
    }
  }
}
