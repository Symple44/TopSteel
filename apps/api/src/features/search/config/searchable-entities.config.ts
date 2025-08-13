import type { AnyDatabaseRecord } from '../types/search-types'

export interface SearchableField {
  name: string
  weight: number // Importance dans la recherche (1-10)
  type: 'text' | 'keyword' | 'number' | 'date'
}

export interface SearchableEntity {
  // Identité
  type: string // Type pour la recherche (client, article, etc.)
  tableName: string // Nom de la table en base
  entityName: string // Nom de l'entité TypeORM
  displayName: string // Nom affiché à l'utilisateur

  // Configuration recherche
  searchableFields: {
    primary: SearchableField[] // Champs principaux (codes, noms)
    secondary: SearchableField[] // Champs secondaires (descriptions)
    metadata: SearchableField[] // Métadonnées (types, catégories)
  }

  // Configuration affichage
  icon: string // Icône Lucide
  urlPattern: string // Pattern URL avec {id}

  // Configuration technique
  database: 'auth' | 'shared' | 'tenant' // Base de données
  priority: number // Priorité dans les résultats (1-10)
  enabled: boolean // Actif/Inactif

  // Sécurité
  requiresPermission?: string // Permission requise
  requiresRole?: string[] // Rôles requis
}

// Configuration des entités recherchables
export const SEARCHABLE_ENTITIES: SearchableEntity[] = [
  // ========== MENUS ==========
  {
    type: 'menu',
    tableName: 'menu_items',
    entityName: 'MenuItem',
    displayName: 'Menu',
    searchableFields: {
      primary: [
        { name: 'title', weight: 10, type: 'text' },
        { name: 'programId', weight: 8, type: 'keyword' },
      ],
      secondary: [],
      metadata: [{ name: 'type', weight: 3, type: 'keyword' }],
    },
    icon: 'menu',
    urlPattern: '{programId}',
    database: 'auth',
    priority: 10,
    enabled: true,
  },

  // ========== PARTNERS (Clients/Fournisseurs) ==========
  {
    type: 'client',
    tableName: 'partners',
    entityName: 'Partner',
    displayName: 'Client',
    searchableFields: {
      primary: [
        { name: 'code', weight: 10, type: 'keyword' },
        { name: 'denomination', weight: 9, type: 'text' },
        { name: 'denomination_commerciale', weight: 8, type: 'text' },
      ],
      secondary: [
        { name: 'email', weight: 7, type: 'keyword' },
        { name: 'siret', weight: 6, type: 'keyword' },
      ],
      metadata: [
        { name: 'ville', weight: 4, type: 'text' },
        { name: 'code_postal', weight: 3, type: 'keyword' },
        { name: 'type', weight: 5, type: 'keyword' },
      ],
    },
    icon: 'users',
    urlPattern: '/partners/clients?id={id}',
    database: 'tenant',
    priority: 9,
    enabled: true,
  },

  {
    type: 'fournisseur',
    tableName: 'partners',
    entityName: 'Partner',
    displayName: 'Fournisseur',
    searchableFields: {
      primary: [
        { name: 'code', weight: 10, type: 'keyword' },
        { name: 'denomination', weight: 9, type: 'text' },
        { name: 'denomination_commerciale', weight: 8, type: 'text' },
      ],
      secondary: [
        { name: 'email', weight: 7, type: 'keyword' },
        { name: 'siret', weight: 6, type: 'keyword' },
      ],
      metadata: [
        { name: 'ville', weight: 4, type: 'text' },
        { name: 'code_postal', weight: 3, type: 'keyword' },
        { name: 'type', weight: 5, type: 'keyword' },
      ],
    },
    icon: 'truck',
    urlPattern: '/partners/suppliers?id={id}',
    database: 'tenant',
    priority: 8,
    enabled: true,
  },

  // ========== ARTICLES ==========
  {
    type: 'article',
    tableName: 'articles',
    entityName: 'Article',
    displayName: 'Article',
    searchableFields: {
      primary: [
        { name: 'reference', weight: 10, type: 'keyword' },
        { name: 'designation', weight: 9, type: 'text' },
      ],
      secondary: [
        { name: 'description', weight: 7, type: 'text' },
        { name: 'code_ean', weight: 6, type: 'keyword' },
      ],
      metadata: [
        { name: 'famille', weight: 5, type: 'keyword' },
        { name: 'sous_famille', weight: 4, type: 'keyword' },
        { name: 'marque', weight: 4, type: 'keyword' },
        { name: 'modele', weight: 3, type: 'text' },
      ],
    },
    icon: 'package',
    urlPattern: '/inventory/articles/{id}',
    database: 'tenant',
    priority: 8,
    enabled: true,
  },

  // ========== MATERIALS (DISABLED - Table not created yet) ==========
  {
    type: 'material',
    tableName: 'materials',
    entityName: 'Material',
    displayName: 'Matériau',
    searchableFields: {
      primary: [
        { name: 'reference', weight: 10, type: 'keyword' },
        { name: 'nom', weight: 9, type: 'text' },
      ],
      secondary: [
        { name: 'description', weight: 7, type: 'text' },
        { name: 'nuance', weight: 6, type: 'keyword' },
        { name: 'qualite', weight: 6, type: 'keyword' },
      ],
      metadata: [
        { name: 'type', weight: 5, type: 'keyword' },
        { name: 'forme', weight: 5, type: 'keyword' },
        { name: 'marque', weight: 4, type: 'keyword' },
        { name: 'emplacement', weight: 3, type: 'text' },
      ],
    },
    icon: 'layers',
    urlPattern: '/inventory/materials/{id}',
    database: 'tenant',
    priority: 7,
    enabled: false, // DISABLED until table is created
  },

  // ========== SHARED MATERIALS ==========
  {
    type: 'shared_material',
    tableName: 'shared_materials',
    entityName: 'SharedMaterial',
    displayName: 'Matériau partagé',
    searchableFields: {
      primary: [
        { name: 'code', weight: 10, type: 'keyword' },
        { name: 'nom', weight: 9, type: 'text' },
      ],
      secondary: [{ name: 'description', weight: 7, type: 'text' }],
      metadata: [
        { name: 'type', weight: 5, type: 'keyword' },
        { name: 'forme', weight: 5, type: 'keyword' },
      ],
    },
    icon: 'share-2',
    urlPattern: '/inventory/materials/{id}',
    database: 'shared',
    priority: 6,
    enabled: true,
  },

  // ========== PROJETS (DISABLED - Table not created yet) ==========
  {
    type: 'projet',
    tableName: 'projets',
    entityName: 'Projet',
    displayName: 'Projet',
    searchableFields: {
      primary: [
        { name: 'code', weight: 10, type: 'keyword' },
        { name: 'nom', weight: 9, type: 'text' },
      ],
      secondary: [{ name: 'description', weight: 7, type: 'text' }],
      metadata: [{ name: 'statut', weight: 5, type: 'keyword' }],
    },
    icon: 'folder',
    urlPattern: '/projects/{id}',
    database: 'tenant',
    priority: 9,
    enabled: false, // DISABLED until table is created
  },

  // ========== DEVIS (DISABLED - Table not created yet) ==========
  {
    type: 'devis',
    tableName: 'devis',
    entityName: 'Devis',
    displayName: 'Devis',
    searchableFields: {
      primary: [
        { name: 'numero', weight: 10, type: 'keyword' },
        { name: 'objet', weight: 8, type: 'text' },
      ],
      secondary: [],
      metadata: [{ name: 'statut', weight: 5, type: 'keyword' }],
    },
    icon: 'file-text',
    urlPattern: '/sales/quotes/{id}',
    database: 'tenant',
    priority: 7,
    enabled: false, // DISABLED until table is created
  },

  // ========== FACTURES (DISABLED - Table not created yet) ==========
  {
    type: 'facture',
    tableName: 'factures',
    entityName: 'Facture',
    displayName: 'Facture',
    searchableFields: {
      primary: [
        { name: 'numero', weight: 10, type: 'keyword' },
        { name: 'objet', weight: 8, type: 'text' },
      ],
      secondary: [],
      metadata: [
        { name: 'statut', weight: 5, type: 'keyword' },
        { name: 'montant_total', weight: 4, type: 'number' },
      ],
    },
    icon: 'receipt',
    urlPattern: '/finance/invoices/{id}',
    database: 'tenant',
    priority: 7,
    enabled: false, // DISABLED until table is created
  },

  // ========== COMMANDES ==========
  {
    type: 'commande',
    tableName: 'commandes',
    entityName: 'Commande',
    displayName: 'Commande',
    searchableFields: {
      primary: [
        { name: 'numero', weight: 10, type: 'keyword' },
        { name: 'objet', weight: 8, type: 'text' },
      ],
      secondary: [],
      metadata: [{ name: 'statut', weight: 5, type: 'keyword' }],
    },
    icon: 'shopping-cart',
    urlPattern: '/sales/orders/{id}',
    database: 'tenant',
    priority: 7,
    enabled: true,
  },

  // ========== USERS ==========
  {
    type: 'user',
    tableName: 'users',
    entityName: 'User',
    displayName: 'Utilisateur',
    searchableFields: {
      primary: [
        { name: 'email', weight: 10, type: 'keyword' },
        { name: 'nom', weight: 9, type: 'text' },
        { name: 'prenom', weight: 9, type: 'text' },
      ],
      secondary: [{ name: 'acronyme', weight: 6, type: 'keyword' }],
      metadata: [],
    },
    icon: 'user',
    urlPattern: '/admin/users/{id}',
    database: 'auth',
    priority: 5,
    enabled: true,
    requiresPermission: 'users.read',
  },

  // ========== SOCIETES ==========
  {
    type: 'societe',
    tableName: 'societes',
    entityName: 'Societe',
    displayName: 'Société',
    searchableFields: {
      primary: [
        { name: 'nom', weight: 10, type: 'text' },
        { name: 'code', weight: 9, type: 'keyword' },
      ],
      secondary: [
        { name: 'siret', weight: 7, type: 'keyword' },
        { name: 'email', weight: 6, type: 'keyword' },
      ],
      metadata: [{ name: 'ville', weight: 4, type: 'text' }],
    },
    icon: 'building',
    urlPattern: '/admin/societes?id={id}',
    database: 'auth',
    priority: 6,
    enabled: true,
    requiresRole: ['admin', 'super_admin'],
  },

  // ========== PRICE RULES ==========
  {
    type: 'price_rule',
    tableName: 'price_rules',
    entityName: 'PriceRule',
    displayName: 'Règle tarifaire',
    searchableFields: {
      primary: [{ name: 'ruleName', weight: 10, type: 'text' }],
      secondary: [{ name: 'description', weight: 7, type: 'text' }],
      metadata: [{ name: 'articleFamily', weight: 5, type: 'keyword' }],
    },
    icon: 'calculator',
    urlPattern: '/settings/pricing/{id}',
    database: 'tenant',
    priority: 4,
    enabled: true,
    requiresPermission: 'pricing.read',
  },

  // ========== NOTIFICATIONS ==========
  {
    type: 'notification',
    tableName: 'notifications',
    entityName: 'Notification',
    displayName: 'Notification',
    searchableFields: {
      primary: [{ name: 'title', weight: 10, type: 'text' }],
      secondary: [{ name: 'message', weight: 7, type: 'text' }],
      metadata: [{ name: 'category', weight: 5, type: 'keyword' }],
    },
    icon: 'bell',
    urlPattern: '/admin/notifications?id={id}',
    database: 'auth', // Changed from tenant to auth - table is in auth database
    priority: 3,
    enabled: true,
  },

  // ========== QUERY BUILDER ==========
  {
    type: 'query',
    tableName: 'query_builders',
    entityName: 'QueryBuilder',
    displayName: 'Requête',
    searchableFields: {
      primary: [{ name: 'name', weight: 10, type: 'text' }],
      secondary: [{ name: 'description', weight: 7, type: 'text' }],
      metadata: [{ name: 'mainTable', weight: 5, type: 'keyword' }],
    },
    icon: 'database',
    urlPattern: '/query-builder/{id}/view',
    database: 'tenant',
    priority: 4,
    enabled: true,
    requiresPermission: 'query_builder.read',
  },
]

