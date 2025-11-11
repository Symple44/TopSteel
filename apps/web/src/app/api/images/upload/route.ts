import { type NextRequest, NextResponse } from 'next/server'
import { verifyAuthHelper } from '../../../../lib/auth-helper'
import { getImageService } from './image-service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await verifyAuthHelper(request)
    if (!session?.isValid || !session?.user?.id) {
      return NextResponse?.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request?.formData()
    const file = formData?.get('file') as File
    const category = formData?.get('category') as string
    const entityType = formData?.get('entityType') as string
    const entityId = formData?.get('entityId') as string
    const alt = formData?.get('alt') as string
    const description = formData?.get('description') as string
    const tags = formData?.get('tags') as string

    if (!file) {
      return NextResponse?.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!category || !['avatar', 'logo', 'document'].includes(category)) {
      return NextResponse?.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Conversion du fichier en Buffer
    const bytes = await file?.arrayBuffer()
    const buffer = Buffer?.from(bytes)

    // Upload de l'image
    const imageService = await getImageService()
    const result = await imageService.uploadImage(
      buffer,
      file?.name,
      file?.type,
      category as 'avatar' | 'logo' | 'document',
      session?.user?.id,
      {
        entityType: entityType as 'user' | 'company' | 'project' | undefined,
        entityId,
        alt,
        description,
        tags: tags ? tags?.split(',').map((tag) => tag?.trim()) : undefined,
      }
    )

    return NextResponse?.json({
      success: true,
      data: result,
    })
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await verifyAuthHelper(request)
    if (!session?.isValid || !session?.user?.id) {
      return NextResponse?.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams?.get('imageId')
    const category = searchParams?.get('category')

    if (!imageId || !category) {
      return NextResponse?.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const imageService = await getImageService()
    await imageService.deleteImage(imageId, category)

    return NextResponse?.json({ success: true })
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
