import { NextRequest, NextResponse } from 'next/server'
import { 
  Role, 
  RolePermission, 
  SYSTEM_ROLES, 
  SYSTEM_PERMISSIONS, 
  SYSTEM_MODULES,
  AccessLevel
} from '@/types/permissions'

// Mock data storage
let roles: Role[] = []
let rolePermissions: RolePermission[] = []

// Initialiser les données mock
function initializeData() {
  if (roles.length === 0) {
    // Créer les rôles système avec leurs permissions
    roles = SYSTEM_ROLES.map(systemRole => ({
      ...systemRole,
      permissions: []
    }))

    // Créer les permissions par défaut pour chaque rôle
    rolePermissions = generateDefaultPermissions()
    
    // Associer les permissions aux rôles
    roles.forEach(role => {
      role.permissions = rolePermissions.filter(rp => rp.roleId === role.id)
    })
  }
}

// Générer les permissions par défaut pour chaque rôle
function generateDefaultPermissions(): RolePermission[] {
  const permissions: RolePermission[] = []
  let permissionId = 1

  // SUPER_ADMIN - Accès complet à tout
  Object.values(SYSTEM_PERMISSIONS).flat().forEach(perm => {
    permissions.push({
      id: (permissionId++).toString(),
      roleId: 'SUPER_ADMIN',
      permissionId: perm.id,
      accessLevel: 'ADMIN',
      isGranted: true
    })
  })

  // ADMIN - Accès admin sauf système
  Object.entries(SYSTEM_PERMISSIONS).forEach(([moduleId, perms]) => {
    perms.forEach(perm => {
      let accessLevel: AccessLevel = 'ADMIN'
      
      // Restrictions pour les paramètres système
      if (moduleId === 'SYSTEM_SETTINGS') {
        accessLevel = perm.level === 'ADMIN' ? 'WRITE' : perm.level
      }
      
      permissions.push({
        id: (permissionId++).toString(),
        roleId: 'ADMIN',
        permissionId: perm.id,
        accessLevel,
        isGranted: true
      })
    })
  })

  // MANAGER - Accès business complet
  const managerModules = ['CLIENT_MANAGEMENT', 'PROJECT_MANAGEMENT', 'BILLING_MANAGEMENT', 'PRODUCTION_MANAGEMENT', 'STOCK_MANAGEMENT', 'NOTIFICATION_MANAGEMENT']
  managerModules.forEach(moduleId => {
    SYSTEM_PERMISSIONS[moduleId]?.forEach(perm => {
      permissions.push({
        id: (permissionId++).toString(),
        roleId: 'MANAGER',
        permissionId: perm.id,
        accessLevel: perm.level === 'ADMIN' ? 'DELETE' : perm.level,
        isGranted: true
      })
    })
  })

  // COMMERCIAL - Clients, projets, facturation
  const commercialModules = ['CLIENT_MANAGEMENT', 'PROJECT_MANAGEMENT', 'BILLING_MANAGEMENT']
  commercialModules.forEach(moduleId => {
    SYSTEM_PERMISSIONS[moduleId]?.forEach(perm => {
      let accessLevel: AccessLevel = perm.level
      
      // Restrictions spécifiques
      if (perm.action === 'delete') {
        accessLevel = 'WRITE'
      }
      
      permissions.push({
        id: (permissionId++).toString(),
        roleId: 'COMMERCIAL',
        permissionId: perm.id,
        accessLevel,
        isGranted: true
      })
    })
  })

  // TECHNICIEN - Production et stocks
  const technicienModules = ['PRODUCTION_MANAGEMENT', 'STOCK_MANAGEMENT']
  technicienModules.forEach(moduleId => {
    SYSTEM_PERMISSIONS[moduleId]?.forEach(perm => {
      permissions.push({
        id: (permissionId++).toString(),
        roleId: 'TECHNICIEN',
        permissionId: perm.id,
        accessLevel: perm.level === 'DELETE' ? 'WRITE' : perm.level,
        isGranted: true
      })
    })
  })

  // OPERATEUR - Lecture seule sur production
  SYSTEM_PERMISSIONS['PRODUCTION_MANAGEMENT']?.forEach(perm => {
    permissions.push({
      id: (permissionId++).toString(),
      roleId: 'OPERATEUR',
      permissionId: perm.id,
      accessLevel: 'READ',
      isGranted: perm.action === 'view'
    })
  })

  // DEVISEUR - Spécialisé dans les devis
  const deviseurModules = ['CLIENT_MANAGEMENT', 'BILLING_MANAGEMENT']
  deviseurModules.forEach(moduleId => {
    SYSTEM_PERMISSIONS[moduleId]?.forEach(perm => {
      let isGranted = true
      let accessLevel = perm.level
      
      // Restrictions spécifiques pour deviseur
      if (moduleId === 'CLIENT_MANAGEMENT' && perm.action === 'delete') {
        isGranted = false
      }
      
      if (moduleId === 'BILLING_MANAGEMENT' && perm.action === 'validate') {
        isGranted = false
      }
      
      permissions.push({
        id: (permissionId++).toString(),
        roleId: 'DEVISEUR',
        permissionId: perm.id,
        accessLevel,
        isGranted
      })
    })
  })

  return permissions
}

