import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Societe } from '../entities/erp/societe.entity'

export interface TenantContext {
  societeId: string
  societe: Societe
  erpTenantConnection: DataSource
  marketplaceEnabled: boolean
}

@Injectable()
export class TenantResolver {
  private tenantConnections = new Map<string, DataSource>()

  constructor(
    @InjectRepository(Societe, 'erpAuth')
    private societeRepository: Repository<Societe>,
  ) {}

  async resolveTenantByDomain(domain: string): Promise<TenantContext> {
    // Extraire le sous-domaine ou identifier tenant depuis le domaine
    const tenantCode = this.extractTenantFromDomain(domain)
    
    const societe = await this.societeRepository.findOne({
      where: { code: tenantCode }
    })

    if (!societe) {
      throw new NotFoundException(`Société non trouvée pour le domaine: ${domain}`)
    }

    if (!societe.configuration?.marketplace?.enabled) {
      throw new NotFoundException(`Marketplace non activée pour cette société`)
    }

    const erpTenantConnection = await this.getERPTenantConnection(societe.databaseName)

    return {
      societeId: societe.id,
      societe,
      erpTenantConnection,
      marketplaceEnabled: societe.configuration?.marketplace?.enabled || false,
    }
  }

  async resolveTenantById(societeId: string): Promise<TenantContext> {
    const societe = await this.societeRepository.findOne({
      where: { id: societeId }
    })

    if (!societe) {
      throw new NotFoundException(`Société non trouvée: ${societeId}`)
    }

    const erpTenantConnection = await this.getERPTenantConnection(societe.databaseName)

    return {
      societeId: societe.id,
      societe,
      erpTenantConnection,
      marketplaceEnabled: societe.configuration?.marketplace?.enabled || false,
    }
  }

  private extractTenantFromDomain(domain: string): string {
    // Logique pour extraire le code tenant depuis le domaine
    // Exemples:
    // - topsteel.marketplace.com -> topsteel
    // - marketplace-topsteel.com -> topsteel
    // - www.topsteel-shop.com -> topsteel
    
    const domainParts = domain.toLowerCase().split('.')
    
    // Si c'est un sous-domaine
    if (domainParts.length >= 3 && domainParts[0] !== 'www') {
      return domainParts[0]
    }
    
    // Si c'est dans le nom de domaine
    const mainDomain = domainParts[0]
    if (mainDomain.includes('-')) {
      const parts = mainDomain.split('-')
      return parts[0] // Prendre la première partie
    }
    
    return mainDomain
  }

  private async getERPTenantConnection(databaseName: string): Promise<DataSource> {
    if (!this.tenantConnections.has(databaseName)) {
      const connection = new DataSource({
        type: 'postgres',
        host: process.env.ERP_DB_HOST || 'localhost',
        port: parseInt(process.env.ERP_DB_PORT) || 5432,
        username: process.env.ERP_DB_USERNAME || 'postgres',
        password: process.env.ERP_DB_PASSWORD || 'postgres',
        database: databaseName,
        entities: [
          // Entités ERP nécessaires
          `${__dirname}/../entities/erp/*.entity{.ts,.js}`
        ],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      })
      
      await connection.initialize()
      this.tenantConnections.set(databaseName, connection)
    }
    
    return this.tenantConnections.get(databaseName)!
  }

  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.tenantConnections.values()).map(
      connection => connection.destroy()
    )
    
    await Promise.all(closePromises)
    this.tenantConnections.clear()
  }

  getAllActiveConnections(): DataSource[] {
    return Array.from(this.tenantConnections.values())
  }

  getConnectionStats(): { database: string; isConnected: boolean }[] {
    return Array.from(this.tenantConnections.entries()).map(([database, connection]) => ({
      database,
      isConnected: connection.isInitialized,
    }))
  }
}