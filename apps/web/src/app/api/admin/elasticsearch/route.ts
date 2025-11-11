import { type NextRequest, NextResponse } from 'next/server'
import { getElasticsearchClient, getMigrationService } from '../../../../lib/server/elasticsearch'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authHeader = request?.headers?.get('authorization')
    const userRole = request?.headers?.get('x-user-role')

    if (!authHeader || userRole !== 'admin') {
      return NextResponse?.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const elasticsearchClient = await getElasticsearchClient()
    const migrationService = await getMigrationService()

    const { searchParams } = new URL(request.url)
    const action = searchParams?.get('action')

    switch (action) {
      case 'status': {
        // Utiliser un timeout plus court pour éviter les attentes trop longues
        const connectionInfo = await elasticsearchClient.getConnectionInfo(3000)

        // Si connecté, récupérer les informations sur les index
        let indices = {}
        if (connectionInfo?.connected) {
          try {
            indices = await migrationService.checkIndexHealth()
          } catch (_error) {}
        }

        return NextResponse?.json({
          connected: connectionInfo.connected,
          error: connectionInfo.error,
          version: connectionInfo.version,
          clusterName: connectionInfo.clusterName,
          indices,
        })
      }

      case 'health': {
        const indexHealth = await migrationService.checkIndexHealth()
        return NextResponse?.json(indexHealth)
      }

      default:
        return NextResponse?.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Admin operation failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authHeader = request?.headers?.get('authorization')
    const userRole = request?.headers?.get('x-user-role')

    if (!authHeader || userRole !== 'admin') {
      return NextResponse?.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const migrationService = await getMigrationService()

    const body = await request?.json()
    const { action, indexName } = body || {}

    switch (action) {
      case 'migrate': {
        const migrationSuccess = await migrationService.runAllMigrations()

        return NextResponse?.json({
          success: migrationSuccess,
          message: migrationSuccess
            ? 'All migrations completed successfully'
            : 'Some migrations failed',
        })
      }

      case 'reset': {
        if (!indexName) {
          return NextResponse?.json({ error: 'Index name required' }, { status: 400 })
        }
        const resetSuccess = await migrationService.resetIndex(indexName)

        return NextResponse?.json({
          success: resetSuccess,
          message: resetSuccess
            ? `Index ${indexName} reset successfully`
            : `Failed to reset index ${indexName}`,
        })
      }

      case 'reindex':
        // Cette action pourrait déclencher une réindexation complète
        // depuis la base de données vers Elasticsearch
        return NextResponse?.json({
          success: false,
          message: 'Reindexing not yet implemented',
        })

      default:
        return NextResponse?.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Admin action failed' },
      { status: 500 }
    )
  }
}