// GET - Récupérer tous les rôles
export async function GET(request: NextRequest) {
  try {
    initializeData()
    
    const { searchParams } = new URL(request.url)
    const includePermissions = searchParams.get('includePermissions') === 'true'
    
    let result = roles
    
    if (!includePermissions) {
      result = roles.map(role => ({
        ...role,
        permissions: []
      }))
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        total: roles.length,
        systemRoles: roles.filter(r => r.isSystemRole).length,
        customRoles: roles.filter(r => !r.isSystemRole).length
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des rôles' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau rôle
export async function POST(request: NextRequest) {
  try {
    initializeData()
    
    const body = await request.json()
    
    // Validation
    if (!body.name || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Nom et description sont requis' },
        { status: 400 }
      )
    }
    
    // Vérifier l'unicité du nom
    if (roles.some(r => r.name === body.name)) {
      return NextResponse.json(
        { success: false, error: 'Un rôle avec ce nom existe déjà' },
        { status: 400 }
      )
    }
    
    // Créer le nouveau rôle
    const newRole: Role = {
      id: `ROLE_${Date.now()}`,
      name: body.name,
      description: body.description,
      isSystemRole: false,
      isActive: true,
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    roles.push(newRole)
    
    return NextResponse.json({
      success: true,
      data: newRole
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du rôle' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un rôle
export async function PUT(request: NextRequest) {
  try {
    initializeData()
    
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID du rôle requis' },
        { status: 400 }
      )
    }
    
    const roleIndex = roles.findIndex(r => r.id === id)
    if (roleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Rôle non trouvé' },
        { status: 404 }
      )
    }
    
    // Empêcher la modification des rôles système
    if (roles[roleIndex].isSystemRole) {
      return NextResponse.json(
        { success: false, error: 'Impossible de modifier un rôle système' },
        { status: 403 }
      )
    }
    
    // Mettre à jour
    roles[roleIndex] = {
      ...roles[roleIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: roles[roleIndex]
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du rôle' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un rôle
export async function DELETE(request: NextRequest) {
  try {
    initializeData()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID du rôle requis' },
        { status: 400 }
      )
    }
    
    const roleIndex = roles.findIndex(r => r.id === id)
    if (roleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Rôle non trouvé' },
        { status: 404 }
      )
    }
    
    // Empêcher la suppression des rôles système
    if (roles[roleIndex].isSystemRole) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer un rôle système' },
        { status: 403 }
      )
    }
    
    // Supprimer le rôle et ses permissions
    roles.splice(roleIndex, 1)
    rolePermissions = rolePermissions.filter(rp => rp.roleId !== id)
    
    return NextResponse.json({
      success: true,
      message: 'Rôle supprimé avec succès'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du rôle' },
      { status: 500 }
    )
  }
}