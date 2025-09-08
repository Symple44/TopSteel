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
export declare class ElasticsearchClient {
  private client
  private config
  constructor(config?: Partial<ElasticsearchConfig>)
  private getClient
  isConnected(timeout?: number): Promise<boolean>
  getConnectionInfo(timeout?: number): Promise<{
    connected: boolean
    error?: string
    version?: string
    clusterName?: string
  }>
  createIndex(indexName: string, mapping: Record<string, unknown>): Promise<boolean>
  deleteIndex(indexName: string): Promise<boolean>
  indexDocument(indexName: string, id: string, document: Record<string, unknown>): Promise<boolean>
  updateDocument(indexName: string, id: string, document: Record<string, unknown>): Promise<boolean>
  deleteDocument(indexName: string, id: string): Promise<boolean>
  search(indexName: string, query: Record<string, unknown>): Promise<unknown>
  bulk(operations: unknown[]): Promise<boolean>
  close(): Promise<void>
}
export declare const elasticsearchClient: ElasticsearchClient
//# sourceMappingURL=elasticsearch-client.d.ts.map
