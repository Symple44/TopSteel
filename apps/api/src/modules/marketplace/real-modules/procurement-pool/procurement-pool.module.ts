import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProcurementPoolService } from './services/procurement-pool.service'
import { ProcurementPoolController } from './controllers/procurement-pool.controller'
import { PurchaseRequest } from './entities/purchase-request.entity'
import { PurchasePool } from './entities/purchase-pool.entity'
import { SupplierQuote } from './entities/supplier-quote.entity'
import { PoolParticipant } from './entities/pool-participant.entity'
import { Supplier } from './entities/supplier.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseRequest,
      PurchasePool,
      SupplierQuote,
      PoolParticipant,
      Supplier
    ], 'tenant') // Données tenant-spécifiques
  ],
  providers: [ProcurementPoolService],
  controllers: [ProcurementPoolController],
  exports: [ProcurementPoolService]
})
export class ProcurementPoolModule {
  static getModuleInfo() {
    return {
      moduleKey: 'procurement-pool',
      displayName: 'Mutualisation des Achats',
      description: 'Module de mutualisation des demandes d\'achats permettant aux entreprises de regrouper leurs besoins pour négocier de meilleurs prix auprès des fournisseurs. Inclut la gestion des pools d\'achats, des appels d\'offres groupés et de la répartition des commandes.',
      shortDescription: 'Regroupe les achats pour négocier de meilleurs prix',
      category: 'PROCUREMENT',
      version: '1.0.0',
      publisher: 'TopSteel Solutions',
      pricing: {
        type: 'COMMISSION',
        amount: 2.5,
        currency: 'EUR',
        period: 'PER_TRANSACTION',
        description: '2,5% de commission sur les économies réalisées',
        features: [
          'Pools d\'achats illimités',
          'Gestion automatique des appels d\'offres',
          'Tableau de bord des économies',
          'Intégration fournisseurs'
        ]
      },
      dependencies: [],
      menuConfiguration: [
        {
          title: 'Achats Mutualisés',
          type: 'M',
          orderIndex: 200,
          children: [
            {
              title: 'Dashboard Achats',
              type: 'P',
              programId: 'procurement-dashboard',
              orderIndex: 1
            },
            {
              title: 'Mes Demandes',
              type: 'P',
              programId: 'my-requests',
              orderIndex: 2
            },
            {
              title: 'Pools Actifs',
              type: 'P',
              programId: 'active-pools',
              orderIndex: 3
            },
            {
              title: 'Fournisseurs',
              type: 'P',
              programId: 'suppliers',
              orderIndex: 4
            },
            {
              title: 'Économies Réalisées',
              type: 'P',
              programId: 'savings-report',
              orderIndex: 5
            }
          ]
        }
      ],
      permissions: [
        { name: 'procurement.view', description: 'Consulter les données d\'achats' },
        { name: 'procurement.request', description: 'Créer des demandes d\'achats' },
        { name: 'procurement.manage', description: 'Gérer les pools et négociations' },
        { name: 'procurement.admin', description: 'Administration complète du module achats' }
      ],
      apiRoutes: [
        { method: 'GET', path: '/procurement/requests', description: 'Liste des demandes d\'achats' },
        { method: 'GET', path: '/procurement/pools', description: 'Liste des pools d\'achats' },
        { method: 'POST', path: '/procurement/pools/join', description: 'Rejoindre un pool' }
      ],
      icon: 'shopping-cart',
      metadata: {
        supportedCategories: ['Matières Premières', 'Équipements', 'Services', 'Maintenance'],
        minPoolSize: 2,
        maxPoolSize: 20,
        averageSavings: '15-25%',
        integrationComplexity: 'low'
      }
    }
  }
}