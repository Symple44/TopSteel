/**
 * Injecteur pour profilés IPN (Profils I Normaux)
 * TopSteel ERP - Clean Architecture
 */

import type { DataSource } from 'typeorm'
import { BaseArticleInjector } from '../core/base-article-injector'
import {
  ArticleFamille,
  type ArticleMetallurgie,
  ArticleStatus,
  ArticleType,
  type ArticleValidator,
  type CaracteristiquesTechniques,
  type GlobalInjectionConfig,
  type InjectionLogger,
  type PricingCalculator,
  UniteStock,
} from '../types/article-injection.types'

interface IpnSpecification {
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

export class IpnProfilesInjector extends BaseArticleInjector {
  private readonly ipnSpecifications: IpnSpecification[] = [
    // IPN 80 à IPN 600
    {
      dimension: '80',
      hauteur: 80,
      largeur: 42,
      epaisseurAme: 3.9,
      epaisseurAile: 5.9,
      poids: 5.94,
      section: 7.57,
      inertiex: 77.8,
      inertiey: 6.29,
      moduleX: 19.5,
      moduleY: 3.0,
      rayonX: 3.2,
      rayonY: 0.91,
    },
    {
      dimension: '100',
      hauteur: 100,
      largeur: 50,
      epaisseurAme: 4.1,
      epaisseurAile: 6.8,
      poids: 8.34,
      section: 10.6,
      inertiex: 171,
      inertiey: 12.2,
      moduleX: 34.2,
      moduleY: 4.88,
      rayonX: 4.01,
      rayonY: 1.07,
    },
    {
      dimension: '120',
      hauteur: 120,
      largeur: 58,
      epaisseurAme: 4.4,
      epaisseurAile: 7.7,
      poids: 11.1,
      section: 14.2,
      inertiex: 328,
      inertiey: 27.9,
      moduleX: 54.7,
      moduleY: 9.61,
      rayonX: 4.81,
      rayonY: 1.4,
    },
    {
      dimension: '140',
      hauteur: 140,
      largeur: 66,
      epaisseurAme: 4.7,
      epaisseurAile: 8.6,
      poids: 14.3,
      section: 18.2,
      inertiex: 573,
      inertiey: 44.9,
      moduleX: 81.9,
      moduleY: 13.6,
      rayonX: 5.61,
      rayonY: 1.57,
    },
    {
      dimension: '160',
      hauteur: 160,
      largeur: 74,
      epaisseurAme: 5.0,
      epaisseurAile: 9.5,
      poids: 17.9,
      section: 22.8,
      inertiex: 935,
      inertiey: 68.3,
      moduleX: 117,
      moduleY: 18.5,
      rayonX: 6.4,
      rayonY: 1.73,
    },
    {
      dimension: '180',
      hauteur: 180,
      largeur: 82,
      epaisseurAme: 5.3,
      epaisseurAile: 10.4,
      poids: 21.9,
      section: 27.9,
      inertiex: 1450,
      inertiey: 101,
      moduleX: 161,
      moduleY: 24.6,
      rayonX: 7.21,
      rayonY: 1.9,
    },
    {
      dimension: '200',
      hauteur: 200,
      largeur: 90,
      epaisseurAme: 5.6,
      epaisseurAile: 11.3,
      poids: 26.2,
      section: 33.4,
      inertiex: 2140,
      inertiey: 142,
      moduleX: 214,
      moduleY: 31.6,
      rayonX: 8.0,
      rayonY: 2.06,
    },
    {
      dimension: '220',
      hauteur: 220,
      largeur: 98,
      epaisseurAme: 5.9,
      epaisseurAile: 12.2,
      poids: 31.1,
      section: 39.5,
      inertiex: 3060,
      inertiey: 194,
      moduleX: 278,
      moduleY: 39.6,
      rayonX: 8.81,
      rayonY: 2.22,
    },
    {
      dimension: '240',
      hauteur: 240,
      largeur: 106,
      epaisseurAme: 6.2,
      epaisseurAile: 13.1,
      poids: 36.2,
      section: 46.1,
      inertiex: 4250,
      inertiey: 259,
      moduleX: 354,
      moduleY: 48.9,
      rayonX: 9.61,
      rayonY: 2.37,
    },
    {
      dimension: '260',
      hauteur: 260,
      largeur: 113,
      epaisseurAme: 6.5,
      epaisseurAile: 14.1,
      poids: 41.9,
      section: 53.3,
      inertiex: 5740,
      inertiey: 334,
      moduleX: 442,
      moduleY: 59.1,
      rayonX: 10.4,
      rayonY: 2.5,
    },
    {
      dimension: '280',
      hauteur: 280,
      largeur: 119,
      epaisseurAme: 6.8,
      epaisseurAile: 15.2,
      poids: 47.9,
      section: 61.0,
      inertiex: 7590,
      inertiey: 420,
      moduleX: 542,
      moduleY: 70.6,
      rayonX: 11.2,
      rayonY: 2.62,
    },
    {
      dimension: '300',
      hauteur: 300,
      largeur: 125,
      epaisseurAme: 7.1,
      epaisseurAile: 16.2,
      poids: 54.2,
      section: 69.0,
      inertiex: 9800,
      inertiey: 516,
      moduleX: 653,
      moduleY: 82.6,
      rayonX: 11.9,
      rayonY: 2.73,
    },
    {
      dimension: '320',
      hauteur: 320,
      largeur: 131,
      epaisseurAme: 7.4,
      epaisseurAile: 17.3,
      poids: 61.0,
      section: 77.7,
      inertiex: 12510,
      inertiey: 628,
      moduleX: 782,
      moduleY: 95.8,
      rayonX: 12.7,
      rayonY: 2.84,
    },
    {
      dimension: '340',
      hauteur: 340,
      largeur: 137,
      epaisseurAme: 7.7,
      epaisseurAile: 18.3,
      poids: 68.0,
      section: 86.7,
      inertiex: 15740,
      inertiey: 753,
      moduleX: 926,
      moduleY: 110,
      rayonX: 13.5,
      rayonY: 2.95,
    },
    {
      dimension: '360',
      hauteur: 360,
      largeur: 143,
      epaisseurAme: 8.0,
      epaisseurAile: 19.5,
      poids: 76.1,
      section: 97.0,
      inertiex: 19610,
      inertiey: 923,
      moduleX: 1090,
      moduleY: 129,
      rayonX: 14.2,
      rayonY: 3.08,
    },
    {
      dimension: '380',
      hauteur: 380,
      largeur: 149,
      epaisseurAme: 8.3,
      epaisseurAile: 20.5,
      poids: 84.0,
      section: 107,
      inertiex: 24010,
      inertiey: 1090,
      moduleX: 1264,
      moduleY: 146,
      rayonX: 15.0,
      rayonY: 3.19,
    },
    {
      dimension: '400',
      hauteur: 400,
      largeur: 155,
      epaisseurAme: 8.6,
      epaisseurAile: 21.6,
      poids: 92.6,
      section: 118,
      inertiex: 29210,
      inertiey: 1320,
      moduleX: 1460,
      moduleY: 170,
      rayonX: 15.7,
      rayonY: 3.34,
    },
    {
      dimension: '450',
      hauteur: 450,
      largeur: 170,
      epaisseurAme: 9.4,
      epaisseurAile: 24.3,
      poids: 115,
      section: 147,
      inertiex: 45850,
      inertiey: 2040,
      moduleX: 2040,
      moduleY: 240,
      rayonX: 17.7,
      rayonY: 3.72,
    },
    {
      dimension: '500',
      hauteur: 500,
      largeur: 185,
      epaisseurAme: 10.2,
      epaisseurAile: 27.0,
      poids: 141,
      section: 179,
      inertiex: 68740,
      inertiey: 2940,
      moduleX: 2750,
      moduleY: 318,
      rayonX: 19.6,
      rayonY: 4.05,
    },
    {
      dimension: '550',
      hauteur: 550,
      largeur: 200,
      epaisseurAme: 11.1,
      epaisseurAile: 30.0,
      poids: 172,
      section: 219,
      inertiex: 99180,
      inertiey: 4250,
      moduleX: 3610,
      moduleY: 425,
      rayonX: 21.3,
      rayonY: 4.41,
    },
    {
      dimension: '600',
      hauteur: 600,
      largeur: 215,
      epaisseurAme: 12.0,
      epaisseurAile: 33.0,
      poids: 199,
      section: 254,
      inertiex: 138400,
      inertiey: 5790,
      moduleX: 4610,
      moduleY: 539,
      rayonX: 23.4,
      rayonY: 4.77,
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
      sousFamille: 'IPN',
    }
  }

