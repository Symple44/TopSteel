'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@erp/ui'
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@erp/ui'
import { Calculator, CheckCircle, XCircle, Info, Lightbulb } from 'lucide-react'
import { ColumnConfig } from './types'
import { FormulaEngine } from './formula-engine'

interface FormulaEditorProps<T = any> {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentFormula?: string
  columns: ColumnConfig<T>[]
  onSave: (formula: string) => void
  sampleData?: T[]
}

interface FormulaFunction {
  name: string
  description: string
  syntax: string
  example: string
  category: 'math' | 'text' | 'logic' | 'date' | 'lookup'
}

const FORMULA_FUNCTIONS: FormulaFunction[] = [
  // Math
  { name: 'SUM', description: 'Somme des valeurs', syntax: 'SUM(plage)', example: 'SUM(A:C)', category: 'math' },
  { name: 'AVERAGE', description: 'Moyenne des valeurs', syntax: 'AVERAGE(plage)', example: 'AVERAGE(A:A)', category: 'math' },
  { name: 'COUNT', description: 'Compte les cellules non vides', syntax: 'COUNT(plage)', example: 'COUNT(A:A)', category: 'math' },
  { name: 'COUNTA', description: 'Compte les nombres', syntax: 'COUNTA(plage)', example: 'COUNTA(A:A)', category: 'math' },
  { name: 'MAX', description: 'Valeur maximale', syntax: 'MAX(plage)', example: 'MAX(A:A)', category: 'math' },
  { name: 'MIN', description: 'Valeur minimale', syntax: 'MIN(plage)', example: 'MIN(A:A)', category: 'math' },
  { name: 'ROUND', description: 'Arrondir', syntax: 'ROUND(nombre, décimales)', example: 'ROUND(A1, 2)', category: 'math' },
  { name: 'ABS', description: 'Valeur absolue', syntax: 'ABS(nombre)', example: 'ABS(A1)', category: 'math' },
  { name: 'SQRT', description: 'Racine carrée', syntax: 'SQRT(nombre)', example: 'SQRT(A1)', category: 'math' },
  { name: 'POWER', description: 'Puissance', syntax: 'POWER(base, exposant)', example: 'POWER(A1, 2)', category: 'math' },
  
  // Text
  { name: 'UPPER', description: 'Convertir en majuscules', syntax: 'UPPER(texte)', example: 'UPPER(A1)', category: 'text' },
  { name: 'LOWER', description: 'Convertir en minuscules', syntax: 'LOWER(texte)', example: 'LOWER(A1)', category: 'text' },
  { name: 'LEN', description: 'Longueur du texte', syntax: 'LEN(texte)', example: 'LEN(A1)', category: 'text' },
  { name: 'LEFT', description: 'Caractères à gauche', syntax: 'LEFT(texte, nombre)', example: 'LEFT(A1, 3)', category: 'text' },
  { name: 'RIGHT', description: 'Caractères à droite', syntax: 'RIGHT(texte, nombre)', example: 'RIGHT(A1, 3)', category: 'text' },
  { name: 'MID', description: 'Caractères au milieu', syntax: 'MID(texte, début, nombre)', example: 'MID(A1, 2, 5)', category: 'text' },
  
  // Logic
  { name: 'IF', description: 'Condition', syntax: 'IF(condition, si_vrai, si_faux)', example: 'IF(A1>0, "Positif", "Négatif")', category: 'logic' },
  { name: 'AND', description: 'ET logique', syntax: 'AND(condition1, condition2)', example: 'AND(A1>0, B1<100)', category: 'logic' },
  { name: 'OR', description: 'OU logique', syntax: 'OR(condition1, condition2)', example: 'OR(A1>0, B1<100)', category: 'logic' },
  { name: 'NOT', description: 'NON logique', syntax: 'NOT(condition)', example: 'NOT(A1>0)', category: 'logic' },
  
  // Date
  { name: 'TODAY', description: 'Date d\'aujourd\'hui', syntax: 'TODAY()', example: 'TODAY()', category: 'date' },
  { name: 'NOW', description: 'Date et heure actuelles', syntax: 'NOW()', example: 'NOW()', category: 'date' },
  { name: 'YEAR', description: 'Année d\'une date', syntax: 'YEAR(date)', example: 'YEAR(A1)', category: 'date' },
  { name: 'MONTH', description: 'Mois d\'une date', syntax: 'MONTH(date)', example: 'MONTH(A1)', category: 'date' },
  { name: 'DAY', description: 'Jour d\'une date', syntax: 'DAY(date)', example: 'DAY(A1)', category: 'date' }
]

