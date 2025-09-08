export interface MigrationConfig {
  indexName: string
  mapping: Record<string, unknown>
  version: string
  description: string
}
export declare class ElasticsearchMigrationService {
  private migrations
  constructor()
  private registerDefaultMigrations
  registerMigration(config: MigrationConfig): void
  runAllMigrations(): Promise<boolean>
  runMigration(config: MigrationConfig): Promise<boolean>
  private recordMigration
  resetIndex(indexName: string): Promise<boolean>
  checkIndexHealth(): Promise<Record<string, unknown>>
}
export declare const migrationService: ElasticsearchMigrationService
//# sourceMappingURL=migration-service.d.ts.map
