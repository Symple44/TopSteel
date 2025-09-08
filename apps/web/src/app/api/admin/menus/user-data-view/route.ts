import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore?.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req?.json()

    // Appeler l'API backend pour ajouter la vue au menu utilisateur
    const response = await callBackendFromApi(req, 'admin/menus/user-data-view', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (!response?.ok) {
      throw new Error(`API Error: ${response?.status} ${response?.statusText}`)
    }

    const responseData = await response?.json()

    return NextResponse?.json({
      success: true,
      data: responseData?.data,
    })
  } catch (error: unknown) {
    return NextResponse?.json(
      {
        success: false,
        message:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Erreur serveur',
      },
      {
        status: (error as { response?: { status?: number } })?.response?.status || 500,
      }
    )
  }
}
