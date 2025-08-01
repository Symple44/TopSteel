import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

// Fonction utilitaire pour récupérer l'authentification
function getAuthHeaders(request: NextRequest): Record<string, string> {
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie')

  let accessToken = null
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim())
    const accessTokenCookie = cookies.find((c) => c.startsWith('accessToken='))
    if (accessTokenCookie) {
      accessToken = accessTokenCookie.split('=')[1]
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
    const _apiUrl =
      process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3002'
    const _headers = getAuthHeaders(request)
    const { searchParams } = new URL(request.url)
    const schema = searchParams.get('schema') || 'public'

    // Essayer d'appeler le backend directement
    try {
      const response = await callBackendFromApi(
        request,
        `query-builder/schema/tables/${tableName}/columns?schema=${schema}`,
        {
          method: 'GET',
        }
      )

      if (response.ok) {
        const columns = await response.json()
        return NextResponse.json(columns)
      } else {
        // Fallback sur des données mockées
      }
    } catch (_backendError) {
      // Fallback sur des données mockées
    }
    const mockColumns: Record<string, any[]> = {
      clients: [
        {
          columnName: 'id',
          dataType: 'integer',
          isPrimaryKey: true,
          isForeignKey: false,
          comment: 'Client ID',
        },
        {
          columnName: 'company_id',
          dataType: 'integer',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Company ID (tenant)',
        },
        {
          columnName: 'nom',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Client name',
        },
        {
          columnName: 'code',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Client code',
        },
        {
          columnName: 'type',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Client type',
        },
        {
          columnName: 'siret',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'SIRET number',
        },
        {
          columnName: 'adresse',
          dataType: 'text',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Address',
        },
        {
          columnName: 'telephone',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Phone number',
        },
        {
          columnName: 'email',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Email address',
        },
        {
          columnName: 'actif',
          dataType: 'boolean',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Is active',
        },
        {
          columnName: 'created_at',
          dataType: 'timestamp',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Creation date',
        },
        {
          columnName: 'updated_at',
          dataType: 'timestamp',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Last update',
        },
      ],
      commandes: [
        {
          columnName: 'id',
          dataType: 'integer',
          isPrimaryKey: true,
          isForeignKey: false,
          comment: 'Order ID',
        },
        {
          columnName: 'company_id',
          dataType: 'integer',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Company ID (tenant)',
        },
        {
          columnName: 'client_id',
          dataType: 'integer',
          isPrimaryKey: false,
          isForeignKey: true,
          comment: 'Client ID',
        },
        {
          columnName: 'numero',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Order number',
        },
        {
          columnName: 'date_commande',
          dataType: 'date',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Order date',
        },
        {
          columnName: 'statut',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Order status',
        },
        {
          columnName: 'montant_ht',
          dataType: 'decimal',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Amount excluding tax',
        },
        {
          columnName: 'created_at',
          dataType: 'timestamp',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Creation date',
        },
      ],
      fournisseurs: [
        {
          columnName: 'id',
          dataType: 'integer',
          isPrimaryKey: true,
          isForeignKey: false,
          comment: 'Supplier ID',
        },
        {
          columnName: 'company_id',
          dataType: 'integer',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Company ID (tenant)',
        },
        {
          columnName: 'nom',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Supplier name',
        },
        {
          columnName: 'code',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Supplier code',
        },
        {
          columnName: 'type',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Supplier type',
        },
        {
          columnName: 'email',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Email address',
        },
        {
          columnName: 'actif',
          dataType: 'boolean',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Is active',
        },
        {
          columnName: 'created_at',
          dataType: 'timestamp',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Creation date',
        },
      ],
      materiaux: [
        {
          columnName: 'id',
          dataType: 'integer',
          isPrimaryKey: true,
          isForeignKey: false,
          comment: 'Material ID',
        },
        {
          columnName: 'company_id',
          dataType: 'integer',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Company ID (tenant)',
        },
        {
          columnName: 'nom',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Material name',
        },
        {
          columnName: 'reference',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Material reference',
        },
        {
          columnName: 'type',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Material type',
        },
        {
          columnName: 'prix_unitaire',
          dataType: 'decimal',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Unit price',
        },
        {
          columnName: 'actif',
          dataType: 'boolean',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Is active',
        },
      ],
      stocks: [
        {
          columnName: 'id',
          dataType: 'integer',
          isPrimaryKey: true,
          isForeignKey: false,
          comment: 'Stock ID',
        },
        {
          columnName: 'company_id',
          dataType: 'integer',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Company ID (tenant)',
        },
        {
          columnName: 'materiau_id',
          dataType: 'integer',
          isPrimaryKey: false,
          isForeignKey: true,
          comment: 'Material ID',
        },
        {
          columnName: 'quantite',
          dataType: 'decimal',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Quantity',
        },
        {
          columnName: 'emplacement',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Location',
        },
        {
          columnName: 'valeur_stock',
          dataType: 'decimal',
          isPrimaryKey: false,
          isForeignKey: false,
          comment: 'Stock value',
        },
      ],
    }

    const columns = mockColumns[tableName] || [
      {
        columnName: 'id',
        dataType: 'integer',
        isPrimaryKey: true,
        isForeignKey: false,
        comment: 'Primary key',
      },
      {
        columnName: 'company_id',
        dataType: 'integer',
        isPrimaryKey: false,
        isForeignKey: false,
        comment: 'Company ID (tenant)',
      },
      {
        columnName: 'created_at',
        dataType: 'timestamp',
        isPrimaryKey: false,
        isForeignKey: false,
        comment: 'Creation date',
      },
    ]
    return NextResponse.json(columns)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get columns' },
      { status: 500 }
    )
  }
}
