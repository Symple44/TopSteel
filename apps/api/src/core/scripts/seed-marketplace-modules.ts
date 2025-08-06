import { NestFactory } from '@nestjs/core'
import { AppModule } from '../../app/app.module'
import {
  MarketplaceCategory,
  PricingType,
} from '../../features/marketplace/entities/marketplace-module.entity'
import { MarketplaceService } from '../../features/marketplace/services/marketplace.service'

async function seedMarketplaceModules() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const marketplaceService = app.get(MarketplaceService)

  const modulesToCreate = [
    {
      moduleKey: 'hr-recruitment-aggregator',
      displayName: 'Vivier de Candidatures RH',
      description:
        'Agrégation automatique des candidatures depuis HelloWork, Indeed, LinkedIn Jobs et autres plateformes de recrutement. Filtrage intelligent des profils et scoring automatique des candidats.',
      shortDescription: 'Centralisez toutes vos candidatures en un seul endroit',
      category: MarketplaceCategory.HR,
      publisher: 'TopSteel Solutions',
      pricing: {
        type: PricingType.SUBSCRIPTION,
        amount: 99,
        currency: 'EUR',
        period: 'MONTH',
        description: "Par mois + frais d'installation de 199€",
      },
      dependencies: ['notification-system'],
      menuConfiguration: [
        {
          title: 'Recrutement',
          type: 'FOLDER',
          icon: 'Users',
          orderIndex: 15,
          isVisible: true,
          children: [
            {
              title: 'Vivier de candidatures',
              type: 'PROGRAM',
              programId: '/hr/recruitment/pool',
              icon: 'UserSearch',
              orderIndex: 1,
              isVisible: true,
              permissions: ['HR_RECRUITMENT_VIEW'],
            },
            {
              title: 'Analyse des candidatures',
              type: 'PROGRAM',
              programId: '/hr/recruitment/analytics',
              icon: 'TrendingUp',
              orderIndex: 2,
              isVisible: true,
            },
          ],
        },
      ],
      permissions: [
        {
          moduleId: 'HR_RECRUITMENT',
          action: 'VIEW',
          name: 'Voir les candidatures',
          description: 'Accès en lecture au vivier de candidatures',
        },
        {
          moduleId: 'HR_RECRUITMENT',
          action: 'MANAGE',
          name: 'Gérer les candidatures',
          description: 'Créer, modifier et supprimer des candidatures',
        },
      ],
      icon: 'Users',
      metadata: {
        author: 'TopSteel Solutions',
        keywords: ['rh', 'recrutement', 'candidatures', 'hellowork', 'indeed'],
        documentation: 'https://docs.topsteel.fr/modules/hr-recruitment',
        supportContact: 'support@topsteel.fr',
      },
    },
    {
      moduleKey: 'procurement-optimizer',
      displayName: 'Optimisation des Achats',
      description:
        "Mutualisation des demandes d'achats et négociation groupée pour obtenir de meilleurs prix. Comparateur de fournisseurs et marketplace B2B intégrée.",
      shortDescription: "Réduisez vos coûts d'achat jusqu'à 15%",
      category: MarketplaceCategory.PROCUREMENT,
      publisher: 'ProcureMax',
      pricing: {
        type: PricingType.COMMISSION,
        commissionRate: 0.02,
        description: '2% des économies réalisées sur les achats groupés',
      },
      dependencies: [],
      menuConfiguration: [
        {
          title: 'Achats Optimisés',
          type: 'FOLDER',
          icon: 'ShoppingCart',
          orderIndex: 20,
          isVisible: true,
          children: [
            {
              title: 'Demandes groupées',
              type: 'PROGRAM',
              programId: '/procurement/group-requests',
              icon: 'Users',
              orderIndex: 1,
              isVisible: true,
            },
            {
              title: 'Comparateur fournisseurs',
              type: 'PROGRAM',
              programId: '/procurement/supplier-comparison',
              icon: 'BarChart3',
              orderIndex: 2,
              isVisible: true,
            },
            {
              title: 'Marketplace B2B',
              type: 'LINK',
              externalUrl: 'https://b2b-marketplace.topsteel.fr',
              icon: 'ExternalLink',
              orderIndex: 3,
              isVisible: true,
            },
          ],
        },
      ],
      permissions: [
        {
          moduleId: 'PROCUREMENT',
          action: 'VIEW',
          name: 'Voir les achats',
          description: "Accès aux fonctionnalités d'achat",
        },
        {
          moduleId: 'PROCUREMENT',
          action: 'CREATE_REQUEST',
          name: 'Créer des demandes',
          description: "Créer des demandes d'achat groupées",
        },
      ],
      icon: 'ShoppingCart',
      metadata: {
        author: 'ProcureMax',
        keywords: ['achats', 'procurement', 'fournisseurs', 'économies'],
        homepage: 'https://procuremax.com',
      },
    },
    {
      moduleKey: 'advanced-analytics',
      displayName: 'Analytics Avancées',
      description:
        'Tableaux de bord BI avec KPI métier et analyses prédictives pour optimiser vos performances. Intégration avec les principales sources de données.',
      shortDescription: 'Intelligence décisionnelle pour votre métallerie',
      category: MarketplaceCategory.ANALYTICS,
      publisher: 'DataViz Pro',
      pricing: {
        type: PricingType.SUBSCRIPTION,
        amount: 149,
        currency: 'EUR',
        period: 'MONTH',
        description: 'Par mois, facturation annuelle disponible',
      },
      dependencies: [],
      menuConfiguration: [
        {
          title: 'Analytics',
          type: 'FOLDER',
          icon: 'BarChart3',
          orderIndex: 25,
          isVisible: true,
          children: [
            {
              title: 'Tableaux de bord',
              type: 'PROGRAM',
              programId: '/analytics/dashboards',
              icon: 'Monitor',
              orderIndex: 1,
              isVisible: true,
            },
            {
              title: 'Analyses prédictives',
              type: 'PROGRAM',
              programId: '/analytics/predictive',
              icon: 'TrendingUp',
              orderIndex: 2,
              isVisible: true,
            },
          ],
        },
      ],
      permissions: [
        {
          moduleId: 'ANALYTICS',
          action: 'VIEW',
          name: 'Voir les analytics',
          description: 'Accès aux tableaux de bord et analyses',
        },
      ],
      icon: 'BarChart3',
      metadata: {
        author: 'DataViz Pro',
        keywords: ['analytics', 'bi', 'kpi', 'prédictif', 'tableaux de bord'],
      },
    },
    {
      moduleKey: 'maintenance-predictive',
      displayName: 'Maintenance Prédictive',
      description:
        'IoT et IA pour prévenir les pannes et optimiser la maintenance de vos équipements industriels. Surveillance en temps réel et alertes automatiques.',
      shortDescription: "Anticipez les pannes avec l'IA",
      category: MarketplaceCategory.MAINTENANCE,
      publisher: 'IndusTech',
      pricing: {
        type: PricingType.USAGE_BASED,
        usageUnit: 'capteur/mois',
        description: '25€ par capteur IoT connecté par mois',
      },
      dependencies: [],
      menuConfiguration: [
        {
          title: 'Maintenance Prédictive',
          type: 'FOLDER',
          icon: 'Wrench',
          orderIndex: 30,
          isVisible: true,
          children: [
            {
              title: 'Surveillance équipements',
              type: 'PROGRAM',
              programId: '/maintenance/monitoring',
              icon: 'Activity',
              orderIndex: 1,
              isVisible: true,
            },
            {
              title: 'Prédictions pannes',
              type: 'PROGRAM',
              programId: '/maintenance/predictions',
              icon: 'AlertTriangle',
              orderIndex: 2,
              isVisible: true,
            },
          ],
        },
      ],
      permissions: [
        {
          moduleId: 'MAINTENANCE',
          action: 'VIEW',
          name: 'Voir maintenance',
          description: 'Accès aux données de maintenance',
        },
      ],
      icon: 'Wrench',
      metadata: {
        author: 'IndusTech',
        keywords: ['maintenance', 'iot', 'prédictif', 'pannes', 'équipements'],
      },
    },
    {
      moduleKey: 'quality-compliance',
      displayName: 'Conformité Qualité',
      description:
        'Suivi des normes ISO, certifications et audits qualité pour assurer la conformité de vos produits et processus industriels.',
      shortDescription: 'Maintenez vos certifications qualité',
      category: MarketplaceCategory.QUALITY,
      publisher: 'QualityFirst',
      pricing: {
        type: PricingType.ONE_TIME,
        amount: 1500,
        currency: 'EUR',
        description: 'Licence perpétuelle + support 1 an inclus',
      },
      dependencies: [],
      menuConfiguration: [
        {
          title: 'Qualité',
          type: 'FOLDER',
          icon: 'Shield',
          orderIndex: 35,
          isVisible: true,
          children: [
            {
              title: 'Suivi certifications',
              type: 'PROGRAM',
              programId: '/quality/certifications',
              icon: 'Award',
              orderIndex: 1,
              isVisible: true,
            },
            {
              title: 'Audits qualité',
              type: 'PROGRAM',
              programId: '/quality/audits',
              icon: 'CheckCircle',
              orderIndex: 2,
              isVisible: true,
            },
          ],
        },
      ],
      permissions: [
        {
          moduleId: 'QUALITY',
          action: 'VIEW',
          name: 'Voir qualité',
          description: 'Accès aux données qualité',
        },
      ],
      icon: 'Shield',
      metadata: {
        author: 'QualityFirst',
        keywords: ['qualité', 'iso', 'certification', 'audit', 'conformité'],
      },
    },
    {
      moduleKey: 'finance-advanced',
      displayName: 'Finance Avancée',
      description:
        'Factoring, crédit-bail, analyses de rentabilité et outils financiers avancés pour optimiser la gestion financière de votre entreprise.',
      shortDescription: 'Optimisez votre gestion financière',
      category: MarketplaceCategory.FINANCE,
      publisher: 'FinanceMax',
      pricing: {
        type: PricingType.SUBSCRIPTION,
        amount: 299,
        currency: 'EUR',
        period: 'MONTH',
        description: 'Par mois, engagement 12 mois',
      },
      dependencies: [],
      menuConfiguration: [
        {
          title: 'Finance Avancée',
          type: 'FOLDER',
          icon: 'DollarSign',
          orderIndex: 40,
          isVisible: true,
          children: [
            {
              title: 'Factoring',
              type: 'PROGRAM',
              programId: '/finance/factoring',
              icon: 'CreditCard',
              orderIndex: 1,
              isVisible: true,
            },
            {
              title: 'Analyses rentabilité',
              type: 'PROGRAM',
              programId: '/finance/profitability',
              icon: 'TrendingUp',
              orderIndex: 2,
              isVisible: true,
            },
          ],
        },
      ],
      permissions: [
        {
          moduleId: 'FINANCE',
          action: 'VIEW',
          name: 'Voir finance',
          description: 'Accès aux outils financiers',
        },
      ],
      icon: 'DollarSign',
      metadata: {
        author: 'FinanceMax',
        keywords: ['finance', 'factoring', 'rentabilité', 'crédit-bail'],
      },
    },
  ]

  try {
    for (const moduleData of modulesToCreate) {
      const module = await marketplaceService.createModule(moduleData, 'system')

      // Publier automatiquement le module
      await marketplaceService.publishModule(module.id)
    }
  } catch (_error) {
  } finally {
    await app.close()
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedMarketplaceModules().catch((_error) => {
    // Erreur capturée mais ignorée
  })
}

export { seedMarketplaceModules }
