import { NextRequest, NextResponse } from 'next/server'

// GET - Récupérer les permissions d'un rôle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No auth token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Rediriger vers l'API backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/v1/admin/roles/${id}/permissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'API error' }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin roles permissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Mettre à jour les permissions d'un rôle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { permissions } = body
    
    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'Format de permissions invalide' },
        { status: 400 }
      )
    }
    
    // Valider les permissions
    const validAccessLevels: AccessLevel[] = ['BLOCKED', 'READ', 'WRITE', 'DELETE', 'ADMIN']
    const invalidPermissions = permissions.filter(p => 
      !p.permissionId || 
      !validAccessLevels.includes(p.accessLevel) ||
      typeof p.isGranted !== 'boolean'
    )
    
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Permissions invalides détectées' },
        { status: 400 }
      )
    }
    
    // Ici, on sauvegarderait en base de données
    // Pour le mock, on retourne simplement un succès
    
    return NextResponse.json({
      success: true,
      data: {
        roleId: id,
        updatedPermissions: permissions,
        message: 'Permissions mises à jour avec succès'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour des permissions' },
      { status: 500 }
    )
  }
}

// Générer les permissions par défaut pour un rôle
function generateRolePermissions(roleId: string) {
  const permissions: any[] = []
  
  Object.entries(SYSTEM_PERMISSIONS).forEach(([moduleId, perms]) => {
    perms.forEach(perm => {
      let accessLevel: AccessLevel = 'BLOCKED'
      let isGranted = false
      
      // Logique par rôle
      switch (roleId) {
        case 'SUPER_ADMIN':
          accessLevel = 'ADMIN'
          isGranted = true
          break
          
        case 'ADMIN':
          if (moduleId !== 'SYSTEM_SETTINGS' || perm.level !== 'ADMIN') {
            accessLevel = perm.level === 'ADMIN' ? 'DELETE' : perm.level
            isGranted = true
          } else {
            accessLevel = 'WRITE'
            isGranted = true
          }
          break
          
        case 'MANAGER':
          if (['CLIENT_MANAGEMENT', 'PROJECT_MANAGEMENT', 'BILLING_MANAGEMENT', 'PRODUCTION_MANAGEMENT', 'STOCK_MANAGEMENT', 'NOTIFICATION_MANAGEMENT'].includes(moduleId)) {
            accessLevel = perm.level === 'ADMIN' ? 'DELETE' : perm.level
            isGranted = true
          }
          break
          
        case 'COMMERCIAL':
          if (['CLIENT_MANAGEMENT', 'PROJECT_MANAGEMENT', 'BILLING_MANAGEMENT'].includes(moduleId)) {
            accessLevel = perm.action === 'delete' ? 'WRITE' : perm.level
            isGranted = true
          }
          break
          
        case 'TECHNICIEN':
          if (['PRODUCTION_MANAGEMENT', 'STOCK_MANAGEMENT'].includes(moduleId)) {
            accessLevel = perm.level === 'DELETE' ? 'WRITE' : perm.level
            isGranted = true
          }
          break
          
        case 'OPERATEUR':
          if (moduleId === 'PRODUCTION_MANAGEMENT') {
            accessLevel = 'READ'
            isGranted = perm.action === 'view'
          }
          break
          
        case 'DEVISEUR':
          if (['CLIENT_MANAGEMENT', 'BILLING_MANAGEMENT'].includes(moduleId)) {
            accessLevel = perm.level
            isGranted = !(
              (moduleId === 'CLIENT_MANAGEMENT' && perm.action === 'delete') ||
              (moduleId === 'BILLING_MANAGEMENT' && perm.action === 'validate')
            )
          }
          break
      }
      
      permissions.push({
        id: `${roleId}_${perm.id}`,
        roleId,
        permissionId: perm.id,
        moduleId,
        accessLevel,
        isGranted
      })
    })
  })
  
  return permissions
}