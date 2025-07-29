import { NextRequest, NextResponse } from 'next/server'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schema = searchParams.get('schema') || 'public'
    
    // Données mock pour les tables disponibles
    const mockTables = [
      {
        name: 'users',
        schema: 'topsteel_auth',
        type: 'table',
        description: 'Table des utilisateurs du système',
        columns: [
          { name: 'id', type: 'integer', nullable: false, primary: true },
          { name: 'email', type: 'varchar', nullable: false },
          { name: 'nom', type: 'varchar', nullable: true },
          { name: 'prenom', type: 'varchar', nullable: true },
          { name: 'role', type: 'varchar', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false },
          { name: 'updated_at', type: 'timestamp', nullable: false }
        ]
      },
      {
        name: 'menu_configurations',
        schema: 'topsteel_auth',
        type: 'table',
        description: 'Configurations des menus système',
        columns: [
          { name: 'id', type: 'integer', nullable: false, primary: true },
          { name: 'name', type: 'varchar', nullable: false },
          { name: 'configuration', type: 'json', nullable: false },
          { name: 'is_active', type: 'boolean', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ]
      },
      {
        name: 'user_menu_preferences',
        schema: 'topsteel_auth',
        type: 'table',
        description: 'Préférences de menu par utilisateur',
        columns: [
          { name: 'id', type: 'integer', nullable: false, primary: true },
          { name: 'user_id', type: 'integer', nullable: false },
          { name: 'menu_data', type: 'json', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ]
      },
      {
        name: 'companies',
        schema: 'topsteel_tenant',
        type: 'table',
        description: 'Données des entreprises clientes',
        columns: [
          { name: 'id', type: 'integer', nullable: false, primary: true },
          { name: 'name', type: 'varchar', nullable: false },
          { name: 'code', type: 'varchar', nullable: false },
          { name: 'status', type: 'varchar', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ]
      }
    ]

    return NextResponse.json(mockTables)
    
  } catch (error) {
    console.error('[Query Builder Tables API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}