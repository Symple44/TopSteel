import { type NextRequest, NextResponse } from 'next/server'

// Interface pour les paramètres système
interface SystemParameter {
  id: string
  key: string
  value: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ENUM'
  category:
    | 'GENERAL'
    | 'COMPTABILITE'
    | 'PROJETS'
    | 'PRODUCTION'
    | 'ACHATS'
    | 'STOCKS'
    | 'NOTIFICATION'
    | 'SECURITY'
    | 'ELASTICSEARCH'
  description: string
  defaultValue?: string
  isEditable: boolean
  isSecret: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// Données mockées pour le développement
const mockParameters: SystemParameter[] = [
  {
    id: '1',
    key: 'COMPANY_NAME',
    value: 'TopSteel SARL',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Nom de la société',
    defaultValue: 'TopSteel SARL',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    key: 'COMPANY_ADDRESS',
    value: '123 Rue de la Métallurgie, 75000 Paris',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Adresse de la société',
    defaultValue: '123 Rue de la Métallurgie, 75000 Paris',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    key: 'COMPANY_PHONE',
    value: '01 23 45 67 89',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Téléphone de la société',
    defaultValue: '01 23 45 67 89',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    key: 'COMPANY_EMAIL',
    value: 'contact@topsteel.tech',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Email de la société',
    defaultValue: 'contact@topsteel.tech',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    key: 'COMPANY_SIRET',
    value: '12345678901234',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Numéro SIRET',
    defaultValue: '12345678901234',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    key: 'COMPANY_TVA',
    value: 'FR12345678901',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Numéro TVA',
    defaultValue: 'FR12345678901',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    key: 'DEFAULT_CURRENCY',
    value: 'EUR',
    type: 'ENUM',
    category: 'COMPTABILITE',
    description: 'Devise par défaut',
    defaultValue: 'EUR',
    isEditable: true,
    isSecret: false,
    metadata: { enum: ['EUR', 'USD', 'GBP'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    key: 'DEFAULT_VAT_RATE',
    value: '20',
    type: 'NUMBER',
    category: 'COMPTABILITE',
    description: 'Taux TVA par défaut (%)',
    defaultValue: '20',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '9',
    key: 'WEIGHT_UNIT',
    value: 'kg',
    type: 'ENUM',
    category: 'PRODUCTION',
    description: 'Unité de poids par défaut',
    defaultValue: 'kg',
    isEditable: true,
    isSecret: false,
    metadata: { enum: ['kg', 't', 'g'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10',
    key: 'LENGTH_UNIT',
    value: 'mm',
    type: 'ENUM',
    category: 'PRODUCTION',
    description: 'Unité de longueur par défaut',
    defaultValue: 'mm',
    isEditable: true,
    isSecret: false,
    metadata: { enum: ['mm', 'cm', 'm'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Paramètres Elasticsearch
  {
    id: '11',
    key: 'elasticsearch.url',
    value: 'http://localhost:9200',
    type: 'STRING',
    category: 'ELASTICSEARCH',
    description: 'URL du serveur Elasticsearch',
    defaultValue: 'http://localhost:9200',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '12',
    key: 'elasticsearch.username',
    value: '',
    type: 'STRING',
    category: 'ELASTICSEARCH',
    description: "Nom d'utilisateur Elasticsearch",
    defaultValue: '',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '13',
    key: 'elasticsearch.password',
    value: '',
    type: 'STRING',
    category: 'ELASTICSEARCH',
    description: 'Mot de passe Elasticsearch',
    defaultValue: '',
    isEditable: true,
    isSecret: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '14',
    key: 'elasticsearch.enableAuth',
    value: 'false',
    type: 'BOOLEAN',
    category: 'ELASTICSEARCH',
    description: "Activer l'authentification Elasticsearch",
    defaultValue: 'false',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '15',
    key: 'elasticsearch.indexPrefix',
    value: 'topsteel',
    type: 'STRING',
    category: 'ELASTICSEARCH',
    description: 'Préfixe des index Elasticsearch',
    defaultValue: 'topsteel',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '16',
    key: 'elasticsearch.maxRetries',
    value: '3',
    type: 'NUMBER',
    category: 'ELASTICSEARCH',
    description: 'Nombre maximum de tentatives',
    defaultValue: '3',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '17',
    key: 'elasticsearch.requestTimeout',
    value: '30000',
    type: 'NUMBER',
    category: 'ELASTICSEARCH',
    description: 'Timeout des requêtes (ms)',
    defaultValue: '30000',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '18',
    key: 'elasticsearch.batchSize',
    value: '100',
    type: 'NUMBER',
    category: 'ELASTICSEARCH',
    description: "Taille des lots pour l'indexation",
    defaultValue: '100',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '19',
    key: 'elasticsearch.enableLogging',
    value: 'false',
    type: 'BOOLEAN',
    category: 'ELASTICSEARCH',
    description: 'Activer les logs détaillés',
    defaultValue: 'false',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Paramètres d'authentification
  {
    id: '20',
    key: 'GOOGLE_OAUTH_ENABLED',
    value: 'false',
    type: 'BOOLEAN',
    category: 'SECURITY',
    description: "Activer l'authentification Google OAuth",
    defaultValue: 'false',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '21',
    key: 'GOOGLE_OAUTH_CLIENT_ID',
    value: '',
    type: 'STRING',
    category: 'SECURITY',
    description: 'Client ID Google OAuth',
    defaultValue: '',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '22',
    key: 'GOOGLE_OAUTH_CLIENT_SECRET',
    value: '',
    type: 'STRING',
    category: 'SECURITY',
    description: 'Client Secret Google OAuth',
    defaultValue: '',
    isEditable: true,
    isSecret: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '23',
    key: 'MICROSOFT_OAUTH_ENABLED',
    value: 'false',
    type: 'BOOLEAN',
    category: 'SECURITY',
    description: "Activer l'authentification Microsoft OAuth",
    defaultValue: 'false',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '24',
    key: 'MICROSOFT_OAUTH_CLIENT_ID',
    value: '',
    type: 'STRING',
    category: 'SECURITY',
    description: 'Client ID Microsoft OAuth',
    defaultValue: '',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '25',
    key: 'MICROSOFT_OAUTH_CLIENT_SECRET',
    value: '',
    type: 'STRING',
    category: 'SECURITY',
    description: 'Client Secret Microsoft OAuth',
    defaultValue: '',
    isEditable: true,
    isSecret: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '26',
    key: 'TWO_FACTOR_ENABLED',
    value: 'false',
    type: 'BOOLEAN',
    category: 'SECURITY',
    description: "Activer l'authentification à deux facteurs",
    defaultValue: 'false',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '27',
    key: 'TWO_FACTOR_ENFORCE',
    value: 'OPTIONAL',
    type: 'ENUM',
    category: 'SECURITY',
    description: "Politique d'application du 2FA",
    defaultValue: 'OPTIONAL',
    isEditable: true,
    isSecret: false,
    metadata: { enum: ['OPTIONAL', 'ALL_USERS', 'ADMINS_ONLY'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '28',
    key: 'SESSION_TIMEOUT_MINUTES',
    value: '480',
    type: 'NUMBER',
    category: 'SECURITY',
    description: 'Durée de session en minutes',
    defaultValue: '480',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '29',
    key: 'MAX_LOGIN_ATTEMPTS',
    value: '5',
    type: 'NUMBER',
    category: 'SECURITY',
    description: 'Nombre maximum de tentatives de connexion',
    defaultValue: '5',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '30',
    key: 'PASSWORD_MIN_LENGTH',
    value: '8',
    type: 'NUMBER',
    category: 'SECURITY',
    description: 'Longueur minimale des mots de passe',
    defaultValue: '8',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '31',
    key: 'PASSWORD_REQUIRE_UPPERCASE',
    value: 'true',
    type: 'BOOLEAN',
    category: 'SECURITY',
    description: 'Exiger des majuscules dans les mots de passe',
    defaultValue: 'true',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '32',
    key: 'PASSWORD_REQUIRE_LOWERCASE',
    value: 'true',
    type: 'BOOLEAN',
    category: 'SECURITY',
    description: 'Exiger des minuscules dans les mots de passe',
    defaultValue: 'true',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '33',
    key: 'PASSWORD_REQUIRE_NUMBERS',
    value: 'true',
    type: 'BOOLEAN',
    category: 'SECURITY',
    description: 'Exiger des chiffres dans les mots de passe',
    defaultValue: 'true',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '34',
    key: 'PASSWORD_REQUIRE_SPECIAL',
    value: 'false',
    type: 'BOOLEAN',
    category: 'SECURITY',
    description: 'Exiger des caractères spéciaux dans les mots de passe',
    defaultValue: 'false',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Stockage temporaire pour les mises à jour (en production, utiliser une base de données)
const parameters = [...mockParameters]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (category) {
      const filteredParams = parameters.filter((p) => p.category === category)
      return NextResponse.json(filteredParams)
    }

    return NextResponse.json(parameters)
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch system parameters' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates: Array<{ key: string; value: string }> = await request.json()

    // Mettre à jour les paramètres
    updates.forEach((update) => {
      const paramIndex = parameters.findIndex((p) => p.key === update.key)
      if (paramIndex !== -1) {
        // Paramètre existant : mettre à jour
        parameters[paramIndex] = {
          ...parameters[paramIndex],
          value: update.value,
          updatedAt: new Date().toISOString(),
        }
      } else {
        // Paramètre inexistant : créer un nouveau paramètre
        const newParam: SystemParameter = {
          id: Date.now().toString(),
          key: update.key,
          value: update.value,
          type: 'STRING',
          category: update.key.startsWith('elasticsearch.') ? 'ELASTICSEARCH' : 'GENERAL',
          description: `Paramètre ${update.key}`,
          defaultValue: update.value,
          isEditable: true,
          isSecret: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Ajuster le type selon la clé
        if (update.key.includes('enable') || update.key.includes('Auth')) {
          newParam.type = 'BOOLEAN'
        } else if (
          update.key.includes('timeout') ||
          update.key.includes('retries') ||
          update.key.includes('batchSize')
        ) {
          newParam.type = 'NUMBER'
        }

        parameters.push(newParam)
      }
    })

    // Retourner les paramètres mis à jour
    const updatedParams = parameters.filter((p) => updates.some((update) => update.key === p.key))

    return NextResponse.json(updatedParams)
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update system parameters' }, { status: 500 })
  }
}
