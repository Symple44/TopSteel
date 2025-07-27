import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HrAggregatorService } from './services/hr-aggregator.service'
import { HrAggregatorController } from './controllers/hr-aggregator.controller'
import { JobPosting } from './entities/job-posting.entity'
import { CandidateProfile } from './entities/candidate-profile.entity'
import { JobApplication } from './entities/job-application.entity'
import { PlatformConfig } from './entities/platform-config.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobPosting,
      CandidateProfile,
      JobApplication,
      PlatformConfig
    ], 'tenant') // Données tenant-spécifiques
  ],
  providers: [HrAggregatorService],
  controllers: [HrAggregatorController],
  exports: [HrAggregatorService]
})
export class HrAggregatorModule {
  static getModuleInfo() {
    return {
      moduleKey: 'hr-aggregator',
      displayName: 'Agrégateur de Candidatures RH',
      description: 'Module d\'agrégation de candidatures provenant de HelloWork, Indeed, LinkedIn Jobs et autres plateformes de recrutement. Centralise la gestion des offres d\'emploi et des candidatures.',
      shortDescription: 'Centralise les candidatures de multiples plateformes RH',
      category: 'HR',
      version: '1.0.0',
      publisher: 'TopSteel Solutions',
      pricing: {
        type: 'SUBSCRIPTION',
        amount: 49.99,
        currency: 'EUR',
        period: 'MONTHLY',
        features: [
          'Jusqu\'à 10 plateformes connectées',
          'Synchronisation automatique des candidatures',
          'Analyse de correspondance IA',
          'Rapports de performance'
        ]
      },
      dependencies: [],
      menuConfiguration: [
        {
          title: 'Candidatures',
          type: 'M',
          orderIndex: 100,
          children: [
            {
              title: 'Dashboard RH',
              type: 'P',
              programId: 'hr-dashboard',
              orderIndex: 1
            },
            {
              title: 'Offres d\'emploi',
              type: 'P',
              programId: 'job-postings',
              orderIndex: 2
            },
            {
              title: 'Candidats',
              type: 'P',
              programId: 'candidates',
              orderIndex: 3
            },
            {
              title: 'Configuration',
              type: 'P',
              programId: 'hr-config',
              orderIndex: 4
            }
          ]
        }
      ],
      permissions: [
        { name: 'hr.view', description: 'Consulter les données RH' },
        { name: 'hr.manage', description: 'Gérer les candidatures et offres' },
        { name: 'hr.admin', description: 'Administration complète du module RH' }
      ],
      apiRoutes: [
        { method: 'GET', path: '/hr/candidates', description: 'Liste des candidats' },
        { method: 'GET', path: '/hr/job-postings', description: 'Liste des offres d\'emploi' },
        { method: 'POST', path: '/hr/sync', description: 'Synchroniser avec les plateformes' }
      ],
      icon: 'users',
      metadata: {
        supportedPlatforms: ['HelloWork', 'Indeed', 'LinkedIn Jobs', 'Pôle Emploi'],
        dataRetention: '24 months',
        compliance: ['RGPD', 'CCPA'],
        integrationComplexity: 'medium'
      }
    }
  }
}