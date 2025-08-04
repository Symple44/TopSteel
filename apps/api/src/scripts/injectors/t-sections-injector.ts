/**
 * Injecteur pour T-sections (Fers en T)
 * TopSteel ERP - Clean Architecture
 */

import { DataSource } from 'typeorm'
import { BaseArticleInjector } from '../core/base-article-injector'
import { 
  ArticleMetallurgie, 
  GlobalInjectionConfig,
  InjectionLogger,
  ArticleValidator,
  PricingCalculator,
  ArticleFamille,
  ArticleType,
  ArticleStatus,
  UniteStock,
  CaracteristiquesTechniques
} from '../types/article-injection.types'

interface TSectionSpecification {
  dimension: string
  hauteur: number // mm
  largeur: number // mm
  epaisseurAme: number // mm
  epaisseurAile: number // mm
  poids: number // kg/m
  section: number // cm²
  inertiex: number // cm⁴
  inertiey: number // cm⁴
  moduleX: number // cm³
  moduleY: number // cm³
  rayonX: number // cm
  rayonY: number // cm
}

export class TSectionsInjector extends BaseArticleInjector {
  private readonly tSectionSpecifications: TSectionSpecification[] = [
    // T-sections laminées
    { dimension: '30x30x4', hauteur: 30, largeur: 30, epaisseurAme: 4, epaisseurAile: 4, poids: 1.78, section: 2.27, inertiex: 2.39, inertiey: 2.39, moduleX: 1.59, moduleY: 1.59, rayonX: 1.03, rayonY: 1.03 },
    { dimension: '40x40x4', hauteur: 40, largeur: 40, epaisseurAme: 4, epaisseurAile: 4, poids: 2.42, section: 3.08, inertiex: 5.17, inertiey: 5.17, moduleX: 2.59, moduleY: 2.59, rayonX: 1.29, rayonY: 1.29 },
    { dimension: '40x40x5', hauteur: 40, largeur: 40, epaisseurAme: 5, epaisseurAile: 5, poids: 2.97, section: 3.79, inertiex: 6.15, inertiey: 6.15, moduleX: 3.08, moduleY: 3.08, rayonX: 1.27, rayonY: 1.27 },
    { dimension: '50x50x5', hauteur: 50, largeur: 50, epaisseurAme: 5, epaisseurAile: 5, poids: 3.77, section: 4.80, inertiex: 11.9, inertiey: 11.9, moduleX: 4.76, moduleY: 4.76, rayonX: 1.57, rayonY: 1.57 },
    { dimension: '50x50x6', hauteur: 50, largeur: 50, epaisseurAme: 6, epaisseurAile: 6, poids: 4.47, section: 5.69, inertiex: 13.6, inertiey: 13.6, moduleX: 5.44, moduleY: 5.44, rayonX: 1.54, rayonY: 1.54 },
    { dimension: '60x60x6', hauteur: 60, largeur: 60, epaisseurAme: 6, epaisseurAile: 6, poids: 5.50, section: 7.00, inertiex: 23.2, inertiey: 23.2, moduleX: 7.73, moduleY: 7.73, rayonX: 1.82, rayonY: 1.82 },
    { dimension: '70x70x7', hauteur: 70, largeur: 70, epaisseurAme: 7, epaisseurAile: 7, poids: 7.38, section: 9.40, inertiex: 41.0, inertiey: 41.0, moduleX: 11.7, moduleY: 11.7, rayonX: 2.09, rayonY: 2.09 },
    { dimension: '80x80x8', hauteur: 80, largeur: 80, epaisseurAme: 8, epaisseurAile: 8, poids: 9.63, section: 12.3, inertiex: 67.5, inertiey: 67.5, moduleX: 16.9, moduleY: 16.9, rayonX: 2.34, rayonY: 2.34 },
    { dimension: '100x100x10', hauteur: 100, largeur: 100, epaisseurAme: 10, epaisseurAile: 10, poids: 15.0, section: 19.1, inertiex: 166, inertiey: 166, moduleX: 33.2, moduleY: 33.2, rayonX: 2.95, rayonY: 2.95 },
    { dimension: '120x120x11', hauteur: 120, largeur: 120, epaisseurAme: 11, epaisseurAile: 11, poids: 20.2, section: 25.7, inertiex: 307, inertiey: 307, moduleX: 51.2, moduleY: 51.2, rayonX: 3.45, rayonY: 3.45 },
    { dimension: '140x140x13', hauteur: 140, largeur: 140, epaisseurAme: 13, epaisseurAile: 13, poids: 27.9, section: 35.5, inertiex: 529, inertiey: 529, moduleX: 75.6, moduleY: 75.6, rayonX: 3.86, rayonY: 3.86 },
    { dimension: '160x160x15', hauteur: 160, largeur: 160, epaisseurAme: 15, epaisseurAile: 15, poids: 36.9, section: 47.0, inertiex: 855, inertiey: 855, moduleX: 107, moduleY: 107, rayonX: 4.27, rayonY: 4.27 },

    // T-sections asymétriques
    { dimension: '100x50x8', hauteur: 100, largeur: 50, epaisseurAme: 8, epaisseurAile: 8, poids: 9.0, section: 11.5, inertiex: 110, inertiey: 8.33, moduleX: 22.0, moduleY: 3.33, rayonX: 3.10, rayonY: 0.85 },
    { dimension: '120x60x10', hauteur: 120, largeur: 60, epaisseurAme: 10, epaisseurAile: 10, poids: 13.7, section: 17.4, inertiex: 200, inertiey: 15.0, moduleX: 33.3, moduleY: 5.0, rayonX: 3.39, rayonY: 0.93 },
    { dimension: '140x70x10', hauteur: 140, largeur: 70, epaisseurAme: 10, epaisseurAile: 10, poids: 16.0, section: 20.4, inertiex: 294, inertiey: 20.6, moduleX: 42.0, moduleY: 5.89, rayonX: 3.80, rayonY: 1.00 },
    { dimension: '160x80x12', hauteur: 160, largeur: 80, epaisseurAme: 12, epaisseurAile: 12, poids: 22.0, section: 28.0, inertiex: 477, inertiey: 32.0, moduleX: 59.6, moduleY: 8.0, rayonX: 4.13, rayonY: 1.07 },
    { dimension: '180x90x12', hauteur: 180, largeur: 90, epaisseurAme: 12, epaisseurAile: 12, poids: 24.7, section: 31.4, inertiex: 648, inertiey: 36.5, moduleX: 72.0, moduleY: 8.11, rayonX: 4.54, rayonY: 1.08 },
    { dimension: '200x100x15', hauteur: 200, largeur: 100, epaisseurAme: 15, epaisseurAile: 15, poids: 34.5, section: 43.9, inertiex: 1040, inertiey: 62.5, moduleX: 104, moduleY: 12.5, rayonX: 4.87, rayonY: 1.19 }
  ]

