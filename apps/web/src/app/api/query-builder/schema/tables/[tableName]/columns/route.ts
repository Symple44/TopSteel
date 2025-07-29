import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const { tableName } = await params
  
  try {
    // Données mock des colonnes par table
    const mockTableColumns: Record<string, any[]> = {
      'users': [
        { tableName: 'users', columnName: 'id', dataType: 'integer', isPrimaryKey: true, isForeignKey: false, comment: 'User ID' },
        { tableName: 'users', columnName: 'email', dataType: 'varchar', isPrimaryKey: false, isForeignKey: false, comment: 'User email address' },
        { tableName: 'users', columnName: 'nom', dataType: 'varchar', isPrimaryKey: false, isForeignKey: false, comment: 'Last name' },
        { tableName: 'users', columnName: 'prenom', dataType: 'varchar', isPrimaryKey: false, isForeignKey: false, comment: 'First name' },
        { tableName: 'users', columnName: 'role', dataType: 'varchar', isPrimaryKey: false, isForeignKey: false, comment: 'User role' },
        { tableName: 'users', columnName: 'created_at', dataType: 'timestamp', isPrimaryKey: false, isForeignKey: false, comment: 'Creation date' },
        { tableName: 'users', columnName: 'updated_at', dataType: 'timestamp', isPrimaryKey: false, isForeignKey: false, comment: 'Last update date' }
      ],
      'menu_configurations': [
        { tableName: 'menu_configurations', columnName: 'id', dataType: 'integer', isPrimaryKey: true, isForeignKey: false, comment: 'Menu config ID' },
        { tableName: 'menu_configurations', columnName: 'name', dataType: 'varchar', isPrimaryKey: false, isForeignKey: false, comment: 'Configuration name' },
        { tableName: 'menu_configurations', columnName: 'configuration', dataType: 'json', isPrimaryKey: false, isForeignKey: false, comment: 'Menu configuration data' },
        { tableName: 'menu_configurations', columnName: 'is_active', dataType: 'boolean', isPrimaryKey: false, isForeignKey: false, comment: 'Is configuration active' },
        { tableName: 'menu_configurations', columnName: 'created_at', dataType: 'timestamp', isPrimaryKey: false, isForeignKey: false, comment: 'Creation date' }
      ],
      'user_menu_preferences': [
        { tableName: 'user_menu_preferences', columnName: 'id', dataType: 'integer', isPrimaryKey: true, isForeignKey: false, comment: 'Preference ID' },
        { tableName: 'user_menu_preferences', columnName: 'user_id', dataType: 'integer', isPrimaryKey: false, isForeignKey: true, comment: 'User ID (FK)' },
        { tableName: 'user_menu_preferences', columnName: 'menu_data', dataType: 'json', isPrimaryKey: false, isForeignKey: false, comment: 'Menu preference data' },
        { tableName: 'user_menu_preferences', columnName: 'created_at', dataType: 'timestamp', isPrimaryKey: false, isForeignKey: false, comment: 'Creation date' }
      ],
      'companies': [
        { tableName: 'companies', columnName: 'id', dataType: 'integer', isPrimaryKey: true, isForeignKey: false, comment: 'Company ID' },
        { tableName: 'companies', columnName: 'name', dataType: 'varchar', isPrimaryKey: false, isForeignKey: false, comment: 'Company name' },
        { tableName: 'companies', columnName: 'code', dataType: 'varchar', isPrimaryKey: false, isForeignKey: false, comment: 'Company code' },
        { tableName: 'companies', columnName: 'status', dataType: 'varchar', isPrimaryKey: false, isForeignKey: false, comment: 'Company status' },
        { tableName: 'companies', columnName: 'created_at', dataType: 'timestamp', isPrimaryKey: false, isForeignKey: false, comment: 'Creation date' }
      ]
    }

    const columns = mockTableColumns[tableName] || []
    
    return NextResponse.json(columns)
    
  } catch (error) {
    console.error('[Query Builder Table Columns API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch columns' },
      { status: 500 }
    )
  }
}