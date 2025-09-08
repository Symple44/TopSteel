import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { ParameterSystem } from '../../../features/parameters/entities/parameter-system.entity'

@Injectable()
export class PartnerParametersInitService {
  private readonly logger = new Logger(PartnerParametersInitService.name)

  constructor(
    @InjectRepository(ParameterSystem, 'auth')
    private readonly parameterSystemRepository: Repository<ParameterSystem>
  ) {}

  async initializePartnerParameters(): Promise<void> {
    this.logger.log('Initializing partner parameters...')

    const parameters = [
      {
        group: 'PARTNER_TYPES',
        key: 'partner_types',
        value: 'Types de partenaires',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Types de partenaires disponibles',
        arrayValues: ['CLIENT', 'FOURNISSEUR', 'MIXTE'],
        isActive: true,
      },
      {
        group: 'PARTNER_STATUS',
        key: 'partner_status',
        value: 'Statuts de partenaires',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Statuts possibles pour les partenaires',
        arrayValues: ['ACTIF', 'INACTIF', 'PROSPECT', 'SUSPENDU', 'ARCHIVE'],
        isActive: true,
      },
      {
        group: 'PARTNER_CATEGORIES',
        key: 'partner_categories',
        value: 'Catégories de partenaires',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Catégories métier des partenaires',
        arrayValues: [
          'METALLURGIE',
          'BTP',
          'INDUSTRIE',
          'NEGOCE',
          'DISTRIBUTION',
          'PARTICULIER',
          'COLLECTIVITE',
          'AUTRE',
        ],
        isActive: true,
      },
      {
        group: 'GROUP_TYPES',
        key: 'group_types',
        value: 'Types de groupes',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Types de groupes de partenaires',
        arrayValues: ['TARIF', 'COMMERCIAL', 'LOGISTIQUE', 'COMPTABLE'],
        isActive: true,
      },
      {
        group: 'GROUP_STATUS',
        key: 'group_status',
        value: 'Statuts de groupes',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Statuts possibles pour les groupes',
        arrayValues: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
        isActive: true,
      },
      {
        group: 'CONTACT_ROLES',
        key: 'contact_roles',
        value: 'Rôles de contacts',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Rôles possibles pour les contacts',
        arrayValues: [
          'COMMERCIAL',
          'TECHNIQUE',
          'COMPTABILITE',
          'DIRECTION',
          'ACHAT',
          'LOGISTIQUE',
          'QUALITE',
          'AUTRE',
        ],
        isActive: true,
      },
      {
        group: 'CONTACT_STATUS',
        key: 'contact_status',
        value: 'Statuts de contacts',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Statuts possibles pour les contacts',
        arrayValues: ['ACTIF', 'INACTIF', 'PARTI'],
        isActive: true,
      },
      {
        group: 'SITE_TYPES',
        key: 'site_types',
        value: 'Types de sites',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Types de sites partenaires',
        arrayValues: ['SIEGE_SOCIAL', 'USINE', 'DEPOT', 'CHANTIER', 'MAGASIN', 'BUREAU', 'AUTRE'],
        isActive: true,
      },
      {
        group: 'SITE_STATUS',
        key: 'site_status',
        value: 'Statuts de sites',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Statuts possibles pour les sites',
        arrayValues: ['ACTIF', 'INACTIF', 'FERME', 'EN_TRAVAUX'],
        isActive: true,
      },
      {
        group: 'ACCESSIBILITE',
        key: 'accessibilite',
        value: 'Niveaux accessibilité',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: "Niveaux d'accessibilité des sites",
        arrayValues: ['FACILE', 'MOYEN', 'DIFFICILE', 'TRES_DIFFICILE'],
        isActive: true,
      },
      {
        group: 'ADDRESS_TYPES',
        key: 'address_types',
        value: "Types d'adresses",
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: "Types d'adresses possibles",
        arrayValues: ['FACTURATION', 'LIVRAISON', 'SIEGE', 'AUTRE'],
        isActive: true,
      },
      {
        group: 'ADDRESS_STATUS',
        key: 'address_status',
        value: "Statuts d'adresses",
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Statuts possibles pour les adresses',
        arrayValues: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
        isActive: true,
      },
      {
        group: 'PAYMENT_TERMS',
        key: 'payment_terms',
        value: 'Conditions de paiement',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Conditions de paiement disponibles',
        arrayValues: [
          'COMPTANT',
          '30_JOURS',
          '30_JOURS_FIN_DE_MOIS',
          '45_JOURS',
          '45_JOURS_FIN_DE_MOIS',
          '60_JOURS',
          '60_JOURS_FIN_DE_MOIS',
          '90_JOURS',
        ],
        isActive: true,
      },
      {
        group: 'PAYMENT_MODES',
        key: 'payment_modes',
        value: 'Modes de paiement',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Modes de paiement acceptés',
        arrayValues: ['VIREMENT', 'CHEQUE', 'ESPECES', 'CB', 'PRELEVEMENT', 'TRAITE', 'LCR'],
        isActive: true,
      },
      {
        group: 'CIVILITES',
        key: 'civilites',
        value: 'Civilités',
        type: 'ARRAY',
        scope: 'SYSTEM',
        description: 'Civilités disponibles',
        arrayValues: ['M.', 'Mme', 'Mlle', 'Dr', 'Pr', 'Me'],
        isActive: true,
      },
    ]

    for (const param of parameters) {
      try {
        // Vérifier si le paramètre existe déjà
        const existing = await this.parameterSystemRepository.findOne({
          where: { group: param.group, key: param.key },
        })

        if (existing) {
          this.logger.log(`Parameter already exists: ${param.group}.${param.key}`)
        } else {
          // Créer le paramètre s'il n'existe pas
          const newParam = this.parameterSystemRepository.create({
            ...param,
            arrayValues: param.arrayValues, // TypeORM convertira automatiquement en JSONB
          } as any)

          await this.parameterSystemRepository.save(newParam)
          this.logger.log(`Created parameter: ${param.group}.${param.key}`)
        }
      } catch (error) {
        this.logger.error(`Error creating parameter ${param.group}.${param.key}:`, error)
      }
    }

    this.logger.log('Partner parameters initialization completed')
  }

  /**
   * Récupère les valeurs possibles pour un type de paramètre
   */
  async getParameterValues(group: string, key: string): Promise<string[]> {
    const param = await this.parameterSystemRepository.findOne({
      where: { group, key },
    })

    if (!param || !param.arrayValues) {
      return []
    }

    return param.arrayValues as string[]
  }

  /**
   * Récupère tous les paramètres pour les partners
   */
  async getAllPartnerParameters(): Promise<Record<string, string[]>> {
    const params = await this.parameterSystemRepository.find({
      where: [
        { group: 'PARTNER_TYPES' },
        { group: 'PARTNER_STATUS' },
        { group: 'PARTNER_CATEGORIES' },
        { group: 'GROUP_TYPES' },
        { group: 'GROUP_STATUS' },
        { group: 'CONTACT_ROLES' },
        { group: 'CONTACT_STATUS' },
        { group: 'SITE_TYPES' },
        { group: 'SITE_STATUS' },
        { group: 'ACCESSIBILITE' },
        { group: 'ADDRESS_TYPES' },
        { group: 'ADDRESS_STATUS' },
        { group: 'PAYMENT_TERMS' },
        { group: 'PAYMENT_MODES' },
        { group: 'CIVILITES' },
      ],
    })

    const result: Record<string, string[]> = {}

    for (const param of params) {
      result[param.key] = (param.arrayValues as string[]) || []
    }

    return result
  }
}
