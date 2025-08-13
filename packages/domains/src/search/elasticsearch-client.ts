import { Client } from '@elastic/elasticsearch'

export interface ElasticsearchConfig {
  node: string
  auth?: {
    username: string
    password: string
  }
  tls?: {
    ca?: string
    rejectUnauthorized?: boolean
  }
  maxRetries: number
  requestTimeout: number
}

export class ElasticsearchClient {
  private client: Client | null = null
  private config: ElasticsearchConfig

  constructor(config?: Partial<ElasticsearchConfig>) {
    this.config = {
      node:
        process.env.ELASTICSEARCH_NODE || process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      maxRetries: 3,
      requestTimeout: 30000,
      ...config,
    }

    if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
      this.config.auth = {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      }
    }
  }

  private getClient(): Client {
    if (!this.client) {
      this.client = new Client(this.config)
    }
    return this.client
  }

  async isConnected(timeout: number = 5000): Promise<boolean> {
    try {
      const client = this.getClient()
      const response = await client.ping(undefined, {
        requestTimeout: timeout,
      })
      return response === true
    } catch {
      // Ne pas logger l'erreur complète pour éviter le spam dans les logs
      // Juste indiquer qu'Elasticsearch n'est pas disponible
      return false
    }
  }

  async getConnectionInfo(timeout: number = 5000): Promise<{
    connected: boolean
    error?: string
    version?: string
    clusterName?: string
  }> {
    try {
      const client = this.getClient()

      // Test de connexion rapide
      const pingResponse = await client.ping(undefined, {
        requestTimeout: timeout,
      })

      if (pingResponse !== true) {
        return {
          connected: false,
          error: 'Ping failed',
        }
      }

      // Si la connexion fonctionne, récupérer les infos du cluster
      try {
        const infoResponse = await client.info(undefined, {
          requestTimeout: timeout,
        })

        return {
          connected: true,
          version: infoResponse.version?.number,
          clusterName: infoResponse.cluster_name,
        }
      } catch {
        // Connexion OK mais impossible de récupérer les infos
        return {
          connected: true,
          error: 'Cannot retrieve cluster info',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        connected: false,
        error: errorMessage,
      }
    }
  }

  async createIndex(indexName: string, mapping: Record<string, any>): Promise<boolean> {
    try {
      const client = this.getClient()

      // Vérifier si l'index existe déjà
      const exists = await client.indices.exists({ index: indexName })

      if (exists) {
        return true
      }

      // Créer l'index avec le mapping
      await client.indices.create({
        index: indexName,
        body: mapping as any,
      })
      return true
    } catch {
      return false
    }
  }

  async deleteIndex(indexName: string): Promise<boolean> {
    try {
      const client = this.getClient()
      await client.indices.delete({ index: indexName })
      return true
    } catch {
      return false
    }
  }

  async indexDocument(
    indexName: string,
    id: string,
    document: Record<string, any>
  ): Promise<boolean> {
    try {
      const client = this.getClient()
      await client.index({
        index: indexName,
        id,
        body: document as any,
      })
      return true
    } catch {
      return false
    }
  }

  async updateDocument(
    indexName: string,
    id: string,
    document: Record<string, any>
  ): Promise<boolean> {
    try {
      const client = this.getClient()
      await client.update({
        index: indexName,
        id,
        doc: document,
      })
      return true
    } catch {
      return false
    }
  }

  async deleteDocument(indexName: string, id: string): Promise<boolean> {
    try {
      const client = this.getClient()
      await client.delete({
        index: indexName,
        id,
      })
      return true
    } catch {
      return false
    }
  }

  async search(indexName: string, query: Record<string, any>): Promise<unknown> {
    const client = this.getClient()
    const response = await client.search({
      index: indexName,
      body: query as any,
    })
    return response
  }

  async bulk(operations: unknown[]): Promise<boolean> {
    try {
      const client = this.getClient()
      const response = await client.bulk({
        body: operations,
      })

      if (response.errors) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
    }
  }
}

// Instance singleton
export const elasticsearchClient = new ElasticsearchClient()
