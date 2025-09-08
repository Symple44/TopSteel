import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const _accessToken = cookieStore?.get('accessToken')?.value

    // Appeler directement l'API backend
    const response = await callBackendFromApi(req, 'admin/menu-raw/configurations', {
      method: 'GET',
    })

    const data = await response?.json()

    // Extraire les données de la structure imbriquée
    if (data?.data?.data) {
      return NextResponse?.json({
        success: true,
        data: data?.data?.data,
      })
    }

    // Si structure différente, retourner tel quel
    return NextResponse?.json(data, { status: response.status })
  } catch (error: unknown) {
    return NextResponse?.json(
      {
        success: false,
        message: (error as Error).message || 'Erreur serveur',
        data: [],
      },
      {
        status: 500,
      }
    )
  }
}
