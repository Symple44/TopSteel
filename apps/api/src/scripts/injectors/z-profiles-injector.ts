/**
 * Injecteur pour profilés en Z
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
  CaracteristiquesTechniques,
} from '../types/article-injection.types'

interface ZProfileSpecification {
  dimension: string
  hauteur: number // mm
  largeur: number // mm
  epaisseur: number // mm
  poids: number // kg/m
  section: number // cm²
  inertiex: number // cm⁴
  inertiey: number // cm⁴
  moduleX: number // cm³
  moduleY: number // cm³
  rayonX: number // cm
  rayonY: number // cm
}

export class ZProfilesInjector extends BaseArticleInjector {
  private readonly zProfileSpecifications: ZProfileSpecification[] = [
    // Profilés Z laminés à froid - Série courante
    {
      dimension: '100x50x15x2',
      hauteur: 100,
      largeur: 50,
      epaisseur: 2,
      poids: 2.94,
      section: 3.74,
      inertiex: 64.2,
      inertiey: 8.33,
      moduleX: 12.8,
      moduleY: 3.33,
      rayonX: 4.14,
      rayonY: 1.49,
    },
    {
      dimension: '120x55x15x2',
      hauteur: 120,
      largeur: 55,
      epaisseur: 2,
      poids: 3.53,
      section: 4.49,
      inertiex: 99.4,
      inertiey: 11.2,
      moduleX: 16.6,
      moduleY: 4.07,
      rayonX: 4.7,
      rayonY: 1.58,
    },
    {
      dimension: '140x60x18x2.5',
      hauteur: 140,
      largeur: 60,
      epaisseur: 2.5,
      poids: 4.81,
      section: 6.13,
      inertiex: 156,
      inertiey: 16.9,
      moduleX: 22.3,
      moduleY: 5.63,
      rayonX: 5.05,
      rayonY: 1.66,
    },
    {
      dimension: '160x65x20x2.5',
      hauteur: 160,
      largeur: 65,
      epaisseur: 2.5,
      poids: 5.39,
      section: 6.87,
      inertiex: 218,
      inertiey: 21.2,
      moduleX: 27.3,
      moduleY: 6.52,
      rayonX: 5.63,
      rayonY: 1.76,
    },
    {
      dimension: '180x70x20x3',
      hauteur: 180,
      largeur: 70,
      epaisseur: 3,
      poids: 7.1,
      section: 9.04,
      inertiex: 332,
      inertiey: 29.4,
      moduleX: 36.9,
      moduleY: 8.4,
      rayonX: 6.06,
      rayonY: 1.8,
    },
    {
      dimension: '200x75x23x3',
      hauteur: 200,
      largeur: 75,
      epaisseur: 3,
      poids: 8.01,
      section: 10.2,
      inertiex: 456,
      inertiey: 37.5,
      moduleX: 45.6,
      moduleY: 10.0,
      rayonX: 6.69,
      rayonY: 1.92,
    },
    {
      dimension: '220x80x25x3',
      hauteur: 220,
      largeur: 80,
      epaisseur: 3,
      poids: 8.79,
      section: 11.2,
      inertiex: 610,
      inertiey: 46.5,
      moduleX: 55.5,
      moduleY: 11.6,
      rayonX: 7.38,
      rayonY: 2.04,
    },
    {
      dimension: '240x85x25x3.5',
      hauteur: 240,
      largeur: 85,
      epaisseur: 3.5,
      poids: 10.8,
      section: 13.7,
      inertiex: 826,
      inertiey: 61.2,
      moduleX: 68.8,
      moduleY: 14.4,
      rayonX: 7.76,
      rayonY: 2.11,
    },
    {
      dimension: '260x90x30x3.5',
      hauteur: 260,
      largeur: 90,
      epaisseur: 3.5,
      poids: 12.0,
      section: 15.3,
      inertiex: 1070,
      inertiey: 78.8,
      moduleX: 82.3,
      moduleY: 17.5,
      rayonX: 8.37,
      rayonY: 2.27,
    },
    {
      dimension: '280x95x30x4',
      hauteur: 280,
      largeur: 95,
      epaisseur: 4,
      poids: 14.2,
      section: 18.1,
      inertiex: 1390,
      inertiey: 96.2,
      moduleX: 99.3,
      moduleY: 20.2,
      rayonX: 8.76,
      rayonY: 2.3,
    },
    {
      dimension: '300x100x35x4',
      hauteur: 300,
      largeur: 100,
      epaisseur: 4,
      poids: 16.0,
      section: 20.4,
      inertiex: 1760,
      inertiey: 123,
      moduleX: 117,
      moduleY: 24.6,
      rayonX: 9.28,
      rayonY: 2.46,
    },

    // Profilés Z renforcés - Série lourde
    {
      dimension: '200x90x35x4',
      hauteur: 200,
      largeur: 90,
      epaisseur: 4,
      poids: 10.8,
      section: 13.7,
      inertiex: 518,
      inertiey: 67.5,
      moduleX: 51.8,
      moduleY: 15.0,
      rayonX: 6.15,
      rayonY: 2.22,
    },
    {
      dimension: '250x100x40x4.5',
      hauteur: 250,
      largeur: 100,
      epaisseur: 4.5,
      poids: 15.3,
      section: 19.5,
      inertiex: 987,
      inertiey: 108,
      moduleX: 79.0,
      moduleY: 21.6,
      rayonX: 7.12,
      rayonY: 2.35,
    },
    {
      dimension: '300x120x45x5',
      hauteur: 300,
      largeur: 120,
      epaisseur: 5,
      poids: 21.5,
      section: 27.4,
      inertiex: 1740,
      inertiey: 194,
      moduleX: 116,
      moduleY: 32.3,
      rayonX: 7.97,
      rayonY: 2.66,
    },
    {
      dimension: '350x130x50x5',
      hauteur: 350,
      largeur: 130,
      epaisseur: 5,
      poids: 25.3,
      section: 32.2,
      inertiex: 2720,
      inertiey: 264,
      moduleX: 155,
      moduleY: 40.6,
      rayonX: 9.18,
      rayonY: 2.86,
    },
    {
      dimension: '400x140x55x6',
      hauteur: 400,
      largeur: 140,
      epaisseur: 6,
      poids: 33.6,
      section: 42.8,
      inertiex: 4250,
      inertiey: 390,
      moduleX: 213,
      moduleY: 55.7,
      rayonX: 9.97,
      rayonY: 3.02,
    },
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
      sousFamille: 'Z_PROFILES',
    }
  }

  async generateArticles(): Promise<ArticleMetallurgie[]> {
    const articles: ArticleMetallurgie[] = []
    const materials = ['S235JR', 'S275JR', 'S355JR']

    for (const zProfile of this.zProfileSpecifications) {
      for (const material of materials) {
        const caracteristiques: CaracteristiquesTechniques = {
          hauteur: zProfile.hauteur,
          largeur: zProfile.largeur,
          epaisseur: zProfile.epaisseur,
          poids: zProfile.poids,
          section: zProfile.section,
          momentInertieX: zProfile.inertiex,
          momentInertieY: zProfile.inertiey,
          moduleResistanceX: zProfile.moduleX,
          moduleResistanceY: zProfile.moduleY,
          rayonGirationX: zProfile.rayonX,
          rayonGirationY: zProfile.rayonY,
          nuance: material,
          norme: 'EN 10162',
          limiteElastique: this.getLimiteElastique(material),
          resistanceTraction: this.getResistanceTraction(material),
          allongement: this.getAllongement(material),
          applications: this.getApplications(),
          specifications: {
            typeProfile: 'Z',
            designationCommerciale: `Z ${zProfile.dimension}`,
            tolerances: 'EN 10162',
            etatLivraison: 'Profilé à froid',
            modeFormage: 'Formage à froid',
          },
        }

        const article: ArticleMetallurgie = {
          reference: `Z${zProfile.dimension.replace(/[^a-zA-Z0-9]/g, '')}-${material}`,
          designation: `Profilé Z ${zProfile.dimension} ${material}`,
          description: `Profilé en Z ${zProfile.dimension}, hauteur ${zProfile.hauteur}mm, largeur ${zProfile.largeur}mm, épaisseur ${zProfile.epaisseur}mm, nuance ${material}, conforme EN 10162`,
          type: ArticleType.MATIERE_PREMIERE,
          status: ArticleStatus.ACTIF,
          famille: ArticleFamille.PROFILES_ACIER,
          sousFamille: 'Z_PROFILES',
          uniteStock: UniteStock.ML,
          uniteAchat: UniteStock.ML,
          uniteVente: UniteStock.ML,
          coefficientAchat: 1.0,
          coefficientVente: 1.0,
          gereEnStock: true,
          poids: zProfile.poids,
          caracteristiquesTechniques: caracteristiques,
          societeId: this.config.societeId,
        }

        this.calculatePricing(article)
        articles.push(article)
      }
    }

    this.logger.info(`${articles.length} articles profilés Z générés`)
    return articles
  }

  private getLimiteElastique(material: string): number {
    const limits: Record<string, number> = {
      S235JR: 235,
      S275JR: 275,
      S355JR: 355,
    }
    return limits[material] || 235
  }

  private getResistanceTraction(material: string): number {
    const resistances: Record<string, number> = {
      S235JR: 360,
      S275JR: 430,
      S355JR: 510,
    }
    return resistances[material] || 360
  }

  private getAllongement(material: string): number {
    const allongements: Record<string, number> = {
      S235JR: 26,
      S275JR: 22,
      S355JR: 22,
    }
    return allongements[material] || 26
  }

  private getApplications(): string[] {
    return [
      'Pannes de toiture',
      'Lisses de bardage',
      'Structures légères',
      'Ossatures secondaires',
      'Charpente métallique légère',
      'Bâtiments industriels',
      'Hangars agricoles',
      'Structures de serres',
      'Éléments de façade',
      "Supports d'équipements",
      'Constructions préfabriquées',
      'Bâtiments à ossature métallique',
    ]
  }
}
