import { elasticsearchClient } from './elasticsearch-client'
import { imageElasticsearchMapping } from './mappings/images'

export interface MigrationConfig {
  indexName: string
  mapping: unknown
  version: string
  description: string
}

export class ElasticsearchMigrationService {
  private migrations: Map<string, MigrationConfig> = new Map()

  constructor() {
    this.registerDefaultMigrations()
  }

  private registerDefaultMigrations() {
    // Migration pour l'index des images
    this.registerMigration({
      indexName: 'images',
      mapping: imageElasticsearchMapping,
      version: '1.0.0',
      description: 'Initial images index with metadata and variants',
    })
  }

  registerMigration(config: MigrationConfig) {
    this.migrations.set(config.indexName, config)
  }

  async runAllMigrations(): Promise<boolean> {
    // Vérifier la connexion
    const isConnected = await elasticsearchClient.isConnected()
    if (!isConnected) {
      return false
    }

    let allSuccess = true

    for (const [, config] of this.migrations) {
      try {
        const success = await this.runMigration(config)
        if (success) {
        } else {
          allSuccess = false
        }
      } catch {
        allSuccess = false
      }
    }

    if (allSuccess) {
    } else {
    }

    return allSuccess
  }

  async runMigration(config: MigrationConfig): Promise<boolean> {
    try {
      // Créer l'index avec le mapping
      const success = await elasticsearchClient.createIndex(config.indexName, config.mapping)

      if (success) {
        // Enregistrer la version de migration
        await this.recordMigration(config)
      }

      return success
    } catch {
      return false
    }
  }

  private async recordMigration(config: MigrationConfig) {
    try {
      const migrationDoc = {
        indexName: config.indexName,
        version: config.version,
        description: config.description,
        appliedAt: new Date().toISOString(),
      }

      await elasticsearchClient.indexDocument(
        '.migrations',
        `${config.indexName}_${config.version}`,
        migrationDoc
      )
    } catch {
      // Migration record failed but continue
    }
  }

  async resetIndex(indexName: string): Promise<boolean> {
    const config = this.migrations.get(indexName)
    if (!config) {
      return false
    }

    // Supprimer l'index existant
    await elasticsearchClient.deleteIndex(indexName)

    // Recréer avec le mapping actuel
    return await this.runMigration(config)
  }

  async checkIndexHealth(): Promise<Record<string, unknown>> {
    const health: Record<string, unknown> = {}

    for (const [indexName] of this.migrations) {
      try {
        const stats = await elasticsearchClient.search(indexName, {
          size: 0,
          aggs: {
            total_docs: {
              value_count: {
                field: '_id',
              },
            },
          },
        })

        health[indexName] = {
          exists: true,
          documentCount: stats.hits?.total?.value || 0,
          status: 'healthy',
        }
      } catch (error) {
        health[indexName] = {
          exists: false,
          error: error instanceof Error ? error.message : String(error),
          status: 'error',
        }
      }
    }

    return health
  }
}

export const migrationService = new ElasticsearchMigrationService()
