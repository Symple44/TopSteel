/**
 * Script d'initialisation des paramètres pour les partners
 * Insère les types, catégories et groupes de clients dans la table parameters_client
 */

import type { DataSource } from 'typeorm'
import {
  ClientParameterAccess,
  ClientParameterScope,
  ClientParameterType,
  ParameterClient,
} from '../features/parameters/entities/parameter-client.entity'

// Configuration des paramètres à insérer
const PARTNER_PARAMETERS = [
  // Types de partners spécifiques à la métallurgie
  {
    group: 'partner_types',
    key: 'business_types',
    value: JSON.stringify([
      { code: 'ACIER_CONSTRUCTION', label: 'Acier de construction', icon: '🏗️' },
      { code: 'INOX_ALIMENTAIRE', label: 'Inox alimentaire', icon: '🍴' },
      { code: 'ALUMINIUM', label: 'Aluminium', icon: '⚡' },
      { code: 'CUIVRE', label: 'Cuivre et alliages', icon: '🔌' },
      { code: 'SPECIAL', label: 'Métaux spéciaux', icon: '💎' },
      { code: 'RECYCLAGE', label: 'Recyclage métaux', icon: '♻️' },
      { code: 'NEGOCE', label: 'Négoce général', icon: '📦' },
    ]),
    type: ClientParameterType.JSON,
    scope: ClientParameterScope.CONFIGURATION,
    access: ClientParameterAccess.ADMIN_ONLY,
    description: 'Types de business spécifiques à la métallurgie',
    displayOrder: 1,
  },

  // Groupes tarifaires
  {
    group: 'partner_groups',
    key: 'tariff_groups',
    value: JSON.stringify([
      {
        code: 'VIP',
        label: 'Client VIP',
        discount: 15,
        creditLimit: 100000,
        paymentTerms: '60J',
        color: '#FFD700',
      },
      {
        code: 'GROSSISTE',
        label: 'Grossiste',
        discount: 10,
        creditLimit: 50000,
        paymentTerms: '45J',
        color: '#4CAF50',
      },
      {
        code: 'REVENDEUR',
        label: 'Revendeur',
        discount: 5,
        creditLimit: 25000,
        paymentTerms: '30J',
        color: '#2196F3',
      },
      {
        code: 'PROFESSIONNEL',
        label: 'Professionnel',
        discount: 3,
        creditLimit: 15000,
        paymentTerms: '30J',
        color: '#9C27B0',
      },
      {
        code: 'PARTICULIER',
        label: 'Particulier',
        discount: 0,
        creditLimit: 5000,
        paymentTerms: 'COMPTANT',
        color: '#607D8B',
      },
    ]),
    type: ClientParameterType.JSON,
    scope: ClientParameterScope.CONFIGURATION,
    access: ClientParameterAccess.ADMIN_ONLY,
    description: 'Groupes tarifaires pour les partners',
    displayOrder: 2,
  },

  // Secteurs d'activité
  {
    group: 'partner_sectors',
    key: 'activity_sectors',
    value: JSON.stringify([
      { code: 'BTP', label: 'BTP - Construction', icon: '🏗️' },
      { code: 'INDUSTRIE_LOURDE', label: 'Industrie lourde', icon: '🏭' },
      { code: 'NAVAL', label: 'Construction navale', icon: '🚢' },
      { code: 'AERONAUTIQUE', label: 'Aéronautique', icon: '✈️' },
      { code: 'FERROVIAIRE', label: 'Ferroviaire', icon: '🚂' },
      { code: 'AUTOMOBILE', label: 'Automobile', icon: '🚗' },
      { code: 'ENERGIE', label: 'Énergie', icon: '⚡' },
      { code: 'AGRO_ALIMENTAIRE', label: 'Agro-alimentaire', icon: '🌾' },
      { code: 'CHIMIE', label: 'Chimie - Pétrochimie', icon: '⚗️' },
      { code: 'MECANIQUE', label: 'Mécanique générale', icon: '⚙️' },
      { code: 'ELECTRONIQUE', label: 'Électronique', icon: '💻' },
      { code: 'MEDICAL', label: 'Médical - Pharmaceutique', icon: '🏥' },
      { code: 'DEFENSE', label: 'Défense', icon: '🛡️' },
      { code: 'AUTRE', label: 'Autre secteur', icon: '📋' },
    ]),
    type: ClientParameterType.JSON,
    scope: ClientParameterScope.CONFIGURATION,
    access: ClientParameterAccess.ADMIN_ONLY,
    description: "Secteurs d'activité des partners",
    displayOrder: 3,
  },

  // Rôles des contacts
  {
    group: 'partner_contacts',
    key: 'contact_roles',
    value: JSON.stringify([
      { code: 'COMMERCIAL', label: 'Commercial', icon: '💼' },
      { code: 'TECHNIQUE', label: 'Technique', icon: '🔧' },
      { code: 'COMPTABILITE', label: 'Comptabilité', icon: '💰' },
      { code: 'DIRECTION', label: 'Direction', icon: '👔' },
      { code: 'ACHATS', label: 'Achats', icon: '🛒' },
      { code: 'QUALITE', label: 'Qualité', icon: '✅' },
      { code: 'LOGISTIQUE', label: 'Logistique', icon: '🚚' },
      { code: 'PRODUCTION', label: 'Production', icon: '🏭' },
      { code: 'HSE', label: 'HSE - Sécurité', icon: '🦺' },
      { code: 'JURIDIQUE', label: 'Juridique', icon: '⚖️' },
      { code: 'RH', label: 'Ressources Humaines', icon: '👥' },
      { code: 'AUTRE', label: 'Autre', icon: '📋' },
    ]),
    type: ClientParameterType.JSON,
    scope: ClientParameterScope.CONFIGURATION,
    access: ClientParameterAccess.USER_EDITABLE,
    description: 'Rôles possibles pour les contacts',
    displayOrder: 4,
  },

  // Types de sites
  {
    group: 'partner_sites',
    key: 'site_types',
    value: JSON.stringify([
      { code: 'SIEGE_SOCIAL', label: 'Siège social', icon: '🏢' },
      { code: 'USINE', label: 'Usine de production', icon: '🏭' },
      { code: 'DEPOT', label: 'Dépôt / Entrepôt', icon: '📦' },
      { code: 'CHANTIER', label: 'Chantier', icon: '🚧' },
      { code: 'BUREAU', label: 'Bureau / Agence', icon: '🏢' },
      { code: 'MAGASIN', label: 'Magasin', icon: '🏪' },
      { code: 'PLATEFORME', label: 'Plateforme logistique', icon: '🚛' },
      { code: 'POINT_LIVRAISON', label: 'Point de livraison', icon: '📍' },
      { code: 'ATELIER', label: 'Atelier', icon: '🔧' },
      { code: 'LABORATOIRE', label: 'Laboratoire', icon: '🔬' },
    ]),
    type: ClientParameterType.JSON,
    scope: ClientParameterScope.CONFIGURATION,
    access: ClientParameterAccess.USER_EDITABLE,
    description: 'Types de sites pour les partners',
    displayOrder: 5,
  },

  // Conditions de paiement
  {
    group: 'partner_commercial',
    key: 'payment_terms',
    value: JSON.stringify([
      { code: 'COMPTANT', label: 'Comptant', days: 0 },
      { code: '30J', label: '30 jours', days: 30 },
      { code: '30JFDM', label: '30 jours fin de mois', days: 30, endOfMonth: true },
      { code: '45J', label: '45 jours', days: 45 },
      { code: '45JFDM', label: '45 jours fin de mois', days: 45, endOfMonth: true },
      { code: '60J', label: '60 jours', days: 60 },
      { code: '60JFDM', label: '60 jours fin de mois', days: 60, endOfMonth: true },
      { code: '90J', label: '90 jours', days: 90 },
      { code: 'ANTICIPE', label: 'Paiement anticipé', days: -1 },
      { code: 'SPECIAL', label: 'Conditions spéciales', days: null },
    ]),
    type: ClientParameterType.JSON,
    scope: ClientParameterScope.CONFIGURATION,
    access: ClientParameterAccess.ADMIN_ONLY,
    description: 'Conditions de paiement disponibles',
    displayOrder: 6,
  },

  // Modes de paiement
  {
    group: 'partner_commercial',
    key: 'payment_methods',
    value: JSON.stringify([
      { code: 'VIREMENT', label: 'Virement bancaire', icon: '🏦' },
      { code: 'CHEQUE', label: 'Chèque', icon: '📝' },
      { code: 'CB', label: 'Carte bancaire', icon: '💳' },
      { code: 'ESPECES', label: 'Espèces', icon: '💵' },
      { code: 'TRAITE', label: 'Traite', icon: '📜' },
      { code: 'LCR', label: 'LCR', icon: '📄' },
      { code: 'PRELEVEMENT', label: 'Prélèvement SEPA', icon: '🔄' },
      { code: 'AFFACTURAGE', label: 'Affacturage', icon: '📊' },
    ]),
    type: ClientParameterType.JSON,
    scope: ClientParameterScope.CONFIGURATION,
    access: ClientParameterAccess.USER_EDITABLE,
    description: 'Modes de paiement acceptés',
    displayOrder: 7,
  },

  // Incoterms pour l'international
  {
    group: 'partner_commercial',
    key: 'incoterms',
    value: JSON.stringify([
      { code: 'EXW', label: 'EXW - Ex Works', description: 'Départ usine' },
      { code: 'FCA', label: 'FCA - Free Carrier', description: 'Franco transporteur' },
      { code: 'CPT', label: 'CPT - Carriage Paid To', description: "Port payé jusqu'à" },
      {
        code: 'CIP',
        label: 'CIP - Carriage and Insurance Paid To',
        description: 'Port payé, assurance comprise',
      },
      {
        code: 'DAP',
        label: 'DAP - Delivered at Place',
        description: 'Rendu au lieu de destination',
      },
      {
        code: 'DPU',
        label: 'DPU - Delivered at Place Unloaded',
        description: 'Rendu au lieu de destination déchargé',
      },
      { code: 'DDP', label: 'DDP - Delivered Duty Paid', description: 'Rendu droits acquittés' },
      { code: 'FAS', label: 'FAS - Free Alongside Ship', description: 'Franco le long du navire' },
      { code: 'FOB', label: 'FOB - Free on Board', description: 'Franco à bord' },
      { code: 'CFR', label: 'CFR - Cost and Freight', description: 'Coût et fret' },
      {
        code: 'CIF',
        label: 'CIF - Cost, Insurance and Freight',
        description: 'Coût, assurance et fret',
      },
    ]),
    type: ClientParameterType.JSON,
    scope: ClientParameterScope.CONFIGURATION,
    access: ClientParameterAccess.USER_EDITABLE,
    description: 'Incoterms 2020 pour le commerce international',
    displayOrder: 8,
  },

  // Types de véhicules pour la logistique
  {
    group: 'partner_logistics',
    key: 'vehicle_types',
    value: JSON.stringify([
      { code: 'VL', label: 'Véhicule léger', maxTonnage: 3.5 },
      { code: 'PORTEUR', label: 'Porteur', maxTonnage: 19 },
      { code: 'SEMI', label: 'Semi-remorque', maxTonnage: 44 },
      { code: 'TRAIN_ROUTIER', label: 'Train routier', maxTonnage: 44 },
      { code: 'PORTE_CHAR', label: 'Porte-char', maxTonnage: 50 },
      { code: 'GRUE', label: 'Camion-grue', maxTonnage: 32 },
      { code: 'PLATEAU', label: 'Plateau', maxTonnage: 44 },
      { code: 'BENNE', label: 'Benne', maxTonnage: 32 },
      { code: 'CITERNE', label: 'Citerne', maxTonnage: 30 },
    ]),
    type: ClientParameterType.JSON,
    scope: ClientParameterScope.CONFIGURATION,
    access: ClientParameterAccess.USER_EDITABLE,
    description: 'Types de véhicules pour la livraison',
    displayOrder: 9,
  },

  // Zones de transport
  {
    group: 'partner_logistics',
    key: 'transport_zones',
    value: JSON.stringify([
      { code: 'LOCAL', label: 'Local (< 50km)', tarifMultiplier: 1 },
      { code: 'REGIONAL', label: 'Régional (50-200km)', tarifMultiplier: 1.2 },
      { code: 'NATIONAL', label: 'National (> 200km)', tarifMultiplier: 1.5 },
      { code: 'INTERNATIONAL_UE', label: 'International UE', tarifMultiplier: 2 },
      { code: 'INTERNATIONAL_HORS_UE', label: 'International Hors UE', tarifMultiplier: 3 },
      { code: 'EXPRESS', label: 'Express', tarifMultiplier: 2.5 },
      { code: 'URGENT', label: 'Urgent', tarifMultiplier: 3.5 },
    ]),
    type: ClientParameterType.JSON,
    scope: ClientParameterScope.CONFIGURATION,
    access: ClientParameterAccess.ADMIN_ONLY,
    description: 'Zones de transport et multiplicateurs tarifaires',
    displayOrder: 10,
  },
]