  async generateArticles(): Promise<ArticleMetallurgie[]> {
    const articles: ArticleMetallurgie[] = []
    const materials = ['S235JR', 'S275JR', 'S355JR']

    for (const ipn of this.ipnSpecifications) {
      for (const material of materials) {
        const caracteristiques: CaracteristiquesTechniques = {
          hauteur: ipn.hauteur,
          largeur: ipn.largeur,
          epaisseurAme: ipn.epaisseurAme,
          epaisseurAile: ipn.epaisseurAile,
          poids: ipn.poids,
          section: ipn.section,
          momentInertieX: ipn.inertiex,
          momentInertieY: ipn.inertiey,
          moduleResistanceX: ipn.moduleX,
          moduleResistanceY: ipn.moduleY,
          rayonGirationX: ipn.rayonX,
          rayonGirationY: ipn.rayonY,
          nuance: material,
          norme: 'EN 10365',
          limiteElastique: this.getLimiteElastique(material),
          resistanceTraction: this.getResistanceTraction(material),
          allongement: this.getAllongement(material),
          applications: this.getApplications(),
          specifications: {
            typeProfile: 'IPN',
            designationCommerciale: `IPN ${ipn.dimension}`,
            tolerances: 'EN 10279',
            etatLivraison: 'Laminé à chaud',
          },
        }

        const article: ArticleMetallurgie = {
          reference: `IPN${ipn.dimension}-${material}`,
          designation: `Profilé IPN ${ipn.dimension} ${material}`,
          description: `Profilé en I normal IPN ${ipn.dimension}, hauteur ${ipn.hauteur}mm, largeur ${ipn.largeur}mm, nuance ${material}, conforme EN 10365`,
          type: ArticleType.MATIERE_PREMIERE,
          status: ArticleStatus.ACTIF,
          famille: ArticleFamille.PROFILES_ACIER,
          sousFamille: 'IPN',
          uniteStock: UniteStock.ML,
          uniteAchat: UniteStock.ML,
          uniteVente: UniteStock.ML,
          coefficientAchat: 1.0,
          coefficientVente: 1.0,
          gereEnStock: true,
          poids: ipn.poids,
          caracteristiquesTechniques: caracteristiques,
          societeId: this.config.societeId,
        }

        this.calculatePricing(article)
        articles.push(article)
      }
    }

    this.logger.info(`${articles.length} articles profilés IPN générés`)
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
      'Poutres principales de charpente',
      'Éléments porteurs lourds',
      'Structures de bâtiments industriels',
      'Ponts et passerelles',
      'Grues et structures de levage',
      'Charpente de halls industriels',
      'Poutres de planchers',
      'Structures portuaires',
      'Pylônes et mâts',
      'Ossatures de grandes portées',
    ]
  }
}
