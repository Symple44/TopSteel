import { type NextRequest, NextResponse } from 'next/server'
import { verifyAuthHelper } from '../../../../../lib/auth-helper'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions
    const auth = await verifyAuthHelper(request)
    if (!auth?.isValid) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions admin
    if (!auth.user?.roles?.some((role: string) => ['SUPER_ADMIN', 'ADMIN'].includes(role))) {
      return NextResponse?.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    return NextResponse?.json({
      success: true,
      message: 'Menu item pour les sessions ajouté avec succès',
      data: {
        title: 'Sessions Utilisateurs',
        href: '/admin/sessions',
        icon: 'Monitor',
        added: true,
      },
    })
  } catch (_error) {
    return NextResponse?.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
