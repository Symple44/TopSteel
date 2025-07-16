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
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      maxRetries: 3,
      requestTimeout: 30000,
      ...config
    }

    if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
      this.config.auth = {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      }
    }
  }

  private getClient(): Client {
    if (!this.client) {
      this.client = new Client(this.config)
    }
    return this.client
  }

  async isConnected(): Promise<boolean> {
    try {
      const response = await this.getClient().ping()
      return response === true
    } catch (error) {
      console.error('Elasticsearch connection failed:', error)
      return false
    }
  }

  async createIndex(indexName: string, mapping: any): Promise<boolean> {
    try {
      const client = this.getClient()
      
      // Vérifier si l'index existe déjà
      const exists = await client.indices.exists({ index: indexName })
      
      if (exists) {
        console.log(`Index ${indexName} already exists`)
        return true
      }

      // Créer l'index avec le mapping
      await client.indices.create({
        index: indexName,
        body: mapping
      })

      console.log(`Index ${indexName} created successfully`)
      return true
    } catch (error) {
      console.error(`Failed to create index ${indexName}:`, error)
      return false
    }
  }

  async deleteIndex(indexName: string): Promise<boolean> {
    try {
      const client = this.getClient()
      await client.indices.delete({ index: indexName })
      console.log(`Index ${indexName} deleted successfully`)
      return true
    } catch (error) {
      console.error(`Failed to delete index ${indexName}:`, error)
      return false
    }
  }

  async indexDocument(indexName: string, id: string, document: any): Promise<boolean> {
    try {
      const client = this.getClient()
      await client.index({
        index: indexName,
        id,
        body: document
      })
      return true
    } catch (error) {
      console.error(`Failed to index document ${id}:`, error)
      return false
    }
  }

  async updateDocument(indexName: string, id: string, document: any): Promise<boolean> {
    try {
      const client = this.getClient()
      await client.update({
        index: indexName,
        id,
        body: {
          doc: document
        }
      })
      return true
    } catch (error) {
      console.error(`Failed to update document ${id}:`, error)
      return false
    }
  }

  async deleteDocument(indexName: string, id: string): Promise<boolean> {
    try {
      const client = this.getClient()
      await client.delete({
        index: indexName,
        id
      })
      return true
    } catch (error) {
      console.error(`Failed to delete document ${id}:`, error)
      return false
    }
  }

  async search(indexName: string, query: any): Promise<any> {
    try {
      const client = this.getClient()
      const response = await client.search({
        index: indexName,
        body: query
      })
      return response
    } catch (error) {
      console.error(`Search failed in index ${indexName}:`, error)
      throw error
    }
  }

  async bulk(operations: any[]): Promise<boolean> {
    try {
      const client = this.getClient()
      const response = await client.bulk({
        body: operations
      })
      
      if (response.errors) {
        console.error('Bulk operation had errors:', response.errors)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Bulk operation failed:', error)
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