export function FormulaEditor<T>({ 
  open, 
  onOpenChange, 
  currentFormula = '', 
  columns, 
  onSave,
  sampleData = []
}: FormulaEditorProps<T>) {
  const [formula, setFormula] = useState(currentFormula)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [validation, setValidation] = useState<{ valid: boolean; error?: string; result?: any }>({ valid: true })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setFormula(currentFormula)
  }, [currentFormula])

  useEffect(() => {
    validateFormula()
  }, [formula])

  const validateFormula = () => {
    if (!formula.trim()) {
      setValidation({ valid: true })
      return
    }

    const basicValidation = FormulaEngine.validateFormula(formula)
    if (!basicValidation.valid) {
      setValidation(basicValidation)
      return
    }

    // Tester avec des données d'exemple si disponibles
    if (sampleData.length > 0) {
      try {
        const context = {
          row: sampleData[0],
          rowIndex: 0,
          data: sampleData,
          columns: columns,
          getValue: (columnId: string, targetRowIndex?: number) => {
            const targetRow = targetRowIndex !== undefined ? sampleData[targetRowIndex] : sampleData[0]
            const targetColumn = columns.find(c => c.id === columnId)
            return targetColumn ? (targetRow as any)[targetColumn.key] : null
          }
        }

        const engine = new FormulaEngine(context)
        const result = engine.evaluate(formula)
        
        setValidation({ 
          valid: result !== '#ERROR' && result !== '#SECURITY_ERROR', 
          result: result,
          error: result === '#ERROR' ? 'Erreur dans la formule' : result === '#SECURITY_ERROR' ? 'Formule non sécurisée' : undefined
        })
      } catch (error) {
        setValidation({ valid: false, error: 'Erreur de validation' })
      }
    } else {
      setValidation({ valid: true })
    }
  }

  const insertFunction = (func: FormulaFunction) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = formula

    const newValue = currentValue.slice(0, start) + func.syntax + currentValue.slice(end)
    setFormula(newValue)

    // Repositionner le curseur
    setTimeout(() => {
      const newCursorPos = start + func.syntax.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const insertColumnRef = (column: ColumnConfig<T>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = formula

    // Convertir l'index de colonne en référence (A, B, C...)
    const columnIndex = columns.findIndex(col => col.id === column.id)
    const columnRef = String.fromCharCode(65 + columnIndex) + '1'

    const newValue = currentValue.slice(0, start) + columnRef + currentValue.slice(end)
    setFormula(newValue)

    // Repositionner le curseur
    setTimeout(() => {
      const newCursorPos = start + columnRef.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const handleSave = () => {
    if (validation.valid && formula.trim()) {
      onSave(formula)
      onOpenChange(false)
    }
  }

  const filteredFunctions = selectedCategory === 'all' 
    ? FORMULA_FUNCTIONS 
    : FORMULA_FUNCTIONS.filter(f => f.category === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Éditeur de formules
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Partie gauche - Éditeur */}
          <div className="flex-1 flex flex-col space-y-4">
            <div className="space-y-2">
              <Label>Formule</Label>
              <Textarea
                ref={textareaRef}
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="=SUM(A:A) + AVERAGE(B:B)"
                className="h-32 font-mono text-sm"
                spellCheck={false}
              />
              
              {/* Validation */}
              <div className="flex items-center gap-2 text-sm">
                {validation.valid ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Formule valide</span>
                    {validation.result !== undefined && (
                      <span className="text-gray-500">
                        → Résultat: {String(validation.result)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{validation.error || 'Formule invalide'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Références de colonnes */}
            <div className="space-y-2">
              <Label>Colonnes disponibles</Label>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                <div className="grid grid-cols-2 gap-1">
                  {columns.map((column, index) => {
                    const columnRef = String.fromCharCode(65 + index)
                    return (
                      <button
                        key={column.id}
                        onClick={() => insertColumnRef(column)}
                        className="text-left p-2 hover:bg-muted rounded text-sm transition-colors"
                        title={`Insérer la référence ${columnRef} (${column.title})`}
                      >
                        <span className="font-mono font-bold text-blue-600">{columnRef}:</span>
                        <span className="ml-1">{column.title}</span>
                        <span className="text-xs text-muted-foreground ml-1">({column.type})</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Partie droite - Fonctions */}
          <div className="w-80 flex flex-col space-y-4">
            <div className="space-y-2">
              <Label>Fonctions disponibles</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les fonctions</SelectItem>
                  <SelectItem value="math">Mathématiques</SelectItem>
                  <SelectItem value="text">Texte</SelectItem>
                  <SelectItem value="logic">Logique</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md">
              <div className="p-2 space-y-1">
                {filteredFunctions.map((func) => (
                  <div
                    key={func.name}
                    className="border rounded-md p-3 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => insertFunction(func)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-600">{func.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {func.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {func.description}
                    </div>
                    <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-2">
                      {func.syntax}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Ex: {func.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Aide rapide */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Aide rapide :</div>
              <ul className="space-y-1 text-xs">
                <li>• Utilisez A1, B2, C3... pour référencer des cellules</li>
                <li>• Utilisez A:A, B:B pour référencer des colonnes entières</li>
                <li>• Commencez par = pour créer une formule</li>
                <li>• Utilisez +, -, *, / pour les opérations de base</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!validation.valid || !formula.trim()}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Appliquer la formule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}