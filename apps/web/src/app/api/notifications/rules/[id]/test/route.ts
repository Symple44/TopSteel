import type { NotificationRule } from '@erp/types/cross-cutting'
import { type NextRequest, NextResponse } from 'next/server'

// Service de test des règles (mockée)
class RuleTestService {
  evaluateConditions(
    conditions: Array<{ field: string; operator: string; value: unknown; logic?: 'AND' | 'OR' }>,
    testData: Record<string, unknown>
  ): { result: boolean; details: Record<string, unknown> } {
    if (!conditions || conditions.length === 0) {
      return { result: true, details: {} }
    }

    const results: Record<string, { result: boolean; value: unknown }> = {}
    let finalResult = true

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]
      const conditionResult = this?.evaluateCondition(condition, testData)
      results[`condition_${i}`] = {
        result: conditionResult,
        value: this?.getFieldValue(condition.field, testData),
      }

      if (i === 0) {
        finalResult = conditionResult
      } else {
        const logic = condition.logic || 'AND'
        if (logic === 'AND') {
          finalResult = finalResult && conditionResult
        } else if (logic === 'OR') {
          finalResult = finalResult || conditionResult
        }
      }
    }

    return { result: finalResult, details: results }
  }

  private evaluateCondition(
    condition: { field: string; operator: string; value: unknown },
    testData: Record<string, unknown>
  ): boolean {
    const fieldValue = this?.getFieldValue(condition.field, testData)
    const conditionValue = condition.value

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue

      case 'not_equals':
        return fieldValue !== conditionValue

      case 'contains':
        return (
          typeof fieldValue === 'string' &&
          typeof conditionValue === 'string' &&
          fieldValue.includes(conditionValue)
        )

      case 'not_contains':
        return (
          typeof fieldValue === 'string' &&
          typeof conditionValue === 'string' &&
          !fieldValue.includes(conditionValue)
        )

      case 'starts_with':
        return (
          typeof fieldValue === 'string' &&
          typeof conditionValue === 'string' &&
          fieldValue.startsWith(conditionValue)
        )

      case 'ends_with':
        return (
          typeof fieldValue === 'string' &&
          typeof conditionValue === 'string' &&
          fieldValue.endsWith(conditionValue)
        )

      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue)

      case 'less_than':
        return Number(fieldValue) < Number(conditionValue)

      case 'greater_equal':
        return Number(fieldValue) >= Number(conditionValue)

      case 'less_equal':
        return Number(fieldValue) <= Number(conditionValue)

      case 'in':
        return Array.isArray(conditionValue) && conditionValue?.includes(fieldValue)

      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue?.includes(fieldValue)

      case 'is_null':
        return fieldValue === null || fieldValue === undefined

      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined

      case 'regex':
        try {
          if (typeof conditionValue !== 'string') return false
          const regex = new RegExp(conditionValue)
          return regex.test(String(fieldValue))
        } catch {
          return false
        }

      default:
        return false
    }
  }

  private getFieldValue(field: string, data: Record<string, unknown>): unknown {
    const fieldParts = field?.split('.')
    let value: unknown = data

    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return value
  }

  substituteVariables(template: string, variables: Record<string, unknown>): string {
    return template?.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match
    })
  }

  prepareTemplateVariables(
    testData: Record<string, unknown>,
    triggerType: string
  ): Record<string, unknown> {
    const variables = { ...testData }

    // Ajouter des variables système
    if (variables) {
      variables.timestamp = new Date().toISOString()
      variables.test_mode = true
    }

    // Ajouter des variables spécifiques selon le type
    switch (triggerType) {
      case 'stock':
        if (variables) {
          variables.stock_url = `/stock/materials/${variables.material_id || 'test'}`
        }
        if (typeof variables?.quantity === 'number' && typeof variables?.threshold === 'number') {
          variables.threshold_percentage = Math.round(
            (variables.quantity / variables.threshold) * 100
          )
        }
        break

      case 'user':
        if (variables) {
          variables.user_profile_url = `/users/${variables.user_id || 'test'}/profile`
        }
        break

      case 'project':
        if (variables) {
          variables.project_url = `/projets/${variables.project_id || 'test'}`
        }
        break

      case 'production':
        if (variables) {
          variables.machine_url = `/production/machines/${variables.machine_id || 'test'}`
        }
        break

      case 'email':
        if (variables) {
          variables.email_url = `/emails/${variables.email_id || 'test'}`
        }
        break

      case 'system':
        if (variables) {
          variables.system_logs_url = `/admin/logs?component=${variables.component || 'test'}`
        }
        break
    }

    return variables
  }
}

const ruleTestService = new RuleTestService()

// Stockage temporaire des règles

