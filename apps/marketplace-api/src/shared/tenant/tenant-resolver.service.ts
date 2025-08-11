import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, type Repository } from 'typeorm'
import { Societe, SocieteStatus } from '../entities/erp/societe.entity'

export interface TenantContext {
  societeId: string
  societe: Societe
  erpTenantConnection: DataSource | null
  marketplaceEnabled: boolean
}

@Injectable()
export class TenantResolver {
  private tenantConnections = new Map<string, DataSource>()

  constructor(
    @InjectRepository(Societe, 'erpAuth')
    private societeRepository: Repository<Societe>
  ) {}

  async resolveTenantByDomain(domain: string): Promise<TenantContext> {
    // Extraire le sous-domaine ou identifier tenant depuis le domaine
    const tenantCode = this.extractTenantFromDomain(domain)

    // Essayer d'abord de charger la vraie société depuis la base
    try {
      const societe = await this.societeRepository.findOne({
        where: { code: tenantCode },
      })

      if (societe) {
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
      } else {
      }
    } catch {
      // Ignore errors when loading real société
    }

    // Mode démo pour le développement si la vraie société n'est pas trouvée
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
    if ((tenantCode === 'demo' || tenantCode === 'topsteel') && isDev) {
      return this.createDemoTenant(tenantCode)
    }

    throw new NotFoundException(`Société non trouvée pour le domaine: ${domain}`)
  }

  async resolveTenantById(societeId: string): Promise<TenantContext> {
    const societe = await this.societeRepository.findOne({
      where: { id: societeId },
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
      try {
        const connectionConfig = {
          type: 'postgres' as const,
          host: process.env.ERP_DB_HOST || 'localhost',
          port: parseInt(process.env.ERP_DB_PORT) || 5432,
          username: process.env.ERP_DB_USERNAME || 'postgres',
          password: process.env.ERP_DB_PASSWORD || 'postgres',
          database: databaseName,
          entities: [
            // Entités ERP nécessaires
            `${__dirname}/../entities/erp/*.entity{.ts,.js}`,
          ],
          synchronize: false,
          logging: process.env.NODE_ENV === 'development',
        }

        const connection = new DataSource(connectionConfig)
        await connection.initialize()

        this.tenantConnections.set(databaseName, connection)
      } catch (error) {
        throw new Error(`Impossible de se connecter à la base de données ERP: ${error.message}`)
      }
    }

    const connection = this.tenantConnections.get(databaseName)
    if (!connection) {
      throw new Error(`Connexion non trouvée pour la base "${databaseName}"`)
    }
    return connection
  }

  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.tenantConnections.values()).map((connection) =>
      connection.destroy()
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

  private async createDemoTenant(tenantCode: string = 'demo'): Promise<TenantContext> {
    // Configuration par tenant - nom de DB basé sur le code tenant
    const tenantConfigs = {
      demo: {
        id: 'demo-tenant-id',
        nom: 'Société Démo',
        storeName: 'Démo Marketplace',
        description: 'Boutique de démonstration',
        databaseName: 'erp_demo_demo',
      },
      topsteel: {
        id: '73416fa9-f693-42f6-99d3-7c919cefe4d5', // ID réel de la société TopSteel
        nom: 'TopSteel',
        storeName: 'TopSteel',
        description: 'Boutique en ligne TopSteel',
        databaseName: 'erp_topsteel_topsteel',
      },
    }

    const config = tenantConfigs[tenantCode] || tenantConfigs.demo

    // Créer un tenant de démonstration pour le développement
    const demoSociete = {
      id: config.id,
      code: tenantCode,
      nom: config.nom,
      databaseName: config.databaseName, // Base dynamique basée sur le tenant
      status: SocieteStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      configuration: {
        marketplace: {
          enabled: true,
          storeName: config.storeName,
          description: config.description,
        },
      },
    } as Societe

    try {
      // Essayons plusieurs bases de données dans l'ordre de préférence, en commençant par celle du tenant
      const dbNames = [
        config.databaseName, // Base spécifique au tenant
        `erp_${tenantCode}_${tenantCode}`, // Format standard
        `erp_${tenantCode}`, // Format alternatif
        'postgres', // Fallback
        tenantCode, // Nom simple
      ]
      let erpTenantConnection = null
      let _lastError = null

      for (const dbName of dbNames) {
        try {
          erpTenantConnection = await this.getERPTenantConnection(dbName)
          break
        } catch (error) {
          _lastError = error
        }
      }

      if (!erpTenantConnection) {
        // Créer un tenant de démonstration sans connexion ERP pour les tests
        return {
          societeId: demoSociete.id,
          societe: demoSociete,
          erpTenantConnection: null, // Pas de connexion ERP
          marketplaceEnabled: true,
        }
      }

      const tenantContext = {
        societeId: demoSociete.id,
        societe: demoSociete,
        erpTenantConnection,
        marketplaceEnabled: true,
      }

      return tenantContext
    } catch {
      return {
        societeId: demoSociete.id,
        societe: demoSociete,
        erpTenantConnection: null,
        marketplaceEnabled: true,
      }
    }
  }
}