  constructor(
    dataSource: DataSource,
    config: GlobalInjectionConfig,
    logger: InjectionLogger,
    validator: ArticleValidator,
    pricingCalculator: PricingCalculator
  ) {
    super(dataSource, config, logger, validator, pricingCalculator)
  }

  getFamilleInfo(): { famille: ArticleFamille; sousFamille: string } {
    return {
      famille: ArticleFamille.PROFILES_ACIER,
      sousFamille: 'T_SECTIONS'
    }
  }

  async generateArticles(): Promise<ArticleMetallurgie[]> {
    const articles: ArticleMetallurgie[] = []
    const materials = ['S235JR', 'S275JR', 'S355JR']

    for (const tSection of this.tSectionSpecifications) {
      for (const material of materials) {
        const caracteristiques: CaracteristiquesTechniques = {
          hauteur: tSection.hauteur,
          largeur: tSection.largeur,
          epaisseurAme: tSection.epaisseurAme,
          epaisseurAile: tSection.epaisseurAile,
          poids: tSection.poids,
          section: tSection.section,
          momentInertieX: tSection.inertiex,
          momentInertieY: tSection.inertiey,
          moduleResistanceX: tSection.moduleX,
          moduleResistanceY: tSection.moduleY,
          rayonGirationX: tSection.rayonX,
          rayonGirationY: tSection.rayonY,
          nuance: material,
          norme: 'EN 10055',
          limiteElastique: this.getLimiteElastique(material),
          resistanceTraction: this.getResistanceTraction(material),
          allongement: this.getAllongement(material),
          applications: this.getApplications(),
          specifications: {
            typeProfile: 'T',
            designationCommerciale: `T ${tSection.dimension}`,
            tolerances: 'EN 10279',
            etatLivraison: 'Laminé à chaud'
          }
        }

        const article: ArticleMetallurgie = {
          reference: `T${tSection.dimension.replace(/[^a-zA-Z0-9]/g, '')}-${material}`,
          designation: `Fer en T ${tSection.dimension} ${material}`,
          description: `Profilé en T ${tSection.dimension}, hauteur ${tSection.hauteur}mm, largeur ${tSection.largeur}mm, nuance ${material}, conforme EN 10055`,
          type: ArticleType.MATIERE_PREMIERE,
          status: ArticleStatus.ACTIF,
          famille: ArticleFamille.PROFILES_ACIER,
          sousFamille: 'T_SECTIONS',
          uniteStock: UniteStock.ML,
          uniteAchat: UniteStock.ML,
          uniteVente: UniteStock.ML,
          coefficientAchat: 1.0,
          coefficientVente: 1.0,
          gereEnStock: true,
          poids: tSection.poids,
          caracteristiquesTechniques: caracteristiques,
          societeId: this.config.societeId
        }

        this.calculatePricing(article)
        articles.push(article)
      }
    }

    this.logger.info(`${articles.length} articles T-sections générés`)
    return articles
  }

  private getLimiteElastique(material: string): number {
    const limits: Record<string, number> = {
      'S235JR': 235,
      'S275JR': 275,
      'S355JR': 355
    }
    return limits[material] || 235
  }

  private getResistanceTraction(material: string): number {
    const resistances: Record<string, number> = {
      'S235JR': 360,
      'S275JR': 430,
      'S355JR': 510
    }
    return resistances[material] || 360
  }

  private getAllongement(material: string): number {
    const allongements: Record<string, number> = {
      'S235JR': 26,
      'S275JR': 22,
      'S355JR': 22
    }
    return allongements[material] || 26
  }

  private getApplications(): string[] {
    return [
      'Éléments de renforcement',
      'Structures légères',
      'Ossatures secondaires',
      'Équerres et supports',
      'Raidisseurs de structure',
      'Éléments de liaison',
      'Structures de toiture',
      'Charpentes agricoles',
      'Mobilier industriel',
      'Supports d\'équipements',
      'Ferronnerie architecturale',
      'Structures de serres'
    ]
  }
}