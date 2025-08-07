import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentification requise',
        },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Valider et nettoyer les données pour correspondre exactement au DTO backend
    const allowedFields = [
      'theme',
      'language',
      'fontSize',
      'sidebarWidth',
      'density',
      'accentColor',
      'contentWidth',
    ]
    const cleanedBody: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        cleanedBody[field] = body[field]
      }
    }

    try {
      // Appeler le vrai backend NestJS
      const response = await callBackendFromApi(request, 'users/appearance/me', {
        method: 'PATCH',
        body: JSON.stringify(cleanedBody),
      })

      if (response.ok) {
        const backendData = await response.json()

        // Le backend retourne directement les appearance settings dans data
        // Structure: { data: AppearanceSettings, statusCode: 200, message: "Success" }
        if (backendData.data) {
          // Construire la réponse manuellement pour éviter les propriétés parasites
          const cleanResponse = {
            success: true,
            data: {
              preferences: {
                appearance: {
                  theme: backendData.data.theme,
                  language: backendData.data.language,
                  fontSize: backendData.data.fontSize,
                  sidebarWidth: backendData.data.sidebarWidth,
                  density: backendData.data.density,
                  accentColor: backendData.data.accentColor,
                  contentWidth: backendData.data.contentWidth,
                },
              },
            },
          }
          return NextResponse.json(cleanResponse)
        }

        return NextResponse.json(backendData)
      } else {
        throw new Error(`Backend API error: ${response.status}`)
      }
    } catch (_backendError) {
      // Fallback si le backend est indisponible
      const validThemes = ['light', 'dark', 'system', 'vibrant']
      const validLanguages = ['fr', 'en']
      const validFontSizes = ['small', 'medium', 'large']
      const validSidebarWidths = ['compact', 'normal', 'wide']
      const validDensities = ['compact', 'comfortable', 'spacious']
      const validAccentColors = ['blue', 'green', 'red', 'purple', 'orange', 'pink']
      const validContentWidths = ['compact', 'normal', 'wide']

      const appearanceSettings = {
        theme: validThemes.includes(body.theme) ? body.theme : 'vibrant',
        language: validLanguages.includes(body.language) ? body.language : 'fr',
        fontSize: validFontSizes.includes(body.fontSize) ? body.fontSize : 'medium',
        sidebarWidth: validSidebarWidths.includes(body.sidebarWidth) ? body.sidebarWidth : 'normal',
        density: validDensities.includes(body.density) ? body.density : 'comfortable',
        accentColor: validAccentColors.includes(body.accentColor) ? body.accentColor : 'blue',
        contentWidth: validContentWidths.includes(body.contentWidth)
          ? body.contentWidth
          : 'compact',
      }

      return NextResponse.json({
        success: true,
        data: {
          preferences: {
            appearance: appearanceSettings,
          },
        },
        fallback: true,
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error updating appearance settings',
        error: error instanceof Error ? error.message : 'Invalid request data',
      },
      { status: 400 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentification requise',
        },
        { status: 401 }
      )
    }

    try {
      // Appeler le vrai backend NestJS
      const response = await callBackendFromApi(request, 'users/appearance/me', {
        method: 'GET',
      })

      if (response.ok) {
        const backendData = await response.json()

        // Le backend retourne directement les appearance settings dans data
        // Structure: { data: AppearanceSettings, statusCode: 200, message: "Success" }
        if (backendData.data) {
          // Construire la réponse manuellement pour éviter les propriétés parasites
          const cleanResponse = {
            success: true,
            data: {
              preferences: {
                appearance: {
                  theme: backendData.data.theme,
                  language: backendData.data.language,
                  fontSize: backendData.data.fontSize,
                  sidebarWidth: backendData.data.sidebarWidth,
                  density: backendData.data.density,
                  accentColor: backendData.data.accentColor,
                  contentWidth: backendData.data.contentWidth,
                },
              },
            },
          }
          return NextResponse.json(cleanResponse)
        }

        return NextResponse.json(backendData)
      } else {
        throw new Error(`Backend API error: ${response.status}`)
      }
    } catch (_backendError) {
      // Fallback si le backend est indisponible
      const defaultSettings = {
        theme: 'vibrant',
        language: 'fr',
        fontSize: 'medium',
        sidebarWidth: 'normal',
        density: 'comfortable',
        accentColor: 'blue',
        contentWidth: 'compact',
      }

      return NextResponse.json({
        success: true,
        data: {
          preferences: {
            appearance: defaultSettings,
          },
        },
        fallback: true,
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error loading appearance settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
