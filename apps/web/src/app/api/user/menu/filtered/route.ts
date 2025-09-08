import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore?.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le profil utilisateur pour obtenir les rôles et permissions
    const userResponse = await callBackendFromApi(req, 'auth/profile', {
      method: 'GET',
    })

    if (!userResponse?.ok) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userData = await userResponse?.json()
    const userId = userData?.id
    const userRoles = userData?.roles || []
    const userPermissions = userData?.permissions || []

    // Appeler l'API backend pour récupérer le menu filtré pour cet utilisateur
    const response = await callBackendFromApi(req, 'admin/menu-raw/filtered-menu', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        userRoles,
        userPermissions,
      }),
    })

    if (!response?.ok) {
      throw new Error(`API Error: ${response?.status} ${response?.statusText}`)
    }

    const menuData = await response?.json()

    return NextResponse?.json({
      success: true,
      data: menuData?.data ?? [],
    })
  } catch (error: unknown) {
    return NextResponse?.json(
      {
        success: false,
        message: (error as Error).message || 'Erreur serveur',
        data: [],
      },
      {
        status: (error as { response?: { status?: number } })?.response?.status || 500,
      }
    )
  }
}