async function initPartnerParameters(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(ParameterClient)

  console.log('🚀 Initialisation des paramètres partners...')

  for (const param of PARTNER_PARAMETERS) {
    try {
      // Vérifier si le paramètre existe déjà
      const existing = await repository.findOne({
        where: {
          group: param.group,
          key: param.key,
          tenantId: 'default', // À adapter selon votre système de tenant
        },
      })

      if (existing) {
        console.log(`⚠️  Paramètre existant: ${param.group}.${param.key}`)
        continue
      }

      // Créer le nouveau paramètre
      const entity = repository.create({
        ...param,
        tenantId: 'default', // À adapter selon votre système de tenant
        isEditable: param.access !== ClientParameterAccess.SYSTEM_MANAGED,
        metadata: {
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          source: 'init-script',
        },
      })

      await repository.save(entity)
      console.log(`✅ Paramètre créé: ${param.group}.${param.key}`)
    } catch (error) {
      console.error(`❌ Erreur création paramètre ${param.group}.${param.key}:`, error)
    }
  }

  console.log('✨ Initialisation des paramètres partners terminée!')
}

// Si exécuté directement
if (require.main === module) {
  const { AppDataSource } = require('../core/database/data-source')

  AppDataSource.initialize()
    .then(async () => {
      await initPartnerParameters(AppDataSource)
      await AppDataSource.destroy()
      process.exit(0)
    })
    .catch((error: Error) => {
      console.error('Erreur:', error)
      process.exit(1)
    })
}

export { initPartnerParameters }
