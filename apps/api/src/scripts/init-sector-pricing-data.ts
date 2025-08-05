import 'reflect-metadata'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { BTPIndex, BTPIndexType } from '../modules/pricing/entities/btp-index.entity'
import { CustomerSectorAssignment } from '../modules/pricing/entities/customer-sector-assignment.entity'
import {
  CoefficientType,
  SectorCoefficient,
  SectorType,
} from '../modules/pricing/entities/sector-coefficient.entity'

// Charger les variables d'environnement
config()

const TenantDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel_topsteel',

  synchronize: false,
  logging: true,

  entities: [SectorCoefficient, CustomerSectorAssignment, BTPIndex],
})

async function initSectorPricingData() {
  try {
    await TenantDataSource.initialize()

    const coefficientRepo = TenantDataSource.getRepository(SectorCoefficient)
    const btpIndexRepo = TenantDataSource.getRepository(BTPIndex)

    // Tenant ID par défaut (à adapter selon votre système)
    const defaultTenantId = '00000000-0000-0000-0000-000000000001'

    // 1. Coefficient de base BTP (+10%)
    const btpBaseCoeff = coefficientRepo.create({
      sector: SectorType.BTP,
      sectorName: 'Bâtiment et Travaux Publics',
      coefficientType: CoefficientType.BASE_PRICE,
      coefficient: 1.1,
      description: 'Coefficient de base BTP (+10% sur prix matériaux)',
      isActive: true,
      priority: 10,
      conditions: {
        minQuantity: 1,
        articleFamilies: ['POUTRELLES', 'PROFILES', 'TUBES', 'PLATS', 'TOLES'],
      },
      parameters: {
        applyToBasePrice: true,
        btpSpecific: {
          applyCOFRAC: true,
          applyBTPCoeff: true,
          minimumOrder: 500,
        },
      },
      metadata: {
        createdBy: 'system',
        notes: 'Coefficient standard BTP pour matériaux métallurgiques',
        internalCode: 'BTP_BASE_001',
      },
    })

    // 2. Remise BTP sur gros volumes (-5%)
    const btpVolumeDiscount = coefficientRepo.create({
      sector: SectorType.BTP,
      sectorName: 'Bâtiment et Travaux Publics',
      coefficientType: CoefficientType.DISCOUNT,
      coefficient: 5,
      description: 'Remise BTP sur commandes importantes (-5%)',
      isActive: true,
      priority: 5,
      conditions: {
        minQuantity: 100,
        minAmount: 5000,
      },
      parameters: {
        discountType: 'percentage',
      },
      metadata: {
        createdBy: 'system',
        notes: 'Remise accordée aux entreprises BTP sur gros volumes',
        internalCode: 'BTP_DISC_001',
      },
    })

    // 3. Remise BTP progressive selon quantité
    const btpProgressiveDiscount = coefficientRepo.create({
      sector: SectorType.BTP,
      sectorName: 'Bâtiment et Travaux Publics',
      coefficientType: CoefficientType.DISCOUNT,
      coefficient: 0, // Géré par les taux progressifs
      description: 'Remise progressive BTP selon quantité',
      isActive: true,
      priority: 6,
      conditions: {
        minQuantity: 50,
      },
      parameters: {
        discountType: 'progressive',
        progressiveRates: [
          { minQuantity: 50, rate: 2 }, // 2% à partir de 50 unités
          { minQuantity: 200, rate: 4 }, // 4% à partir de 200 unités
          { minQuantity: 500, rate: 7 }, // 7% à partir de 500 unités
          { minQuantity: 1000, rate: 10 }, // 10% à partir de 1000 unités
        ],
      },
      metadata: {
        createdBy: 'system',
        notes: 'Remises dégressives selon volume pour fidéliser les gros clients BTP',
        internalCode: 'BTP_PROG_001',
      },
    })

    // 4. Frais de transport BTP
    const btpTransport = coefficientRepo.create({
      sector: SectorType.BTP,
      sectorName: 'Bâtiment et Travaux Publics',
      coefficientType: CoefficientType.TRANSPORT,
      coefficient: 150,
      description: 'Frais de transport et livraison BTP',
      isActive: true,
      priority: 1,
      conditions: {},
      parameters: {
        calculationMethod: 'fixed',
        freeThreshold: 2000, // Gratuit au-dessus de 2000€
      },
      metadata: {
        createdBy: 'system',
        notes: 'Transport gratuit pour commandes > 2000€',
        internalCode: 'BTP_TRANS_001',
      },
    })

    // 5. Coefficient Industrie (+5%)
    const industrieCoeff = coefficientRepo.create({
      sector: SectorType.INDUSTRIE,
      sectorName: 'Secteur Industriel',
      coefficientType: CoefficientType.BASE_PRICE,
      coefficient: 1.05,
      description: 'Coefficient industrie (+5% sur prix de base)',
      isActive: true,
      priority: 8,
      conditions: {
        minQuantity: 1,
      },
      parameters: {
        applyToBasePrice: true,
      },
      metadata: {
        createdBy: 'system',
        notes: 'Coefficient standard secteur industriel',
        internalCode: 'IND_BASE_001',
      },
    })

    // 6. Remise Particuliers (-2% sur petites quantités)
    const particulierDiscount = coefficientRepo.create({
      sector: SectorType.PARTICULIER,
      sectorName: 'Particuliers',
      coefficientType: CoefficientType.DISCOUNT,
      coefficient: 2,
      description: 'Remise particuliers sur petites quantités',
      isActive: true,
      priority: 3,
      conditions: {
        maxQuantity: 50,
        maxAmount: 1000,
      },
      parameters: {
        discountType: 'percentage',
      },
      metadata: {
        createdBy: 'system',
        notes: 'Encourager les achats particuliers',
        internalCode: 'PART_DISC_001',
      },
    })

    // Sauvegarder tous les coefficients
    const coefficients = [
      btpBaseCoeff,
      btpVolumeDiscount,
      btpProgressiveDiscount,
      btpTransport,
      industrieCoeff,
      particulierDiscount,
    ]
    for (const coeff of coefficients) {
      // Assigner le tenantId avant la sauvegarde
      ;(coeff as any).tenantId = defaultTenantId
      await coefficientRepo.save(coeff)
    }

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const btpIndices = [
      // Indices matériaux principaux
      {
        indexType: BTPIndexType.ACIER_BTP,
        indexName: 'Indice BTP - Acier',
        indexCode: 'ACIER_BTP',
        indexValue: 128.45,
        indexMetadata: {
          source: 'INSEE',
          methodology: 'Prix de marché acier construction',
          baseYear: 2015,
          frequency: 'monthly',
          components: ['Acier rond', 'Acier plat', 'Poutrelles', 'Tubes'],
        },
      },
      {
        indexType: BTPIndexType.BETON,
        indexName: 'Indice BTP - Béton',
        indexCode: 'BETON',
        indexValue: 115.2,
        indexMetadata: {
          source: 'UNICEM',
          methodology: "Prix béton prêt à l'emploi",
          baseYear: 2015,
          frequency: 'monthly',
        },
      },
      {
        indexType: BTPIndexType.BITUME,
        indexName: 'Indice BTP - Bitume',
        indexCode: 'BITUME',
        indexValue: 142.8,
        indexMetadata: {
          source: 'USIRF',
          methodology: 'Prix bitume routier',
          baseYear: 2015,
          frequency: 'monthly',
        },
      },

      // Indices bâtiment
      {
        indexType: BTPIndexType.BT01,
        indexName: 'Indice BT01 - Gros œuvre',
        indexCode: 'BT01',
        indexValue: 119.75,
        indexMetadata: {
          source: 'FFB',
          methodology: 'Coûts gros œuvre bâtiment',
          baseYear: 2015,
          frequency: 'monthly',
          weightings: {
            matériaux: 0.6,
            main_oeuvre: 0.35,
            matériel: 0.05,
          },
        },
      },
      {
        indexType: BTPIndexType.BT02,
        indexName: 'Indice BT02 - Clos et couvert',
        indexCode: 'BT02',
        indexValue: 121.3,
        indexMetadata: {
          source: 'FFB',
          methodology: 'Coûts clos et couvert',
          baseYear: 2015,
          frequency: 'monthly',
        },
      },

      // Indices travaux publics
      {
        indexType: BTPIndexType.TP01A,
        indexName: 'Indice TP01A - Terrassements généraux',
        indexCode: 'TP01A',
        indexValue: 123.9,
        indexMetadata: {
          source: 'INSEE',
          methodology: 'Coûts terrassements généraux',
          baseYear: 2015,
          frequency: 'monthly',
          components: ['Carburant', "Main d'œuvre", 'Matériel'],
        },
      },
      {
        indexType: BTPIndexType.TP02A,
        indexName: 'Indice TP02A - Assainissement et VRD',
        indexCode: 'TP02A',
        indexValue: 120.15,
        indexMetadata: {
          source: 'INSEE',
          methodology: 'Coûts assainissement et VRD',
          baseYear: 2015,
          frequency: 'monthly',
        },
      },
      {
        indexType: BTPIndexType.TP04A,
        indexName: "Indice TP04A - Ouvrages d'art",
        indexCode: 'TP04A',
        indexValue: 126.7,
        indexMetadata: {
          source: 'INSEE',
          methodology: "Coûts ouvrages d'art",
          baseYear: 2015,
          frequency: 'monthly',
          components: ['Béton', 'Acier', 'Coffrage', "Main d'œuvre"],
        },
      },

      // Indices composites
      {
        indexType: BTPIndexType.TP_COMPOSITE,
        indexName: 'Indice composite Travaux Publics',
        indexCode: 'TP_COMP',
        indexValue: 122.5,
        indexMetadata: {
          source: 'INSEE',
          methodology: 'Moyenne pondérée indices TP',
          baseYear: 2015,
          frequency: 'monthly',
          weightings: {
            TP01A: 0.25,
            TP02A: 0.2,
            TP04A: 0.15,
            autres: 0.4,
          },
        },
      },
      {
        indexType: BTPIndexType.BAT_COMPOSITE,
        indexName: 'Indice composite Bâtiment',
        indexCode: 'BAT_COMP',
        indexValue: 120.85,
        indexMetadata: {
          source: 'FFB',
          methodology: 'Moyenne pondérée indices Bâtiment',
          baseYear: 2015,
          frequency: 'monthly',
          weightings: {
            BT01: 0.4,
            BT02: 0.3,
            BT03: 0.3,
          },
        },
      },
    ]
    for (const indexData of btpIndices) {
      const indexToSave = {
        ...indexData,
        year: currentYear,
        month: currentMonth,
        publicationDate: new Date(),
        applicationDate: new Date(),
        isOfficial: true,
        isProvisional: false,
        tenantId: defaultTenantId,
        indexMetadata: {
          ...indexData.indexMetadata,
          frequency: indexData.indexMetadata.frequency as 'monthly',
        },
      }

      const _savedIndex = await btpIndexRepo.save(indexToSave)
    }
  } catch (_error) {
    process.exit(1)
  } finally {
    if (TenantDataSource.isInitialized) {
      await TenantDataSource.destroy()
    }
  }
}

// Exécuter l'initialisation
initSectorPricingData()
