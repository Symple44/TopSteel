import { NextRequest, NextResponse } from 'next/server'

// Types pour les règles de notification
interface NotificationRule {
  id: string
  name: string
  description: string
  isActive: boolean
  trigger: {
    type: 'user' | 'stock' | 'email' | 'project' | 'production' | 'system'
    event: string
    source?: string
  }
  conditions: Array<{
    id: string
    field: string
    operator: string
    value: any
    type: string
    logic?: 'AND' | 'OR'
  }>
  notification: {
    type: 'info' | 'success' | 'warning' | 'error'
    category: string
    titleTemplate: string
    messageTemplate: string
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
    recipientType: 'all' | 'role' | 'user' | 'group'
    recipientIds?: string[]
    actionUrl?: string
    actionLabel?: string
    persistent: boolean
    expiresIn?: number
  }
  createdAt: string
  lastTriggered?: string
  triggerCount: number
}

// Stockage temporaire - en production, utiliser la base de données
let notificationRules: NotificationRule[] = [
  {
    id: '1',
    name: 'Alerte Stock Critique',
    description: 'Notifier quand le stock d\'un matériau passe sous le seuil critique',
    isActive: true,
    trigger: {
      type: 'stock',
      event: 'stock_low',
      source: 'inventory-service'
    },
    conditions: [
      { id: '1', field: 'quantity', operator: 'less_than', value: 10, type: 'number' },
      { id: '2', field: 'category', operator: 'in', value: ['metal', 'steel'], type: 'string', logic: 'AND' }
    ],
    notification: {
      type: 'warning',
      category: 'stock',
      titleTemplate: 'Stock critique: {{material_name}}',
      messageTemplate: 'Le stock de {{material_name}} est maintenant de {{quantity}} unités (seuil: {{threshold}})',
      priority: 'HIGH',
      recipientType: 'role',
      recipientIds: ['stock_manager', 'admin'],
      actionUrl: '/stock/materials/{{material_id}}',
      actionLabel: 'Voir le stock',
      persistent: true,
      expiresIn: 24
    },
    createdAt: '2024-01-15T10:30:00Z',
    lastTriggered: '2024-01-16T14:22:00Z',
    triggerCount: 15
  },
  {
    id: '2',
    name: 'Nouveau Projet Prioritaire',
    description: 'Notifier lors de la création d\'un projet à haute priorité',
    isActive: true,
    trigger: {
      type: 'project',
      event: 'project_created',
      source: 'project-service'
    },
    conditions: [
      { id: '1', field: 'priority', operator: 'in', value: ['HIGH', 'URGENT'], type: 'string' }
    ],
    notification: {
      type: 'info',
      category: 'projet',
      titleTemplate: 'Nouveau projet prioritaire: {{project_name}}',
      messageTemplate: 'Un nouveau projet "{{project_name}}" ({{priority}}) a été créé par {{created_by}}',
      priority: 'NORMAL',
      recipientType: 'role',
      recipientIds: ['project_manager', 'team_lead'],
      actionUrl: '/projets/{{project_id}}',
      actionLabel: 'Voir le projet',
      persistent: true,
      expiresIn: 48
    },
    createdAt: '2024-01-10T09:15:00Z',
    lastTriggered: '2024-01-16T11:45:00Z',
    triggerCount: 8
  },
  {
    id: '3',
    name: 'Changement Mot de Passe Admin',
    description: 'Notifier les administrateurs des changements de mot de passe d\'autres admins',
    isActive: false,
    trigger: {
      type: 'user',
      event: 'password_changed',
      source: 'auth-service'
    },
    conditions: [
      { id: '1', field: 'role', operator: 'in', value: ['admin', 'manager'], type: 'string' }
    ],
    notification: {
      type: 'info',
      category: 'utilisateur',
      titleTemplate: 'Mot de passe modifié - {{username}}',
      messageTemplate: 'L\'utilisateur {{username}} ({{role}}) a modifié son mot de passe',
      priority: 'LOW',
      recipientType: 'role',
      recipientIds: ['admin'],
      persistent: false,
      expiresIn: 6
    },
    createdAt: '2024-01-12T16:20:00Z',
    triggerCount: 3
  },
  {
    id: '4',
    name: 'Erreur Machine Critique',
    description: 'Notification immédiate en cas d\'erreur machine critique',
    isActive: true,
    trigger: {
      type: 'production',
      event: 'machine_error',
      source: 'production-service'
    },
    conditions: [
      { id: '1', field: 'severity', operator: 'equals', value: 'CRITICAL', type: 'string' }
    ],
    notification: {
      type: 'error',
      category: 'production',
      titleTemplate: 'Erreur critique: {{machine_name}}',
      messageTemplate: 'La machine {{machine_name}} a signalé une erreur critique: {{error_message}}',
      priority: 'URGENT',
      recipientType: 'role',
      recipientIds: ['production_manager', 'maintenance_team', 'admin'],
      actionUrl: '/production/machines/{{machine_id}}/diagnostic',
      actionLabel: 'Diagnostic',
      persistent: true,
      expiresIn: 12
    },
    createdAt: '2024-01-14T08:00:00Z',
    lastTriggered: '2024-01-16T16:30:00Z',
    triggerCount: 2
  },
  {
    id: '5',
    name: 'Email Important Reçu',
    description: 'Notifier la réception d\'emails importants',
    isActive: true,
    trigger: {
      type: 'email',
      event: 'email_received',
      source: 'email-service'
    },
    conditions: [
      { id: '1', field: 'priority', operator: 'equals', value: 'HIGH', type: 'string' },
      { id: '2', field: 'from', operator: 'contains', value: '@client-important.com', type: 'string', logic: 'OR' }
    ],
    notification: {
      type: 'info',
      category: 'utilisateur',
      titleTemplate: 'Email important reçu',
      messageTemplate: 'Nouveau message de {{from_name}} ({{from_email}}): {{subject}}',
      priority: 'HIGH',
      recipientType: 'role',
      recipientIds: ['admin', 'sales_manager'],
      actionUrl: '/emails/{{email_id}}',
      actionLabel: 'Lire l\'email',
      persistent: true,
      expiresIn: 72
    },
    createdAt: '2024-01-11T14:45:00Z',
    lastTriggered: '2024-01-16T09:20:00Z',
    triggerCount: 12
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const triggerType = searchParams.get('triggerType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filteredRules = notificationRules

    // Filtrer par statut actif
    if (isActive !== null) {
      filteredRules = filteredRules.filter(rule => 
        rule.isActive === (isActive === 'true')
      )
    }

    // Filtrer par type de déclencheur
    if (triggerType) {
      filteredRules = filteredRules.filter(rule => 
        rule.trigger.type === triggerType
      )
    }

    // Pagination
    const total = filteredRules.length
    const rules = filteredRules.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        rules,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching notification rules:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des règles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données requises
    if (!body.name || !body.trigger || !body.notification) {
      return NextResponse.json(
        { success: false, error: 'Nom, déclencheur et configuration de notification sont requis' },
        { status: 400 }
      )
    }

    // Vérifier l'unicité du nom
    const existingRule = notificationRules.find(rule => rule.name === body.name)
    if (existingRule) {
      return NextResponse.json(
        { success: false, error: 'Une règle avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    // Créer la nouvelle règle
    const newRule: NotificationRule = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description || '',
      isActive: body.isActive ?? true,
      trigger: body.trigger,
      conditions: body.conditions || [],
      notification: body.notification,
      createdAt: new Date().toISOString(),
      triggerCount: 0
    }

    notificationRules.push(newRule)

    return NextResponse.json({
      success: true,
      data: newRule
    })

  } catch (error) {
    console.error('Error creating notification rule:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la règle' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de la règle requis' },
        { status: 400 }
      )
    }

    const ruleIndex = notificationRules.findIndex(rule => rule.id === id)
    if (ruleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Règle non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier l'unicité du nom si modifié
    if (updates.name && updates.name !== notificationRules[ruleIndex].name) {
      const existingRule = notificationRules.find(rule => rule.name === updates.name)
      if (existingRule) {
        return NextResponse.json(
          { success: false, error: 'Une règle avec ce nom existe déjà' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour la règle
    notificationRules[ruleIndex] = {
      ...notificationRules[ruleIndex],
      ...updates
    }

    return NextResponse.json({
      success: true,
      data: notificationRules[ruleIndex]
    })

  } catch (error) {
    console.error('Error updating notification rule:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la règle' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de la règle requis' },
        { status: 400 }
      )
    }

    const ruleIndex = notificationRules.findIndex(rule => rule.id === id)
    if (ruleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Règle non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer la règle
    notificationRules.splice(ruleIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Règle supprimée avec succès'
    })

  } catch (error) {
    console.error('Error deleting notification rule:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la règle' },
      { status: 500 }
    )
  }
}