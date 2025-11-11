import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../utils/backend-api'

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

// Route de développement qui appelle directement le backend sans vérification stricte
export async function GET(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request)
    const { searchParams } = new URL(request.url)
    const schema = searchParams?.get('schema') || 'public'

    // Essayer d'appeler le backend directement
    try {
      const response = await callBackendFromApi(
        request,
        `query-builder/schema/tables?schema=${schema}`,
        {
          method: 'GET',
          headers,
        }
      )

      if (response?.ok) {
        const tables = await response?.json()
        return NextResponse?.json(tables)
      } else {
        // Fallback sur des données mockées
      }
    } catch (_backendError) {
      // Fallback sur des données mockées
    }
    const mockTables = [
      {
        name: 'clients',
        schema: 'topsteel_tenant',
        type: 'table',
        description: "Clients de l'entreprise",
        columns: [
          { name: 'id', type: 'integer', nullable: false, primary: true },
          { name: 'company_id', type: 'integer', nullable: false },
          { name: 'nom', type: 'varchar', nullable: false },
          { name: 'code', type: 'varchar', nullable: true },
          { name: 'type', type: 'varchar', nullable: false },
          { name: 'siret', type: 'varchar', nullable: true },
          { name: 'adresse', type: 'text', nullable: true },
          { name: 'code_postal', type: 'varchar', nullable: true },
          { name: 'ville', type: 'varchar', nullable: true },
          { name: 'pays', type: 'varchar', nullable: true },
          { name: 'telephone', type: 'varchar', nullable: true },
          { name: 'email', type: 'varchar', nullable: true },
          { name: 'contact_principal', type: 'varchar', nullable: true },
          { name: 'actif', type: 'boolean', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false },
          { name: 'updated_at', type: 'timestamp', nullable: false },
        ],
      },
      {
        name: 'fournisseurs',
        schema: 'topsteel_tenant',
        type: 'table',
        description: "Fournisseurs de l'entreprise",
        columns: [
          { name: 'id', type: 'integer', nullable: false, primary: true },
          { name: 'company_id', type: 'integer', nullable: false },
          { name: 'nom', type: 'varchar', nullable: false },
          { name: 'code', type: 'varchar', nullable: true },
          { name: 'type', type: 'varchar', nullable: false },
          { name: 'siret', type: 'varchar', nullable: true },
          { name: 'adresse', type: 'text', nullable: true },
          { name: 'telephone', type: 'varchar', nullable: true },
          { name: 'email', type: 'varchar', nullable: true },
          { name: 'contact_principal', type: 'varchar', nullable: true },
          { name: 'actif', type: 'boolean', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false },
          { name: 'updated_at', type: 'timestamp', nullable: false },
        ],
      },
      {
        name: 'materiaux',
        schema: 'topsteel_tenant',
        type: 'table',
        description: "Matériaux de l'entreprise",
        columns: [
          { name: 'id', type: 'integer', nullable: false, primary: true },
          { name: 'company_id', type: 'integer', nullable: false },
          { name: 'fournisseur_id', type: 'integer', nullable: true },
          { name: 'nom', type: 'varchar', nullable: false },
          { name: 'reference', type: 'varchar', nullable: true },
          { name: 'type', type: 'varchar', nullable: false },
          { name: 'categorie', type: 'varchar', nullable: false },
          { name: 'poids_unitaire', type: 'decimal', nullable: true },
          { name: 'prix_unitaire', type: 'decimal', nullable: true },
          { name: 'unite', type: 'varchar', nullable: false },
          { name: 'stock_minimum', type: 'decimal', nullable: false },
          { name: 'actif', type: 'boolean', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false },
          { name: 'updated_at', type: 'timestamp', nullable: false },
        ],
      },
      {
        name: 'stocks',
        schema: 'topsteel_tenant',
        type: 'table',
        description: "Stocks de l'entreprise",
        columns: [
          { name: 'id', type: 'integer', nullable: false, primary: true },
          { name: 'company_id', type: 'integer', nullable: false },
          { name: 'materiau_id', type: 'integer', nullable: false },
          { name: 'quantite', type: 'decimal', nullable: false },
          { name: 'quantite_reservee', type: 'decimal', nullable: false },
          { name: 'emplacement', type: 'varchar', nullable: true },
          { name: 'date_derniere_entree', type: 'timestamp', nullable: true },
          { name: 'date_derniere_sortie', type: 'timestamp', nullable: true },
          { name: 'valeur_stock', type: 'decimal', nullable: false },
          { name: 'actif', type: 'boolean', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false },
          { name: 'updated_at', type: 'timestamp', nullable: false },
        ],
      },
      {
        name: 'commandes',
        schema: 'topsteel_tenant',
        type: 'table',
        description: "Commandes de l'entreprise",
        columns: [
          { name: 'id', type: 'integer', nullable: false, primary: true },
          { name: 'company_id', type: 'integer', nullable: false },
          { name: 'client_id', type: 'integer', nullable: false },
          { name: 'numero', type: 'varchar', nullable: false },
          { name: 'date_commande', type: 'date', nullable: false },
          { name: 'date_livraison_prevue', type: 'date', nullable: true },
          { name: 'statut', type: 'varchar', nullable: false },
          { name: 'montant_ht', type: 'decimal', nullable: false },
          { name: 'montant_tva', type: 'decimal', nullable: false },
          { name: 'montant_ttc', type: 'decimal', nullable: false },
          { name: 'notes', type: 'text', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false },
          { name: 'updated_at', type: 'timestamp', nullable: false },
        ],
      },
    ]
    return NextResponse?.json(mockTables)
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Failed to get tables' },
      { status: 500 }
    )
  }
}
