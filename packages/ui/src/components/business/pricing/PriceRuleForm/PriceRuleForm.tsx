'use client'
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Calculator,
  Calendar,
  Check,
  DollarSign,
  Info,
  Package,
  Percent,
  Plus,
  Ruler,
  Settings,
  Trash2,
  Wand2,
  Weight,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
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
import { Switch } from '../../../primitives/switch'
import { Textarea } from '../../../primitives/textarea/Textarea'
import type { PriceRule, PricingCondition } from '../PriceRuleCard/PriceRuleCard'
import { AdjustmentType, PriceRuleChannel } from '../PriceRuleCard/PriceRuleCard'
export interface PriceRuleFormProps {
  rule?: Partial<PriceRule>
  mode?: 'wizard' | 'simple'
  onSubmit: (rule: Partial<PriceRule>) => void
  onCancel: () => void
  className?: string
}
interface FormStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  fields: string[]
}
const FORM_STEPS: FormStep[] = [
  {
    id: 'basic',
    title: 'Informations de base',
    description: 'Nom et description de la règle',
    icon: <Info className="w-5 h-5" />,
    fields: ['ruleName', 'description', 'channel'],
  },
  {
    id: 'target',
    title: 'Ciblage',
    description: 'Articles ou familles concernés',
    icon: <Package className="w-5 h-5" />,
    fields: ['articleId', 'articleFamily', 'customerGroups'],
  },
  {
    id: 'adjustment',
    title: 'Ajustement de prix',
    description: "Type et valeur de l'ajustement",
    icon: <Calculator className="w-5 h-5" />,
    fields: ['adjustmentType', 'adjustmentValue', 'adjustmentUnit', 'formula'],
  },
  {
    id: 'conditions',
    title: 'Conditions',
    description: "Conditions d'application de la règle",
    icon: <Settings className="w-5 h-5" />,
    fields: ['conditions'],
  },
  {
    id: 'validity',
    title: 'Validité et limites',
    description: "Période de validité et limites d'usage",
    icon: <Calendar className="w-5 h-5" />,
    fields: ['validFrom', 'validUntil', 'usageLimit', 'usageLimitPerCustomer'],
  },
  {
    id: 'advanced',
    title: 'Options avancées',
    description: 'Priorité et combinaison',
    icon: <Settings className="w-5 h-5" />,
    fields: ['priority', 'combinable', 'isActive'],
  },
]
const CONDITION_TYPES = [
  { value: 'quantity', label: 'Quantité' },
  { value: 'customer_group', label: 'Groupe client' },
  { value: 'customer_email', label: 'Email client' },
  { value: 'customer_code', label: 'Code client' },
  { value: 'date_range', label: 'Période' },
  { value: 'article_reference', label: 'Référence article' },
  { value: 'article_family', label: 'Famille article' },
  { value: 'custom', label: 'Personnalisé' },
]
const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Égal à' },
  { value: 'in', label: 'Dans' },
  { value: 'between', label: 'Entre' },
  { value: 'greater_than', label: 'Supérieur à' },
  { value: 'less_than', label: 'Inférieur à' },
  { value: 'contains', label: 'Contient' },
  { value: 'starts_with', label: 'Commence par' },
]
// Fonction de validation de formule sécurisée
const validateFormula = (formula: string): boolean => {
  // Vérifier que la formule ne contient que des caractères autorisés
  const allowedPattern = /^[a-zA-Z0-9\s+\-*/().,?:<>=!&|]+$/
  if (!allowedPattern.test(formula)) {
    return false
  }
  // Vérifier que les variables utilisées sont autorisées
  const allowedVariables = [
    'price',
    'quantity',
    'weight',
    'length',
    'width',
    'height',
    'surface',
    'volume',
  ]
  const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g
  const matches = formula.match(variablePattern)
  if (matches) {
    for (const match of matches) {
      // Ignorer les nombres et les mots-clés JavaScript autorisés
      if (
        !allowedVariables.includes(match) &&
        Number.isNaN(Number(match)) &&
        !['true', 'false', 'Math', 'min', 'max', 'floor', 'ceil', 'round', 'abs'].includes(match)
      ) {
        return false
      }
    }
  }
  return true
}
const RULE_TEMPLATES = [
  {
    name: 'Remise quantité',
    description: 'Remise basée sur la quantité commandée',
    template: {
      adjustmentType: AdjustmentType.PERCENTAGE,
      adjustmentValue: -10,
      conditions: [
        {
          type: 'quantity' as const,
          operator: 'greater_than' as const,
          value: 100,
        },
      ],
    },
  },
  {
    name: 'Prix au poids',
    description: 'Tarification basée sur le poids en €/tonne',
    template: {
      adjustmentType: AdjustmentType.PRICE_PER_WEIGHT,
      adjustmentValue: 850,
      adjustmentUnit: 'T',
    },
  },
  {
    name: 'Marge marketplace',
    description: "Ajout d'une marge pour les ventes marketplace",
    template: {
      channel: PriceRuleChannel.MARKETPLACE,
      adjustmentType: AdjustmentType.PERCENTAGE,
      adjustmentValue: 15,
    },
  },
  {
    name: 'Tarif groupe VIP',
    description: 'Réduction pour les clients VIP',
    template: {
      adjustmentType: AdjustmentType.PERCENTAGE,
      adjustmentValue: -20,
      customerGroups: ['VIP'],
      conditions: [
        {
          type: 'customer_group' as const,
          operator: 'equals' as const,
          value: 'VIP',
        },
      ],
    },
  },
]
export function PriceRuleForm({
  rule,
  mode = 'wizard',
  onSubmit,
  onCancel,
  className,
}: PriceRuleFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<PriceRule>>({
    ruleName: '',
    description: '',
    channel: PriceRuleChannel.ALL,
    adjustmentType: AdjustmentType.PERCENTAGE,
    adjustmentValue: 0,
    conditions: [],
    priority: 0,
    combinable: true,
    isActive: true,
    ...rule,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const updateFormData = useCallback(
    (
      field: string,
      value:
        | string
        | number
        | boolean
        | PricingCondition[]
        | PriceRuleChannel
        | AdjustmentType
        | string[]
        | Date
        | undefined
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    },
    []
  )
  const applyTemplate = useCallback((template: Partial<PriceRule>) => {
    setFormData((prev) => ({ ...prev, ...template }))
  }, [])
  const addCondition = useCallback(() => {
    const newCondition: PricingCondition = {
      type: 'quantity',
      operator: 'equals',
      value: '',
    }
    updateFormData('conditions', [...(formData.conditions || []), newCondition])
  }, [formData.conditions, updateFormData])
  const removeCondition = useCallback(
    (index: number) => {
      const conditions = [...(formData.conditions || [])]
      conditions.splice(index, 1)
      updateFormData('conditions', conditions)
    },
    [formData.conditions, updateFormData]
  )
  const updateCondition = useCallback(
    (index: number, field: string, value: string | number | string[]) => {
      const conditions = [...(formData.conditions || [])]
      conditions[index] = { ...conditions[index], [field]: value }
      updateFormData('conditions', conditions)
    },
    [formData.conditions, updateFormData]
  )
  const validateStep = useCallback(
    (step: FormStep) => {
      const newErrors: Record<string, string> = {}
      if (step.id === 'basic') {
        if (!formData.ruleName) {
          newErrors.ruleName = 'Le nom est requis'
        }
      }
      if (step.id === 'adjustment') {
        if (formData.adjustmentValue === undefined || formData.adjustmentValue === null) {
          newErrors.adjustmentValue = 'La valeur est requise'
        }
        if (
          [
            AdjustmentType.PRICE_PER_WEIGHT,
            AdjustmentType.PRICE_PER_LENGTH,
            AdjustmentType.PRICE_PER_SURFACE,
            AdjustmentType.PRICE_PER_VOLUME,
          ].includes(formData.adjustmentType!) &&
          !formData.adjustmentUnit
        ) {
          newErrors.adjustmentUnit = "L'unité est requise pour ce type"
        }
        if (formData.adjustmentType === AdjustmentType.FORMULA) {
          if (!formData.formula) {
            newErrors.formula = 'La formule est requise'
          } else if (!validateFormula(formData.formula)) {
            newErrors.formula =
              'Formule invalide. Utilisez uniquement les variables autorisées et les opérateurs mathématiques'
          }
        }
      }
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [formData]
  )
  const handleNext = useCallback(() => {
    if (validateStep(FORM_STEPS[currentStep])) {
      setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1))
    }
  }, [currentStep, validateStep])
  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])
  const handleSubmit = useCallback(() => {
    let isValid = true
    for (const step of FORM_STEPS) {
      if (!validateStep(step)) {
        isValid = false
      }
    }
    if (isValid) {
      onSubmit(formData)
    }
  }, [formData, onSubmit, validateStep])
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {FORM_STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full border-2',
              index < currentStep
                ? 'bg-primary border-primary text-primary-foreground'
                : index === currentStep
                  ? 'border-primary text-primary'
                  : 'border-gray-300 text-gray-400'
            )}
          >
            {index < currentStep ? <Check className="w-5 h-5" /> : step.icon}
          </div>
          {index < FORM_STEPS.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 mx-2',
                index < currentStep ? 'bg-primary' : 'bg-gray-300'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
  const renderBasicStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ruleName">Nom de la règle *</Label>
        <Input
          id="ruleName"
          value={formData.ruleName}
          onChange={(e) => updateFormData('ruleName', e.target.value)}
          placeholder="Ex: Remise volume acier"
          className={errors.ruleName ? 'border-red-500' : ''}
        />
        {errors.ruleName && <p className="text-sm text-red-500 mt-1">{errors.ruleName}</p>}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Description détaillée de la règle..."
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="channel">Canal de vente</Label>
        <Select
          value={formData.channel}
          onValueChange={(value) => updateFormData('channel', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PriceRuleChannel.ALL}>Tous les canaux</SelectItem>
            <SelectItem value={PriceRuleChannel.ERP}>ERP</SelectItem>
            <SelectItem value={PriceRuleChannel.MARKETPLACE}>Marketplace</SelectItem>
            <SelectItem value={PriceRuleChannel.B2B}>B2B</SelectItem>
            <SelectItem value={PriceRuleChannel.API}>API</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
  const renderTargetStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="articleFamily">Famille d'articles</Label>
        <Input
          id="articleFamily"
          value={formData.articleFamily || ''}
          onChange={(e) => updateFormData('articleFamily', e.target.value)}
          placeholder="Ex: ACIER, INOX..."
        />
        <p className="text-sm text-muted-foreground mt-1">
          Laissez vide pour appliquer à tous les articles
        </p>
      </div>
      <div>
        <Label htmlFor="articleId">Article spécifique (ID)</Label>
        <Input
          id="articleId"
          value={formData.articleId || ''}
          onChange={(e) => updateFormData('articleId', e.target.value)}
          placeholder="UUID de l'article"
        />
      </div>
      <div>
        <Label htmlFor="customerGroups">Groupes clients</Label>
        <Input
          id="customerGroups"
          value={formData.customerGroups?.join(', ') || ''}
          onChange={(e) =>
            updateFormData(
              'customerGroups',
              e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="VIP, GROSSISTE, PROFESSIONNEL..."
        />
        <p className="text-sm text-muted-foreground mt-1">Séparez les groupes par des virgules</p>
      </div>
    </div>
  )
  const renderAdjustmentStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="adjustmentType">Type d'ajustement</Label>
        <Select
          value={formData.adjustmentType}
          onValueChange={(value) => updateFormData('adjustmentType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AdjustmentType.PERCENTAGE}>
              <div className="flex items-center">
                <Percent className="w-4 h-4 mr-2" />
                Pourcentage
              </div>
            </SelectItem>
            <SelectItem value={AdjustmentType.FIXED_AMOUNT}>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Montant fixe
              </div>
            </SelectItem>
            <SelectItem value={AdjustmentType.FIXED_PRICE}>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Prix fixe
              </div>
            </SelectItem>
            <SelectItem value={AdjustmentType.PRICE_PER_WEIGHT}>
              <div className="flex items-center">
                <Weight className="w-4 h-4 mr-2" />
                Prix au poids
              </div>
            </SelectItem>
            <SelectItem value={AdjustmentType.PRICE_PER_LENGTH}>
              <div className="flex items-center">
                <Ruler className="w-4 h-4 mr-2" />
                Prix à la longueur
              </div>
            </SelectItem>
            <SelectItem value={AdjustmentType.PRICE_PER_SURFACE}>
              <div className="flex items-center">
                <Box className="w-4 h-4 mr-2" />
                Prix à la surface
              </div>
            </SelectItem>
            <SelectItem value={AdjustmentType.PRICE_PER_VOLUME}>
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Prix au volume
              </div>
            </SelectItem>
            <SelectItem value={AdjustmentType.FORMULA}>
              <div className="flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                Formule personnalisée
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="adjustmentValue">
          {formData.adjustmentType === AdjustmentType.PERCENTAGE
            ? 'Pourcentage (%)'
            : formData.adjustmentType === AdjustmentType.FORMULA
              ? 'Variables disponibles'
              : 'Valeur (€)'}
        </Label>
        {formData.adjustmentType === AdjustmentType.FORMULA ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline">price</Badge>
              <Badge variant="outline">quantity</Badge>
              <Badge variant="outline">weight</Badge>
              <Badge variant="outline">length</Badge>
              <Badge variant="outline">width</Badge>
              <Badge variant="outline">height</Badge>
              <Badge variant="outline">surface</Badge>
              <Badge variant="outline">volume</Badge>
            </div>
            <Textarea
              id="formula"
              value={formData.formula || ''}
              onChange={(e) => updateFormData('formula', e.target.value)}
              placeholder="Ex: price * 0.9 * (quantity > 100 ? 0.95 : 1)"
              rows={3}
              className={errors.formula ? 'border-red-500' : ''}
            />
            {errors.formula && <p className="text-sm text-red-500">{errors.formula}</p>}
          </div>
        ) : (
          <Input
            id="adjustmentValue"
            type="number"
            step="0.01"
            value={formData.adjustmentValue}
            onChange={(e) => updateFormData('adjustmentValue', parseFloat(e.target.value))}
            placeholder={formData.adjustmentType === AdjustmentType.PERCENTAGE ? '-10' : '850'}
            className={errors.adjustmentValue ? 'border-red-500' : ''}
          />
        )}
        {errors.adjustmentValue && (
          <p className="text-sm text-red-500 mt-1">{errors.adjustmentValue}</p>
        )}
        {formData.adjustmentType === AdjustmentType.PERCENTAGE && (
          <p className="text-sm text-muted-foreground mt-1">
            Utilisez des valeurs négatives pour des remises
          </p>
        )}
      </div>
      {[
        AdjustmentType.PRICE_PER_WEIGHT,
        AdjustmentType.PRICE_PER_LENGTH,
        AdjustmentType.PRICE_PER_SURFACE,
        AdjustmentType.PRICE_PER_VOLUME,
      ].includes(formData.adjustmentType!) && (
        <div>
          <Label htmlFor="adjustmentUnit">Unité *</Label>
          <Select
            value={formData.adjustmentUnit || ''}
            onValueChange={(value) => updateFormData('adjustmentUnit', value)}
          >
            <SelectTrigger className={errors.adjustmentUnit ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionnez une unité" />
            </SelectTrigger>
            <SelectContent>
              {formData.adjustmentType === AdjustmentType.PRICE_PER_WEIGHT && (
                <>
                  <SelectItem value="KG">Kilogramme (kg)</SelectItem>
                  <SelectItem value="T">Tonne (t)</SelectItem>
                  <SelectItem value="G">Gramme (g)</SelectItem>
                </>
              )}
              {formData.adjustmentType === AdjustmentType.PRICE_PER_LENGTH && (
                <>
                  <SelectItem value="M">Mètre (m)</SelectItem>
                  <SelectItem value="MM">Millimètre (mm)</SelectItem>
                  <SelectItem value="CM">Centimètre (cm)</SelectItem>
                  <SelectItem value="ML">Mètre linéaire (ml)</SelectItem>
                </>
              )}
              {formData.adjustmentType === AdjustmentType.PRICE_PER_SURFACE && (
                <>
                  <SelectItem value="M2">Mètre carré (m²)</SelectItem>
                  <SelectItem value="CM2">Centimètre carré (cm²)</SelectItem>
                  <SelectItem value="MM2">Millimètre carré (mm²)</SelectItem>
                </>
              )}
              {formData.adjustmentType === AdjustmentType.PRICE_PER_VOLUME && (
                <>
                  <SelectItem value="M3">Mètre cube (m³)</SelectItem>
                  <SelectItem value="L">Litre (L)</SelectItem>
                  <SelectItem value="CM3">Centimètre cube (cm³)</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          {errors.adjustmentUnit && (
            <p className="text-sm text-red-500 mt-1">{errors.adjustmentUnit}</p>
          )}
        </div>
      )}
    </div>
  )
  const renderConditionsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Label>Conditions d'application</Label>
        <Button type="button" variant="outline" size="sm" onClick={addCondition}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une condition
        </Button>
      </div>
      {formData.conditions?.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Aucune condition</AlertTitle>
          <AlertDescription>
            Sans condition, la règle s'appliquera à tous les articles du canal sélectionné.
          </AlertDescription>
        </Alert>
      )}
      {formData.conditions?.map((condition, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={condition.type}
                  onValueChange={(value) => updateCondition(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opérateur</Label>
                <Select
                  value={condition.operator}
                  onValueChange={(value) => updateCondition(index, 'operator', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Valeur</Label>
                  <Input
                    value={
                      typeof condition.value === 'object'
                        ? JSON.stringify(condition.value)
                        : String(condition.value || '')
                    }
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="Valeur..."
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
  const renderValidityStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="validFrom">Date de début</Label>
          <Input
            id="validFrom"
            type="datetime-local"
            value={
              formData.validFrom ? new Date(formData.validFrom).toISOString().slice(0, 16) : ''
            }
            onChange={(e) => updateFormData('validFrom', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="validUntil">Date de fin</Label>
          <Input
            id="validUntil"
            type="datetime-local"
            value={
              formData.validUntil ? new Date(formData.validUntil).toISOString().slice(0, 16) : ''
            }
            onChange={(e) => updateFormData('validUntil', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="usageLimit">Limite d'utilisation totale</Label>
          <Input
            id="usageLimit"
            type="number"
            min="1"
            value={formData.usageLimit || ''}
            onChange={(e) =>
              updateFormData('usageLimit', e.target.value ? parseInt(e.target.value) : undefined)
            }
            placeholder="Illimité"
          />
        </div>
        <div>
          <Label htmlFor="usageLimitPerCustomer">Limite par client</Label>
          <Input
            id="usageLimitPerCustomer"
            type="number"
            min="1"
            value={formData.usageLimitPerCustomer || ''}
            onChange={(e) =>
              updateFormData(
                'usageLimitPerCustomer',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="Illimité"
          />
        </div>
      </div>
    </div>
  )
  const renderAdvancedStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="priority">Priorité</Label>
        <Input
          id="priority"
          type="number"
          min="0"
          max="1000"
          value={formData.priority}
          onChange={(e) => updateFormData('priority', parseInt(e.target.value))}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Les règles avec une priorité plus élevée sont appliquées en premier
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="combinable">Combinable avec d'autres règles</Label>
          <p className="text-sm text-muted-foreground">
            Si désactivé, aucune autre règle ne sera appliquée après celle-ci
          </p>
        </div>
        <Switch
          id="combinable"
          checked={formData.combinable}
          onCheckedChange={(checked) => updateFormData('combinable', checked)}
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="isActive">Règle active</Label>
          <p className="text-sm text-muted-foreground">
            La règle sera immédiatement active après création
          </p>
        </div>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => updateFormData('isActive', checked)}
        />
      </div>
    </div>
  )
  const renderCurrentStep = () => {
    const step = FORM_STEPS[currentStep]
    switch (step.id) {
      case 'basic':
        return renderBasicStep()
      case 'target':
        return renderTargetStep()
      case 'adjustment':
        return renderAdjustmentStep()
      case 'conditions':
        return renderConditionsStep()
      case 'validity':
        return renderValidityStep()
      case 'advanced':
        return renderAdvancedStep()
      default:
        return null
    }
  }
  if (mode === 'simple') {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Modèles de règles</h3>
          <div className="grid grid-cols-2 gap-3">
            {RULE_TEMPLATES.map((template) => (
              <Card
                key={template.name}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => applyTemplate(template.template)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-xs">{template.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
        {renderBasicStep()}
        {renderTargetStep()}
        {renderAdjustmentStep()}
        {renderConditionsStep()}
        {renderValidityStep()}
        {renderAdvancedStep()}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>{rule ? 'Mettre à jour' : 'Créer'} la règle</Button>
        </div>
      </div>
    )
  }
  return (
    <div className={cn('space-y-6', className)}>
      {renderStepIndicator()}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {FORM_STEPS[currentStep].icon}
            {FORM_STEPS[currentStep].title}
          </CardTitle>
          <CardDescription>{FORM_STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">Utiliser un modèle</h4>
              <div className="grid grid-cols-2 gap-3">
                {RULE_TEMPLATES.map((template) => (
                  <Card
                    key={template.name}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => applyTemplate(template.template)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {renderCurrentStep()}
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : handlePrevious}
          disabled={false}
        >
          {currentStep === 0 ? (
            'Annuler'
          ) : (
            <>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </>
          )}
        </Button>
        <Button onClick={currentStep === FORM_STEPS.length - 1 ? handleSubmit : handleNext}>
          {currentStep === FORM_STEPS.length - 1 ? (
            rule ? (
              'Mettre à jour'
            ) : (
              'Créer la règle'
            )
          ) : (
            <>
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
