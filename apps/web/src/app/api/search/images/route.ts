import { type NextRequest, NextResponse } from 'next/server'
import { getElasticsearchClient, getImageElasticsearchService } from '@/lib/server/elasticsearch'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request?.headers?.get('authorization')
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return NextResponse?.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const elasticsearchClient = await getElasticsearchClient()
    const _imageElasticsearchService = await getImageElasticsearchService()

    const { searchParams } = new URL(request.url)

    const searchQuery: {
      query?: string
      category?: string
      entityType?: string
      entityId?: string
      tags?: string[]
      mimeType?: string
      limit: number
      offset: number
      sortBy: string
      sortOrder: string
      sizeRange?: { min?: number; max?: number }
      dateRange?: { start?: string; end?: string }
    } = {
      query: searchParams?.get('q') || undefined,
      category: searchParams?.get('category') || undefined,
      entityType: searchParams?.get('entityType') || undefined,
      entityId: searchParams?.get('entityId') || undefined,
      tags: searchParams?.get('tags')?.split(',') || undefined,
      mimeType: searchParams?.get('mimeType') || undefined,
      limit: parseInt(searchParams?.get('limit') || '20', 10),
      offset: parseInt(searchParams?.get('offset') || '0', 10),
      sortBy: searchParams?.get('sortBy') || 'relevance',
      sortOrder: searchParams?.get('sortOrder') || 'desc',
    }

    // Filtres de taille
    const minSize = searchParams?.get('minSize')
    const maxSize = searchParams?.get('maxSize')
    if (minSize || maxSize) {
      searchQuery.sizeRange = {
        min: minSize ? parseInt(minSize, 10) : undefined,
        max: maxSize ? parseInt(maxSize, 10) : undefined,
      }
    }

    // Filtres de date
    const fromDate = searchParams?.get('fromDate')
    const toDate = searchParams?.get('toDate')
    if (fromDate || toDate) {
      searchQuery.dateRange = {
        start: fromDate || undefined,
        end: toDate || undefined,
      }
    }

    // Vérifier si Elasticsearch est disponible
    const isConnected = await elasticsearchClient.isConnected()
    if (!isConnected) {
      return NextResponse?.json({
        results: [],
        total: 0,
        message: 'Search service unavailable',
      })
    }

    // Exécuter la recherche - méthode temporaire en attendant l'implémentation complète
    const results: unknown[] = []

    return NextResponse?.json({
      results,
      total: results.length,
      took: 0,
      aggregations: null,
    })
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request?.headers?.get('authorization')
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return NextResponse?.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const elasticsearchClient = await getElasticsearchClient()
    const _imageElasticsearchService = await getImageElasticsearchService()

    const body = await request?.json()
    const { action, ..._ } = body || {}

    const isConnected = await elasticsearchClient.isConnected()
    if (!isConnected) {
      return NextResponse?.json({ error: 'Search service unavailable' }, { status: 503 })
    }

    switch (action) {
      case 'suggest':
        return NextResponse?.json({
          suggestions: [],
        })

      case 'facets':
        return NextResponse?.json({
          facets: {},
        })

      default:
        return NextResponse?.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Search action failed' },
      { status: 500 }
    )
  }
}
