'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Textarea
} from '@erp/ui'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Filter, Code, Eye } from 'lucide-react'

interface Condition {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'in' | 'not_in' | 'is_null' | 'is_not_null' | 'regex'
  value: string | number | string[] | boolean
  type: 'string' | 'number' | 'boolean' | 'array' | 'date'
  logic?: 'AND' | 'OR'
}

interface ConditionGroup {
  id: string
  conditions: Condition[]
  logic: 'AND' | 'OR'
}

interface ConditionBuilderProps {
  triggerType: 'user' | 'stock' | 'email' | 'project' | 'production' | 'system'
  conditions: Condition[]
  onChange: (conditions: Condition[]) => void
}

// Champs disponibles selon le type d'événement
const AVAILABLE_FIELDS = {
  user: [
    { value: 'userId', label: 'ID Utilisateur', type: 'string' },
    { value: 'username', label: 'Nom d\'utilisateur', type: 'string' },
    { value: 'email', label: 'Email', type: 'string' },
    { value: 'role', label: 'Rôle', type: 'string' },
    { value: 'department', label: 'Département', type: 'string' },
    { value: 'isActive', label: 'Actif', type: 'boolean' },
    { value: 'lastLogin', label: 'Dernière connexion', type: 'date' },
    { value: 'createdAt', label: 'Date création', type: 'date' },
  ],
  stock: [
    { value: 'materialId', label: 'ID Matériau', type: 'string' },
    { value: 'materialName', label: 'Nom matériau', type: 'string' },
    { value: 'category', label: 'Catégorie', type: 'string' },
    { value: 'supplier', label: 'Fournisseur', type: 'string' },
    { value: 'quantity', label: 'Quantité', type: 'number' },
    { value: 'threshold', label: 'Seuil critique', type: 'number' },
    { value: 'unit', label: 'Unité', type: 'string' },
    { value: 'location', label: 'Emplacement', type: 'string' },
    { value: 'lastUpdate', label: 'Dernière mise à jour', type: 'date' },
  ],
  email: [
    { value: 'from', label: 'Expéditeur', type: 'string' },
    { value: 'to', label: 'Destinataire', type: 'string' },
    { value: 'subject', label: 'Sujet', type: 'string' },
    { value: 'body', label: 'Corps du message', type: 'string' },
    { value: 'attachments', label: 'Pièces jointes', type: 'boolean' },
    { value: 'priority', label: 'Priorité', type: 'string' },
    { value: 'receivedAt', label: 'Reçu le', type: 'date' },
  ],
  project: [
    { value: 'projectId', label: 'ID Projet', type: 'string' },
    { value: 'projectName', label: 'Nom du projet', type: 'string' },
    { value: 'status', label: 'Statut', type: 'string' },
    { value: 'priority', label: 'Priorité', type: 'string' },
    { value: 'client', label: 'Client', type: 'string' },
    { value: 'manager', label: 'Responsable', type: 'string' },
    { value: 'budget', label: 'Budget', type: 'number' },
    { value: 'deadline', label: 'Date limite', type: 'date' },
    { value: 'completion', label: 'Avancement (%)', type: 'number' },
  ],
  production: [
    { value: 'orderId', label: 'ID Commande', type: 'string' },
    { value: 'machineId', label: 'ID Machine', type: 'string' },
    { value: 'machineName', label: 'Nom machine', type: 'string' },
    { value: 'operationType', label: 'Type opération', type: 'string' },
    { value: 'status', label: 'Statut', type: 'string' },
    { value: 'priority', label: 'Priorité', type: 'string' },
    { value: 'estimatedDuration', label: 'Durée estimée', type: 'number' },
    { value: 'actualDuration', label: 'Durée réelle', type: 'number' },
  ],
  system: [
    { value: 'service', label: 'Service', type: 'string' },
    { value: 'level', label: 'Niveau', type: 'string' },
    { value: 'message', label: 'Message', type: 'string' },
    { value: 'errorCode', label: 'Code d\'erreur', type: 'string' },
    { value: 'component', label: 'Composant', type: 'string' },
    { value: 'severity', label: 'Sévérité', type: 'string' },
    { value: 'timestamp', label: 'Horodatage', type: 'date' },
  ]
}

const OPERATORS = {
  string: [
    { value: 'equals', label: 'égal à' },
    { value: 'not_equals', label: 'différent de' },
    { value: 'contains', label: 'contient' },
    { value: 'not_contains', label: 'ne contient pas' },
    { value: 'starts_with', label: 'commence par' },
    { value: 'ends_with', label: 'finit par' },
    { value: 'in', label: 'dans la liste' },
    { value: 'not_in', label: 'pas dans la liste' },
    { value: 'is_null', label: 'est vide' },
    { value: 'is_not_null', label: 'n\'est pas vide' },
    { value: 'regex', label: 'correspond à (regex)' },
  ],
  number: [
    { value: 'equals', label: 'égal à' },
    { value: 'not_equals', label: 'différent de' },
    { value: 'greater_than', label: 'supérieur à' },
    { value: 'less_than', label: 'inférieur à' },
    { value: 'greater_equal', label: 'supérieur ou égal à' },
    { value: 'less_equal', label: 'inférieur ou égal à' },
    { value: 'in', label: 'dans la liste' },
    { value: 'not_in', label: 'pas dans la liste' },
    { value: 'is_null', label: 'est vide' },
    { value: 'is_not_null', label: 'n\'est pas vide' },
  ],
  boolean: [
    { value: 'equals', label: 'égal à' },
    { value: 'not_equals', label: 'différent de' },
  ],
  date: [
    { value: 'equals', label: 'égal à' },
    { value: 'not_equals', label: 'différent de' },
    { value: 'greater_than', label: 'après' },
    { value: 'less_than', label: 'avant' },
    { value: 'greater_equal', label: 'après ou égal à' },
    { value: 'less_equal', label: 'avant ou égal à' },
    { value: 'is_null', label: 'est vide' },
    { value: 'is_not_null', label: 'n\'est pas vide' },
  ]
}

