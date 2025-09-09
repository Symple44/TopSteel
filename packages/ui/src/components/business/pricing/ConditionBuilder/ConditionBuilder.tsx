'use client'
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Code,
  Copy,
  DollarSign,
  Hash,
  Info,
  Mail,
  Package,
  Plus,
  Settings,
  Trash2,
  Users,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Alert, AlertDescription, AlertTitle } from '../../../feedback/alert'
import { Label } from '../../../forms/label/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../layout/card'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
import { SimpleTooltip } from '../../../primitives/tooltip'
import type { PricingCondition } from '../PriceRuleCard/PriceRuleCard'
export interface ConditionBuilderProps {
  conditions: PricingCondition[]
  onChange: (conditions: PricingCondition[]) => void
  className?: string
  maxConditions?: number
  showPreview?: boolean
  allowGroups?: boolean
  templates?: ConditionTemplate[]
}
export interface ConditionTemplate {
  name: string
  description: string
  icon?: React.ReactNode
  conditions: PricingCondition[]
}
// interface ConditionGroup {
//   id: string
//   operator: 'AND' | 'OR'
//   conditions: (PricingCondition & { id: string })[]
// }
const CONDITION_TYPES = [
  {
    value: 'quantity',
    label: 'Quantité',
    icon: <Hash className="w-4 h-4" />,
    description: 'Basé sur la quantité commandée',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
    valueType: 'number',
  },
  {
    value: 'customer_group',
    label: 'Groupe client',
    icon: <Users className="w-4 h-4" />,
    description: 'Basé sur le groupe du client',
    operators: ['equals', 'in', 'not_in'],
    valueType: 'select',
    options: ['VIP', 'GROSSISTE', 'PROFESSIONNEL', 'PARTICULIER'],
  },
  {
    value: 'customer_email',
    label: 'Email client',
    icon: <Mail className="w-4 h-4" />,
    description: "Basé sur l'email du client",
    operators: ['equals', 'contains', 'starts_with', 'ends_with'],
    valueType: 'email',
  },
  {
    value: 'customer_code',
    label: 'Code client',
    icon: <Code className="w-4 h-4" />,
    description: 'Basé sur le code client',
    operators: ['equals', 'starts_with', 'contains'],
    valueType: 'text',
  },
  {
    value: 'date_range',
    label: 'Période',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Valide pendant une période',
    operators: ['between', 'after', 'before'],
    valueType: 'date_range',
  },
  {
    value: 'article_reference',
    label: 'Référence article',
    icon: <Package className="w-4 h-4" />,
    description: "Basé sur la référence de l'article",
    operators: ['equals', 'starts_with', 'contains', 'in'],
    valueType: 'text',
  },
  {
    value: 'article_family',
    label: 'Famille article',
    icon: <Package className="w-4 h-4" />,
    description: "Basé sur la famille de l'article",
    operators: ['equals', 'in', 'not_in'],
    valueType: 'select',
    options: ['ACIER', 'INOX', 'ALUMINIUM', 'TUBES', 'TOLES', 'PROFILES'],
  },
  {
    value: 'order_total',
    label: 'Montant total',
    icon: <DollarSign className="w-4 h-4" />,
    description: 'Basé sur le montant total de la commande',
    operators: ['greater_than', 'less_than', 'between'],
    valueType: 'number',
  },
  {
    value: 'custom',
    label: 'Personnalisé',
    icon: <Settings className="w-4 h-4" />,
    description: 'Condition personnalisée',
    operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains'],
    valueType: 'mixed',
  },
]
const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Égal à', symbol: '=' },
  { value: 'not_equals', label: 'Différent de', symbol: '≠' },
  { value: 'in', label: 'Dans', symbol: '∈' },
  { value: 'not_in', label: 'Pas dans', symbol: '∉' },
  { value: 'between', label: 'Entre', symbol: '↔' },
  { value: 'greater_than', label: 'Supérieur à', symbol: '>' },
  { value: 'less_than', label: 'Inférieur à', symbol: '<' },
  { value: 'contains', label: 'Contient', symbol: '⊃' },
  { value: 'starts_with', label: 'Commence par', symbol: '^' },
  { value: 'ends_with', label: 'Se termine par', symbol: '$' },
  { value: 'after', label: 'Après', symbol: '>' },
  { value: 'before', label: 'Avant', symbol: '<' },
]
const DEFAULT_TEMPLATES: ConditionTemplate[] = [
  {
    name: 'Remise volume',
    description: 'Remise pour commandes importantes',
    icon: <Package className="w-4 h-4" />,
    conditions: [
      {
        type: 'quantity',
        operator: 'greater_than',
        value: 100,
      },
    ],
  },
  {
    name: 'Client VIP',
    description: 'Conditions pour clients privilégiés',
    icon: <Users className="w-4 h-4" />,
    conditions: [
      {
        type: 'customer_group',
        operator: 'equals',
        value: 'VIP',
      },
    ],
  },
  {
    name: 'Promotion temporaire',
    description: 'Valide pendant une période définie',
    icon: <Calendar className="w-4 h-4" />,
    conditions: [
      {
        type: 'date_range',
        operator: 'between',
        value: {
          from: new Date().toISOString(),
          to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ],
  },
]
export function ConditionBuilder({
  conditions = [],
  onChange,
  className,
  maxConditions = 10,
  showPreview = true,
  allowGroups = false,
  templates = DEFAULT_TEMPLATES,
}: ConditionBuilderProps) {
  const [expandedConditions, setExpandedConditions] = useState<Set<number>>(new Set())
  const [testContext, setTestContext] = useState<Record<string, unknown>>({
    quantity: 10,
    customer_group: 'PARTICULIER',
    customer_email: 'test@example.com',
    article_reference: 'REF001',
    article_family: 'ACIER',
  })
  // Ajouter des IDs uniques aux conditions pour le suivi
  const conditionsWithIds = useMemo(
    () => conditions.map((c, i) => ({ ...c, id: `condition-${i}` })),
    [conditions]
  )
  const addCondition = useCallback(
    (template?: PricingCondition) => {
      if (conditions.length >= maxConditions) {
        return
      }
      const newCondition: PricingCondition = template || {
        type: 'quantity',
        operator: 'equals',
        value: '',
      }
      onChange([...conditions, newCondition])
      setExpandedConditions((prev) => new Set(prev).add(conditions.length))
    },
    [conditions, onChange, maxConditions]
  )
  const removeCondition = useCallback(
    (index: number) => {
      const newConditions = [...conditions]
      newConditions.splice(index, 1)
      onChange(newConditions)
      // Mettre à jour les indices expandés
      setExpandedConditions((prev) => {
        const newSet = new Set<number>()
        prev.forEach((i) => {
          if (i < index) newSet.add(i)
          else if (i > index) newSet.add(i - 1)
        })
        return newSet
      })
    },
    [conditions, onChange]
  )
  const updateCondition = useCallback(
    (index: number, updates: Partial<PricingCondition>) => {
      const newConditions = [...conditions]
      newConditions[index] = { ...newConditions[index], ...updates }
      // Réinitialiser la valeur si on change d'opérateur vers 'between'
      if (updates.operator === 'between' && typeof newConditions[index].value !== 'object') {
        newConditions[index].value = { from: '', to: '' }
      } else if (updates.operator !== 'between' && typeof newConditions[index].value === 'object') {
        newConditions[index].value = ''
      }
      onChange(newConditions)
    },
    [conditions, onChange]
  )
  const duplicateCondition = useCallback(
    (index: number) => {
      if (conditions.length >= maxConditions) {
        return
      }
      const newConditions = [...conditions]
      newConditions.splice(index + 1, 0, { ...conditions[index] })
      onChange(newConditions)
    },
    [conditions, onChange, maxConditions]
  )
  const applyTemplate = useCallback(
    (template: ConditionTemplate) => {
      onChange([...conditions, ...template.conditions])
    },
    [conditions, onChange]
  )
  const toggleExpanded = useCallback((index: number) => {
    setExpandedConditions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])
  const evaluateCondition = useCallback(
    (condition: PricingCondition, context: Record<string, unknown>): boolean => {
      const contextValue = context[condition.type] || context[condition.field || '']
      switch (condition.operator) {
        case 'equals':
          return contextValue === condition.value
        case 'not_equals':
          return contextValue !== condition.value
        case 'greater_than':
          return Number(contextValue) > Number(condition.value)
        case 'less_than':
          return Number(contextValue) < Number(condition.value)
        case 'between':
          if (
            typeof condition.value === 'object' &&
            'from' in condition.value &&
            'to' in condition.value
          ) {
            const val = Number(contextValue)
            return val >= Number(condition.value.from) && val <= Number(condition.value.to)
          }
          return false
        case 'contains':
          return String(contextValue).includes(String(condition.value))
        case 'starts_with':
          return String(contextValue).startsWith(String(condition.value))
        case 'ends_with':
          return String(contextValue).endsWith(String(condition.value))
        case 'in':
          return Array.isArray(condition.value)
            ? condition.value.includes(contextValue as any)
            : String(condition.value)
                .split(',')
                .map((s) => s.trim())
                .includes(contextValue as string)
        case 'not_in':
          return Array.isArray(condition.value)
            ? !condition.value.includes(contextValue as any)
            : !String(condition.value)
                .split(',')
                .map((s) => s.trim())
                .includes(contextValue as string)
        default:
          return false
      }
    },
    []
  )
  const allConditionsMet = useMemo(() => {
    return conditions.every((condition) => evaluateCondition(condition, testContext))
  }, [conditions, testContext, evaluateCondition])
  const renderConditionValue = (condition: PricingCondition, index: number) => {
    const conditionType = CONDITION_TYPES.find((t) => t.value === condition.type)
    if (condition.operator === 'between') {
      const value =
        typeof condition.value === 'object' && 'from' in condition.value
          ? condition.value
          : { from: '', to: '' }
      return (
        <div className="flex items-center gap-2">
          <Input
            value={value.from}
            onChange={(e) =>
              updateCondition(index, {
                value: { ...value, from: e.target.value },
              })
            }
            placeholder="De"
            type={conditionType?.valueType === 'number' ? 'number' : 'text'}
            className="w-24"
          />
          <span className="text-muted-foreground">à</span>
          <Input
            value={value.to}
            onChange={(e) =>
              updateCondition(index, {
                value: { ...value, to: e.target.value },
              })
            }
            placeholder="À"
            type={conditionType?.valueType === 'number' ? 'number' : 'text'}
            className="w-24"
          />
        </div>
      )
    }
    if (conditionType?.valueType === 'select' && conditionType.options) {
      if (condition.operator === 'in' || condition.operator === 'not_in') {
        // Multi-select pour les opérateurs 'in' et 'not_in'
        const selectedValues = Array.isArray(condition.value)
          ? condition.value
          : String(condition.value || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
        return (
          <div className="flex flex-wrap gap-2">
            {conditionType.options.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v) => v !== option)
                    updateCondition(index, { value: newValues })
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )
      } else {
        return (
          <Select
            value={String(condition.value || '')}
            onValueChange={(value) => updateCondition(index, { value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {conditionType.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
    }
    if (conditionType?.valueType === 'date_range' || condition.type === 'date_range') {
      if (['between', 'after', 'before'].includes(condition.operator)) {
        const value =
          typeof condition.value === 'object' && 'from' in condition.value
            ? condition.value
            : { from: '', to: '' }
        return (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={value.from ? new Date(value.from).toISOString().split('T')[0] : ''}
              onChange={(e) =>
                updateCondition(index, {
                  value: { ...value, from: e.target.value },
                })
              }
              className="w-36"
            />
            <span className="text-muted-foreground">à</span>
            <Input
              type="date"
              value={value.to ? new Date(value.to).toISOString().split('T')[0] : ''}
              onChange={(e) =>
                updateCondition(index, {
                  value: { ...value, to: e.target.value },
                })
              }
              className="w-36"
            />
          </div>
        )
      } else {
        return (
          <Input
            type="date"
            value={
              condition.value ? new Date(String(condition.value)).toISOString().split('T')[0] : ''
            }
            onChange={(e) => updateCondition(index, { value: e.target.value })}
            className="w-36"
          />
        )
      }
    }
    return (
      <Input
        value={String(condition.value || '')}
        onChange={(e) => updateCondition(index, { value: e.target.value })}
        placeholder={
          condition.operator === 'in' ? 'Valeurs séparées par des virgules' : 'Valeur...'
        }
        type={
          conditionType?.valueType === 'number'
            ? 'number'
            : conditionType?.valueType === 'email'
              ? 'email'
              : 'text'
        }
        className="w-48"
      />
    )
  }
  return (
    <div className={cn('space-y-4', className)}>
      {/* Templates */}
      {templates.length > 0 && conditions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Modèles de conditions</CardTitle>
            <CardDescription>Utilisez un modèle pour démarrer rapidement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {templates.map((template) => (
                <Card
                  key={template.name}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => applyTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {template.icon}
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Liste des conditions */}
      <div className="space-y-3">
        {conditionsWithIds.map((condition, index) => {
          const conditionType = CONDITION_TYPES.find((t) => t.value === condition.type)
          const operator = CONDITION_OPERATORS.find((o) => o.value === condition.operator)
          const isExpanded = expandedConditions.has(index)
          const isValid = evaluateCondition(condition, testContext)
          return (
            <Card
              key={condition.id}
              className={cn(
                'transition-all',
                showPreview && (isValid ? 'ring-2 ring-green-500' : 'ring-1 ring-red-200')
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {conditionType?.icon}
                      <span className="font-medium">{conditionType?.label}</span>
                    </div>
                    {!isExpanded && (
                      <>
                        <Badge variant="outline">{operator?.symbol || operator?.label}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {typeof condition.value === 'object'
                            ? JSON.stringify(condition.value)
                            : String(condition.value || 'Non défini')}
                        </span>
                      </>
                    )}
                    {showPreview && (
                      <Badge variant={isValid ? 'default' : 'destructive'} className="ml-auto">
                        {isValid ? 'Valide' : 'Non valide'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <SimpleTooltip content="Dupliquer">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateCondition(index)}
                        disabled={conditions.length >= maxConditions}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </SimpleTooltip>
                    <SimpleTooltip content={isExpanded ? 'Réduire' : 'Développer'}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(index)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </SimpleTooltip>
                    <SimpleTooltip content="Supprimer">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </SimpleTooltip>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Type de condition</Label>
                        <Select
                          value={condition.type}
                          onValueChange={(value) =>
                            updateCondition(index, {
                              type: value as PricingCondition['type'],
                              operator: 'equals',
                              value: '',
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  {type.icon}
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {conditionType?.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {conditionType.description}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Opérateur</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) =>
                            updateCondition(index, {
                              operator: value as PricingCondition['operator'],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITION_OPERATORS.filter(
                              (op) =>
                                !conditionType?.operators ||
                                conditionType.operators.includes(op.value)
                            ).map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">{op.symbol}</span>
                                  {op.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Valeur</Label>
                        {renderConditionValue(condition, index)}
                      </div>
                    </div>
                    {condition.type === 'custom' && (
                      <div>
                        <Label>Champ personnalisé</Label>
                        <Input
                          value={condition.field || ''}
                          onChange={(e) => updateCondition(index, { field: e.target.value })}
                          placeholder="Nom du champ..."
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
      {/* Bouton d'ajout */}
      {conditions.length < maxConditions && (
        <Button type="button" onClick={() => addCondition()} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une condition ({conditions.length}/{maxConditions})
        </Button>
      )}
      {/* Aperçu du test */}
      {showPreview && conditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Test des conditions
            </CardTitle>
            <CardDescription>Modifiez le contexte pour tester vos conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Object.entries(testContext).map(([key, value]) => {
                const type = CONDITION_TYPES.find((t) => t.value === key)
                return (
                  <div key={key}>
                    <Label className="text-xs">{type?.label || key}</Label>
                    <Input
                      value={value as string}
                      onChange={(e) =>
                        setTestContext((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder={`Valeur de ${key}`}
                      className="h-8"
                    />
                  </div>
                )
              })}
            </div>
            <Alert variant={allConditionsMet ? 'default' : 'destructive'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {allConditionsMet
                  ? 'Toutes les conditions sont remplies'
                  : 'Conditions non remplies'}
              </AlertTitle>
              <AlertDescription>
                {allConditionsMet
                  ? 'La règle sera appliquée avec ce contexte.'
                  : 'La règle ne sera pas appliquée avec ce contexte.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
      {/* Message d'information */}
      {conditions.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Aucune condition</AlertTitle>
          <AlertDescription>
            Sans condition, la règle s'appliquera à tous les articles du canal sélectionné. Ajoutez
            des conditions pour cibler des cas spécifiques.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
