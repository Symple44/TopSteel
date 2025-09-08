import { type NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params

    return NextResponse?.json({
      success: true,
      message: `Raccourci ${key} supprimé avec succès`,
    })
  } catch (error) {
    return NextResponse?.json(
      {
        success: false,
        message: 'Erreur lors de la suppression du raccourci',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