// Fonction helper pour obtenir les entités par base de données
export function getEntitiesByDatabase(database: 'auth' | 'shared' | 'tenant'): SearchableEntity[] {
  return SEARCHABLE_ENTITIES.filter((entity) => entity.database === database && entity.enabled)
}

// Fonction helper pour obtenir une entité par type
export function getEntityByType(type: string): SearchableEntity | undefined {
  return SEARCHABLE_ENTITIES.find((entity) => entity.type === type && entity.enabled)
}

// Fonction helper pour obtenir les entités accessibles selon les permissions
export function getAccessibleEntities(
  permissions: string[] = [],
  roles: string[] = []
): SearchableEntity[] {
  return SEARCHABLE_ENTITIES.filter((entity) => {
    if (!entity.enabled) return false

    // Vérifier les permissions
    if (entity.requiresPermission && !permissions.includes(entity.requiresPermission)) {
      return false
    }

    // Vérifier les rôles
    if (entity.requiresRole && entity.requiresRole.length > 0) {
      const hasRole = entity.requiresRole.some((role) => roles.includes(role))
      if (!hasRole) return false
    }

    return true
  })
}

// Fonction pour générer la requête SQL de recherche pour une entité
export function generateSearchQuery(
  entity: SearchableEntity,
  searchTerm: string,
  tenantId?: string
): { query: string; params: (string | number)[] } {
  const searchPattern = `%${searchTerm}%`
  const params: (string | number)[] = []

  // Construire les conditions de recherche
  const searchConditions: string[] = []

  // Champs primaires
  entity.searchableFields.primary.forEach((field) => {
    if (field.type === 'text' || field.type === 'keyword') {
      searchConditions.push(`"${field.name}" ILIKE $${params.length + 1}`)
      params.push(searchPattern)
    }
  })

  // Champs secondaires
  entity.searchableFields.secondary.forEach((field) => {
    if (field.type === 'text' || field.type === 'keyword') {
      searchConditions.push(`"${field.name}" ILIKE $${params.length + 1}`)
      params.push(searchPattern)
    }
  })

  // Construire la liste des colonnes à sélectionner
  const selectColumns: string[] = ['id::text as id']

  // Ajouter les champs primaires
  entity.searchableFields.primary.forEach((field) => {
    selectColumns.push(`"${field.name}"`)
  })

  // Ajouter les champs secondaires s'ils existent
  if (entity.searchableFields.secondary.length > 0) {
    entity.searchableFields.secondary.forEach((field) => {
      selectColumns.push(`"${field.name}"`)
    })
  }

  // Ajouter les champs metadata s'ils existent
  if (entity.searchableFields.metadata.length > 0) {
    entity.searchableFields.metadata.forEach((field) => {
      selectColumns.push(`"${field.name}"`)
    })
  }

  // Construire la requête
  let query = `
    SELECT 
      ${selectColumns.join(', ')}
    FROM ${entity.tableName}
    WHERE (${searchConditions.join(' OR ')})
  `

  // Ajouter le filtre tenant si nécessaire
  if (entity.database === 'tenant' && tenantId) {
    query += ` AND tenant_id = $${params.length + 1}`
    params.push(tenantId)
  }

  // Filtres spécifiques par type
  if (entity.type === 'client') {
    query += ` AND type = 'CLIENT'`
  } else if (entity.type === 'fournisseur') {
    query += ` AND type = 'SUPPLIER'`
  } else if (entity.type === 'menu') {
    // Pour les menus, filtrer par visibilité
    query += ` AND "isVisible" = true`
  }

  query += ` LIMIT 20`

  return { query, params }
}

