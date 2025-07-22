import { NextRequest, NextResponse } from 'next/server'
import { pageDiscoveryService } from '@/services/page-discovery.service'

export async function GET(request: NextRequest) {
  try {
    // Découvrir les pages disponibles depuis le système de fichiers
    const categories = pageDiscoveryService.discoverPages()
    
    // Filtrer les pages selon les permissions de l'utilisateur
    const filteredCategories = filterPagesByPermissions(categories, null)
    
    return NextResponse.json({
      success: true,
      data: filteredCategories
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des pages disponibles:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne' },
      { status: 500 }
    )
  }
}

function filterPagesByPermissions(categories: any[], user: any) {
  // TODO: Implémenter la logique de filtrage basée sur les permissions
  // Pour l'instant, retourner toutes les pages
  
  // Exemple de logique de filtrage:
  // const userPermissions = await getUserPermissions(user.id)
  // const userRole = user.role
  
  const filteredCategories = categories.map(category => ({
    ...category,
    pages: category.pages.filter((page: any) => {
      // Vérifier les permissions si définies
      if (page.permissions && page.permissions.length > 0) {
        // TODO: Vérifier si l'utilisateur a ces permissions
        // return userPermissions.some(p => page.permissions.includes(p))
      }
      
      // Vérifier les rôles si définis
      if (page.roles && page.roles.length > 0) {
        // TODO: Vérifier si l'utilisateur a ces rôles
        // return page.roles.includes(userRole)
      }
      
      // Par défaut, autoriser la page
      return true
    })
  })).filter(category => category.pages.length > 0)
  
  return filteredCategories
}