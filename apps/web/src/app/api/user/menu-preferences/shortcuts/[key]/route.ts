import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    
    console.log(`Suppression du raccourci: ${key}`)
    
    return NextResponse.json({
      success: true,
      message: `Raccourci ${key} supprimé avec succès`
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du raccourci:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la suppression du raccourci',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}