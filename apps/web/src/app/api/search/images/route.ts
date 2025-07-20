import { NextRequest, NextResponse } from 'next/server'
import { getElasticsearchClient, getImageElasticsearchService } from '@/lib/server/elasticsearch'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication when implemented
    // const session = await auth()
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const elasticsearchClient = await getElasticsearchClient()
    const imageElasticsearchService = await getImageElasticsearchService()

    const { searchParams } = new URL(request.url)
    
    const searchQuery: any = {
      query: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      mimeType: searchParams.get('mimeType') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') as any) || 'relevance',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    }

    // Filtres de taille
    const minSize = searchParams.get('minSize')
    const maxSize = searchParams.get('maxSize')
    if (minSize || maxSize) {
      searchQuery.sizeRange = {
        min: minSize ? parseInt(minSize) : undefined,
        max: maxSize ? parseInt(maxSize) : undefined
      }
    }

    // Filtres de date
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    if (fromDate || toDate) {
      searchQuery.dateRange = {
        from: fromDate ? new Date(fromDate) : undefined,
        to: toDate ? new Date(toDate) : undefined
      }
    }

    // Vérifier si Elasticsearch est disponible
    const isConnected = await elasticsearchClient.isConnected()
    if (!isConnected) {
      return NextResponse.json({
        results: [],
        total: 0,
        message: 'Search service unavailable'
      })
    }

    // Exécuter la recherche
    const results = await (imageElasticsearchService as any).searchImages(searchQuery)

    return NextResponse.json({
      results,
      total: results.length,
      took: 0,
      aggregations: null
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication when implemented
    // const session = await auth()
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const elasticsearchClient = await getElasticsearchClient()
    const imageElasticsearchService = await getImageElasticsearchService()

    const body = await request.json()
    const { action, ...params } = body

    const isConnected = await elasticsearchClient.isConnected()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Search service unavailable' },
        { status: 503 }
      )
    }

    switch (action) {
      case 'suggest':
        return NextResponse.json({
          suggestions: []
        })

      case 'facets':
        return NextResponse.json({
          facets: {}
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Search action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search action failed' },
      { status: 500 }
    )
  }
}