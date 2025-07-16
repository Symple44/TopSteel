import { elasticsearchClient } from './elasticsearch-client'
import { imageElasticsearchMapping } from './mappings/images'

export interface MigrationConfig {
  indexName: string
  mapping: any
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
      description: 'Initial images index with metadata and variants'
    })
  }

  registerMigration(config: MigrationConfig) {
    this.migrations.set(config.indexName, config)
  }

  async runAllMigrations(): Promise<boolean> {
    console.log('Starting Elasticsearch migrations...')
    
    // Vérifier la connexion
    const isConnected = await elasticsearchClient.isConnected()
    if (!isConnected) {
      console.warn('Elasticsearch not available, skipping migrations')
      return false
    }

    let allSuccess = true

    for (const [indexName, config] of this.migrations) {
      console.log(`Running migration for ${indexName} (v${config.version})`)
      
      try {
        const success = await this.runMigration(config)
        if (!success) {
          console.error(`Migration failed for ${indexName}`)
          allSuccess = false
        } else {
          console.log(`Migration completed for ${indexName}`)
        }
      } catch (error) {
        console.error(`Migration error for ${indexName}:`, error)
        allSuccess = false
      }
    }

    if (allSuccess) {
      console.log('All Elasticsearch migrations completed successfully')
    } else {
      console.warn('Some Elasticsearch migrations failed')
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
    } catch (error) {
      console.error(`Migration failed for ${config.indexName}:`, error)
      return false
    }
  }

  private async recordMigration(config: MigrationConfig) {
    try {
      const migrationDoc = {
        indexName: config.indexName,
        version: config.version,
        description: config.description,
        appliedAt: new Date().toISOString()
      }

      await elasticsearchClient.indexDocument(
        '.migrations',
        `${config.indexName}_${config.version}`,
        migrationDoc
      )
    } catch (error) {
      console.warn('Failed to record migration:', error)
    }
  }

  async resetIndex(indexName: string): Promise<boolean> {
    const config = this.migrations.get(indexName)
    if (!config) {
      console.error(`No migration config found for ${indexName}`)
      return false
    }

    console.log(`Resetting index ${indexName}...`)
    
    // Supprimer l'index existant
    await elasticsearchClient.deleteIndex(indexName)
    
    // Recréer avec le mapping actuel
    return await this.runMigration(config)
  }

  async checkIndexHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {}

    for (const [indexName] of this.migrations) {
      try {
        const stats = await elasticsearchClient.search(indexName, {
          size: 0,
          aggs: {
            total_docs: {
              value_count: {
                field: '_id'
              }
            }
          }
        })

        health[indexName] = {
          exists: true,
          documentCount: stats.hits?.total?.value || 0,
          status: 'healthy'
        }
      } catch (error) {
        health[indexName] = {
          exists: false,
          error: error instanceof Error ? error.message : String(error),
          status: 'error'
        }
      }
    }

    return health
  }
}

export const migrationService = new ElasticsearchMigrationService()