export default function ConditionBuilder({ triggerType, conditions, onChange }: ConditionBuilderProps) {
  const [showPreview, setShowPreview] = useState(false)

  const addCondition = () => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      field: '',
      operator: 'equals',
      value: '',
      type: 'string',
      logic: conditions.length > 0 ? 'AND' : undefined
    }
    onChange([...conditions, newCondition])
  }

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    const updated = conditions.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    )
    onChange(updated)
  }

  const removeCondition = (id: string) => {
    onChange(conditions.filter(condition => condition.id !== id))
  }

  const getFieldType = (fieldValue: string): 'string' | 'number' | 'boolean' | 'date' => {
    const field = AVAILABLE_FIELDS[triggerType]?.find(f => f.value === fieldValue)
    return field?.type as any || 'string'
  }

  const renderValueInput = (condition: Condition) => {
    const fieldType = getFieldType(condition.field)
    const isListOperator = ['in', 'not_in'].includes(condition.operator)
    const isNullOperator = ['is_null', 'is_not_null'].includes(condition.operator)

    if (isNullOperator) {
      return null
    }

    if (fieldType === 'boolean') {
      return (
        <Select
          value={condition.value.toString()}
          onValueChange={(value) => updateCondition(condition.id, { value: value === 'true' })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Vrai</SelectItem>
            <SelectItem value="false">Faux</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (isListOperator) {
      return (
        <Textarea
          value={Array.isArray(condition.value) ? condition.value.join('\n') : condition.value}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value.split('\n').filter(Boolean) })}
          placeholder="Une valeur par ligne"
          className="w-48"
          rows={3}
        />
      )
    }

    if (fieldType === 'number') {
      return (
        <Input
          type="number"
          value={condition.value}
          onChange={(e) => updateCondition(condition.id, { value: parseFloat(e.target.value) || 0 })}
          className="w-32"
          placeholder="0"
        />
      )
    }

    if (fieldType === 'date') {
      return (
        <Input
          type="datetime-local"
          value={condition.value}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          className="w-48"
        />
      )
    }

    return (
      <Input
        value={condition.value}
        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
        className="w-48"
        placeholder="Valeur"
      />
    )
  }

  const generateConditionText = (condition: Condition): string => {
    const field = AVAILABLE_FIELDS[triggerType]?.find(f => f.value === condition.field)
    const operator = OPERATORS[getFieldType(condition.field)]?.find(o => o.value === condition.operator)
    
    if (!field || !operator) return ''

    let valueText = ''
    if (!['is_null', 'is_not_null'].includes(condition.operator)) {
      if (Array.isArray(condition.value)) {
        valueText = `[${condition.value.join(', ')}]`
      } else {
        valueText = condition.value.toString()
      }
    }

    return `${field.label} ${operator.label} ${valueText}`.trim()
  }

  const generatePreviewText = (): string => {
    if (conditions.length === 0) return 'Aucune condition définie'

    return conditions.map((condition, index) => {
      const conditionText = generateConditionText(condition)
      const logicText = index > 0 ? ` ${condition.logic} ` : ''
      return `${logicText}${conditionText}`
    }).join('')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Conditions de déclenchement</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </Button>
            <Button onClick={addCondition} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPreview && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Aperçu de la condition :</span>
            </div>
            <code className="text-sm text-blue-600">
              {generatePreviewText()}
            </code>
          </div>
        )}

        {conditions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune condition définie</p>
            <p className="text-sm">La règle se déclenchera pour tous les événements de ce type</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div key={condition.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                {index > 0 && (
                  <Select
                    value={condition.logic}
                    onValueChange={(value) => updateCondition(condition.id, { logic: value as any })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">ET</SelectItem>
                      <SelectItem value="OR">OU</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select
                  value={condition.field}
                  onValueChange={(value) => updateCondition(condition.id, { 
                    field: value,
                    type: getFieldType(value),
                    operator: 'equals',
                    value: ''
                  })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Champ" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_FIELDS[triggerType]?.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={condition.operator}
                  onValueChange={(value) => updateCondition(condition.id, { 
                    operator: value as any,
                    value: ['is_null', 'is_not_null'].includes(value) ? '' : condition.value
                  })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Opérateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS[getFieldType(condition.field)]?.map((operator) => (
                      <SelectItem key={operator.value} value={operator.value}>
                        {operator.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {renderValueInput(condition)}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCondition(condition.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {conditions.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Logique appliquée :</h4>
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-center space-x-1">
                  {index > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {condition.logic}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {generateConditionText(condition)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}