// Fonction pour calculer le score de pertinence
export function calculateRelevanceScore(
  entity: SearchableEntity,
  record: AnyDatabaseRecord,
  searchTerm: string
): number {
  let score = 0
  const lowerSearchTerm = searchTerm.toLowerCase()

  // Score basé sur les champs primaires
  entity.searchableFields.primary.forEach((field) => {
    const value = record[field.name]
    if (value) {
      const lowerValue = value.toString().toLowerCase()
      if (lowerValue === lowerSearchTerm) {
        score += field.weight * 10 // Match exact
      } else if (lowerValue.startsWith(lowerSearchTerm)) {
        score += field.weight * 7 // Match au début
      } else if (lowerValue.includes(lowerSearchTerm)) {
        score += field.weight * 4 // Match partiel
      }
    }
  })

  // Score basé sur les champs secondaires
  entity.searchableFields.secondary.forEach((field) => {
    const value = record[field.name]
    if (value) {
      const lowerValue = value.toString().toLowerCase()
      if (lowerValue.includes(lowerSearchTerm)) {
        score += field.weight * 2
      }
    }
  })

  // Bonus pour la priorité de l'entité
  score += entity.priority * 2

  return score
}

// Export de la configuration pour l'indexation ElasticSearch
export function getElasticsearchMapping(): Record<string, unknown> {
  return {
    properties: {
      type: { type: 'keyword' },
      id: { type: 'keyword' },
      tenantId: { type: 'keyword' },
      title: {
        type: 'text',
        analyzer: 'french',
        fields: {
          keyword: { type: 'keyword' },
          suggest: { type: 'completion' },
        },
      },
      description: { type: 'text', analyzer: 'french' },
      code: { type: 'keyword' },
      reference: { type: 'keyword' },
      tags: { type: 'keyword' },
      url: { type: 'keyword' },
      icon: { type: 'keyword' },
      metadata: { type: 'object', enabled: false },
      searchableContent: { type: 'text', analyzer: 'french' },
      boost: { type: 'float' },
      lastModified: { type: 'date' },
      accessRoles: { type: 'keyword' },
      accessPermissions: { type: 'keyword' },
      // Champs spécifiques par type
      email: { type: 'keyword' },
      siret: { type: 'keyword' },
      ville: { type: 'text', analyzer: 'french' },
      codePostal: { type: 'keyword' },
      famille: { type: 'keyword' },
      sousFamille: { type: 'keyword' },
      marque: { type: 'keyword' },
      statut: { type: 'keyword' },
      montant: { type: 'float' },
    },
  }
}