const notificationRules: NotificationRule[] = [
  {
    id: '1',
    name: 'Alerte Stock Critique',
    description: 'Notifie quand le stock est critique',
    type: 'in-app',
    enabled: true,
    isActive: true,
    trigger: { type: 'stock', event: 'stock_low' },
    conditions: [
      { field: 'quantity', operator: 'less_than', value: 10 },
      { field: 'category', operator: 'equals', value: 'metal' },
    ],
    actions: [{ type: 'notification', config: { priority: 'HIGH' } }],
    notification: {
      type: 'warning',
      template: 'stock_alert_template',
      variables: { material_name: '', quantity: 0, threshold: 10 },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    lastTriggered: '2024-01-15T10:30:00Z',
    triggerCount: 5,
  },
]

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!request) {
      return NextResponse?.json({ success: false, error: 'Requête invalide' }, { status: 400 })
    }

    const { testData } = await request.json()

    if (!testData || typeof testData !== 'object') {
      return NextResponse?.json(
        { success: false, error: 'Données de test requises' },
        { status: 400 }
      )
    }

    // Trouver la règle
    const rule = notificationRules?.find((r) => r.id === id)
    if (!rule) {
      return NextResponse?.json({ success: false, error: 'Règle non trouvée' }, { status: 404 })
    }

    // Vérifier si la règle est active
    if (!rule?.isActive) {
      return NextResponse?.json({
        success: false,
        error: 'Règle inactive',
        result: {
          ruleActive: false,
          conditionResult: { result: false, details: {} },
          message: 'La règle est désactivée',
        },
      })
    }

    // Évaluer les conditions
    const conditionResult = ruleTestService?.evaluateConditions(rule?.conditions || [], testData)

    if (!conditionResult.result) {
      return NextResponse?.json({
        success: true,
        result: {
          ruleActive: true,
          conditionResult,
          message: 'Conditions non remplies - notification non générée',
        },
      })
    }

    // Préparer les variables pour le template
    const templateVariables = ruleTestService?.prepareTemplateVariables(
      testData,
      rule?.trigger?.type || 'system'
    )

    // Générer un aperçu de la notification
    const config = rule?.notification
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuration de notification manquante' },
        { status: 400 }
      )
    }

    const title = config.titleTemplate
      ? ruleTestService?.substituteVariables(config.titleTemplate, templateVariables)
      : 'Titre manquant'
    const message = config.messageTemplate
      ? ruleTestService?.substituteVariables(config.messageTemplate, templateVariables)
      : 'Message manquant'
    const actionUrl = config.actionUrl
      ? ruleTestService?.substituteVariables(config.actionUrl, templateVariables)
      : undefined

    return NextResponse?.json({
      success: true,
      result: {
        ruleActive: true,
        conditionResult,
        templateVariables,
        notificationPreview: {
          title,
          message,
          type: config.type,
          category: config.category,
          priority: config.priority,
          actionUrl,
          actionLabel: config.actionLabel,
        },
        message: 'Test réussi - notification serait générée',
      },
    })
  } catch (_error) {
    return NextResponse?.json(
      { success: false, error: 'Erreur lors du test de la règle' },
      { status: 500 }
    )
  }
}

// Endpoint pour obtenir des exemples de données de test
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Trouver la règle
    const rule = notificationRules?.find((r) => r.id === id)
    if (!rule) {
      return NextResponse?.json({ success: false, error: 'Règle non trouvée' }, { status: 404 })
    }

    // Générer des exemples de données selon le type d'événement
    const triggerType = rule?.trigger?.type
    let sampleData: Record<string, unknown> = {}

    switch (triggerType) {
      case 'stock':
        sampleData = {
          material_id: 'STEEL_001',
          material_name: 'Acier inoxydable 316L',
          category: 'metal',
          quantity: 5,
          threshold: 10,
          unit: 'kg',
          supplier: 'Fournisseur ABC',
          location: 'Entrepôt A',
          lastUpdate: new Date().toISOString(),
        }
        break

      case 'user':
        sampleData = {
          user_id: 'user_123',
          username: 'jean.dupont',
          email: 'jean.dupont@example.com',
          role: 'admin',
          department: 'IT',
          isActive: true,
          lastLogin: new Date().toISOString(),
        }
        break

      case 'project':
        sampleData = {
          project_id: 'PROJ_001',
          project_name: 'Portail industriel',
          status: 'EN_COURS',
          priority: 'HIGH',
          client: 'Client XYZ',
          manager: 'Marie Martin',
          budget: 50000,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          completion: 75,
          created_by: 'admin',
        }
        break

      case 'production':
        sampleData = {
          order_id: 'ORDER_456',
          machine_id: 'CNC_001',
          machine_name: 'CNC Machine Alpha',
          operation_type: 'usinage',
          status: 'ERROR',
          severity: 'CRITICAL',
          priority: 'URGENT',
          error_message: 'Erreur de capteur température',
          error_code: 'TEMP_001',
          estimatedDuration: 120,
          actualDuration: 45,
        }
        break

      case 'email':
        sampleData = {
          email_id: 'email_789',
          from: 'client@important.com',
          from_name: 'Client Important',
          to: 'contact@topsteel.tech',
          subject: 'Urgent: Modification commande',
          body: 'Bonjour, nous devons modifier notre commande...',
          priority: 'HIGH',
          attachments: true,
          receivedAt: new Date().toISOString(),
        }
        break

      case 'system':
        sampleData = {
          service: 'database',
          level: 'ERROR',
          message: 'Connection timeout',
          errorCode: 'DB_TIMEOUT',
          component: 'auth-service',
          severity: 'HIGH',
          timestamp: new Date().toISOString(),
        }
        break

      default:
        sampleData = {
          example_field: 'example_value',
          timestamp: new Date().toISOString(),
        }
    }

    return NextResponse?.json({
      success: true,
      data: {
        triggerType,
        sampleData,
        availableFields: Object.keys(sampleData),
        description: `Exemple de données pour un événement de type "${triggerType}"`,
      },
    })
  } catch (_error) {
    return NextResponse?.json(
      { success: false, error: "Erreur lors de la récupération des données d'exemple" },
      { status: 500 }
    )
  }
}
