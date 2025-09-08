import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

// Fonction utilitaire pour récupérer l'authentification
function getAuthHeaders(request: NextRequest): Record<string, string> {
  const authHeader = request?.headers?.get('authorization')
  const cookieHeader = request?.headers?.get('cookie')

  let accessToken: string | null = null
  if (cookieHeader) {
    const cookies = cookieHeader?.split(';').map((c) => c?.trim())
    const accessTokenCookie = cookies?.find((c) => c?.startsWith('accessToken='))
    if (accessTokenCookie) {
      accessToken = accessTokenCookie?.split('=')[1]
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authHeader) {
    headers.Authorization = authHeader
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  if (cookieHeader) {
    headers.Cookie = cookieHeader
  }

  return headers
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const { tableName } = await params

  try {
    const _headers = getAuthHeaders(request)
    const { searchParams } = new URL(request.url)
    const schema = searchParams?.get('schema') || 'public'

    // Essayer d'appeler le backend directement
    try {
      const response = await callBackendFromApi(
        request,
        `query-builder/schema/tables/${tableName}/columns?schema=${schema}`,
        {
          method: 'GET',
        }
      )

      if (response?.ok) {
        const columns = await response?.json()
        return NextResponse?.json(columns)
      } else {
        // Fallback sur des données mockées
      }
    } catch (_backendError) {
      // Fallback sur des données mockées
    }
    const mockColumns: Record<
      string,
      Array<{
        name: string
        type: string
        nullable?: boolean
        default?: unknown
        description?: string
      }>
    > = {
      clients: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          description: 'Client ID',
        },
        {
          name: 'company_id',
          type: 'integer',
          nullable: true,
          description: 'Company ID (tenant)',
        },
        {
          name: 'nom',
          type: 'varchar',
          nullable: true,
          description: 'Client name',
        },
        {
          name: 'code',
          type: 'varchar',
          nullable: true,
          description: 'Client code',
        },
        {
          name: 'type',
          type: 'varchar',
          nullable: true,
          description: 'Client type',
        },
        {
          name: 'siret',
          type: 'varchar',
          nullable: true,
          description: 'SIRET number',
        },
        {
          name: 'adresse',
          type: 'text',
          nullable: true,
          description: 'Address',
        },
        {
          name: 'telephone',
          type: 'varchar',
          nullable: true,
          description: 'Phone number',
        },
        {
          name: 'email',
          type: 'varchar',
          nullable: true,
          description: 'Email address',
        },
        {
          name: 'actif',
          type: 'boolean',
          nullable: true,
          description: 'Is active',
        },
        {
          name: 'created_at',
          type: 'timestamp',
          nullable: true,
          description: 'Creation date',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          nullable: true,
          description: 'Last update',
        },
      ],
      commandes: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          description: 'Order ID',
        },
        {
          name: 'company_id',
          type: 'integer',
          nullable: true,
          description: 'Company ID (tenant)',
        },
        {
          name: 'client_id',
          type: 'integer',
          nullable: true,
          description: 'Client ID',
        },
        {
          name: 'numero',
          type: 'varchar',
          nullable: true,
          description: 'Order number',
        },
        {
          name: 'date_commande',
          type: 'date',
          nullable: true,
          description: 'Order date',
        },
        {
          name: 'statut',
          type: 'varchar',
          nullable: true,
          description: 'Order status',
        },
        {
          name: 'montant_ht',
          type: 'decimal',
          nullable: true,
          description: 'Amount excluding tax',
        },
        {
          name: 'created_at',
          type: 'timestamp',
          nullable: true,
          description: 'Creation date',
        },
      ],
      fournisseurs: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          description: 'Supplier ID',
        },
        {
          name: 'company_id',
          type: 'integer',
          nullable: true,
          description: 'Company ID (tenant)',
        },
        {
          name: 'nom',
          type: 'varchar',
          nullable: true,
          description: 'Supplier name',
        },
        {
          name: 'code',
          type: 'varchar',
          nullable: true,
          description: 'Supplier code',
        },
        {
          name: 'type',
          type: 'varchar',
          nullable: true,
          description: 'Supplier type',
        },
        {
          name: 'email',
          type: 'varchar',
          nullable: true,
          description: 'Email address',
        },
        {
          name: 'actif',
          type: 'boolean',
          nullable: true,
          description: 'Is active',
        },
        {
          name: 'created_at',
          type: 'timestamp',
          nullable: true,
          description: 'Creation date',
        },
      ],
      materiaux: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          description: 'Material ID',
        },
        {
          name: 'company_id',
          type: 'integer',
          nullable: true,
          description: 'Company ID (tenant)',
        },
        {
          name: 'nom',
          type: 'varchar',
          nullable: true,
          description: 'Material name',
        },
        {
          name: 'reference',
          type: 'varchar',
          nullable: true,
          description: 'Material reference',
        },
        {
          name: 'type',
          type: 'varchar',
          nullable: true,
          description: 'Material type',
        },
        {
          name: 'prix_unitaire',
          type: 'decimal',
          nullable: true,
          description: 'Unit price',
        },
        {
          name: 'actif',
          type: 'boolean',
          nullable: true,
          description: 'Is active',
        },
      ],
      stocks: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          description: 'Stock ID',
        },
        {
          name: 'company_id',
          type: 'integer',
          nullable: true,
          description: 'Company ID (tenant)',
        },
        {
          name: 'materiau_id',
          type: 'integer',
          nullable: true,
          description: 'Material ID',
        },
        {
          name: 'quantite',
          type: 'decimal',
          nullable: true,
          description: 'Quantity',
        },
        {
          name: 'emplacement',
          type: 'varchar',
          nullable: true,
          description: 'Location',
        },
        {
          name: 'valeur_stock',
          type: 'decimal',
          nullable: true,
          description: 'Stock value',
        },
      ],
    }

    const columns = mockColumns[tableName] || [
      {
        name: 'id',
        type: 'integer',
        nullable: false,
        description: 'Primary key',
      },
      {
        name: 'company_id',
        type: 'integer',
        nullable: true,
        description: 'Company ID (tenant)',
      },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: true,
        description: 'Creation date',
      },
    ]
    return NextResponse?.json(columns)
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Failed to get columns' },
      { status: 500 }
    )
  }
}
