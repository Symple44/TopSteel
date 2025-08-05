/**
 * Injecteur pour profilés creux SHS/RHS (Square/Rectangular Hollow Sections)
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

interface ShsRhsSpecification {
  type: 'SHS' | 'RHS'
  dimensions: string
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

export class ShsRhsProfilesInjector extends BaseArticleInjector {
  private readonly shsRhsSpecifications: ShsRhsSpecification[] = [
    // SHS - Square Hollow Sections
    {
      type: 'SHS',
      dimensions: '40x40x3',
      hauteur: 40,
      largeur: 40,
      epaisseur: 3,
      poids: 3.52,
      section: 4.48,
      inertiex: 12.2,
      inertiey: 12.2,
      moduleX: 6.1,
      moduleY: 6.1,
      rayonX: 1.65,
      rayonY: 1.65,
    },
    {
      type: 'SHS',
      dimensions: '50x50x3',
      hauteur: 50,
      largeur: 50,
      epaisseur: 3,
      poids: 4.47,
      section: 5.69,
      inertiex: 23.2,
      inertiey: 23.2,
      moduleX: 9.28,
      moduleY: 9.28,
      rayonX: 2.02,
      rayonY: 2.02,
    },
    {
      type: 'SHS',
      dimensions: '60x60x4',
      hauteur: 60,
      largeur: 60,
      epaisseur: 4,
      poids: 7.09,
      section: 9.03,
      inertiex: 48.6,
      inertiey: 48.6,
      moduleX: 16.2,
      moduleY: 16.2,
      rayonX: 2.32,
      rayonY: 2.32,
    },
    {
      type: 'SHS',
      dimensions: '70x70x4',
      hauteur: 70,
      largeur: 70,
      epaisseur: 4,
      poids: 8.36,
      section: 10.7,
      inertiex: 74.7,
      inertiey: 74.7,
      moduleX: 21.3,
      moduleY: 21.3,
      rayonX: 2.64,
      rayonY: 2.64,
    },
    {
      type: 'SHS',
      dimensions: '80x80x4',
      hauteur: 80,
      largeur: 80,
      epaisseur: 4,
      poids: 9.63,
      section: 12.3,
      inertiex: 108,
      inertiey: 108,
      moduleX: 27.0,
      moduleY: 27.0,
      rayonX: 2.96,
      rayonY: 2.96,
    },
    {
      type: 'SHS',
      dimensions: '90x90x5',
      hauteur: 90,
      largeur: 90,
      epaisseur: 5,
      poids: 13.4,
      section: 17.1,
      inertiex: 184,
      inertiey: 184,
      moduleX: 40.9,
      moduleY: 40.9,
      rayonX: 3.28,
      rayonY: 3.28,
    },
    {
      type: 'SHS',
      dimensions: '100x100x5',
      hauteur: 100,
      largeur: 100,
      epaisseur: 5,
      poids: 14.8,
      section: 18.8,
      inertiex: 245,
      inertiey: 245,
      moduleX: 49.0,
      moduleY: 49.0,
      rayonX: 3.61,
      rayonY: 3.61,
    },
    {
      type: 'SHS',
      dimensions: '120x120x5',
      hauteur: 120,
      largeur: 120,
      epaisseur: 5,
      poids: 18.0,
      section: 23.0,
      inertiex: 423,
      inertiey: 423,
      moduleX: 70.5,
      moduleY: 70.5,
      rayonX: 4.29,
      rayonY: 4.29,
    },
    {
      type: 'SHS',
      dimensions: '140x140x6',
      hauteur: 140,
      largeur: 140,
      epaisseur: 6,
      poids: 25.2,
      section: 32.1,
      inertiex: 709,
      inertiey: 709,
      moduleX: 101,
      moduleY: 101,
      rayonX: 4.7,
      rayonY: 4.7,
    },
    {
      type: 'SHS',
      dimensions: '150x150x6',
      hauteur: 150,
      largeur: 150,
      epaisseur: 6,
      poids: 27.0,
      section: 34.4,
      inertiex: 866,
      inertiey: 866,
      moduleX: 115,
      moduleY: 115,
      rayonX: 5.01,
      rayonY: 5.01,
    },
    {
      type: 'SHS',
      dimensions: '160x160x8',
      hauteur: 160,
      largeur: 160,
      epaisseur: 8,
      poids: 38.5,
      section: 49.0,
      inertiex: 1380,
      inertiey: 1380,
      moduleX: 173,
      moduleY: 173,
      rayonX: 5.31,
      rayonY: 5.31,
    },
    {
      type: 'SHS',
      dimensions: '180x180x8',
      hauteur: 180,
      largeur: 180,
      epaisseur: 8,
      poids: 43.6,
      section: 55.5,
      inertiex: 1990,
      inertiey: 1990,
      moduleX: 221,
      moduleY: 221,
      rayonX: 5.99,
      rayonY: 5.99,
    },
    {
      type: 'SHS',
      dimensions: '200x200x8',
      hauteur: 200,
      largeur: 200,
      epaisseur: 8,
      poids: 48.6,
      section: 61.9,
      inertiex: 2730,
      inertiey: 2730,
      moduleX: 273,
      moduleY: 273,
      rayonX: 6.64,
      rayonY: 6.64,
    },

    // RHS - Rectangular Hollow Sections
    {
      type: 'RHS',
      dimensions: '50x30x3',
      hauteur: 50,
      largeur: 30,
      epaisseur: 3,
      poids: 3.36,
      section: 4.28,
      inertiex: 15.2,
      inertiey: 6.59,
      moduleX: 6.08,
      moduleY: 4.39,
      rayonX: 1.88,
      rayonY: 1.24,
    },
    {
      type: 'RHS',
      dimensions: '60x40x4',
      hauteur: 60,
      largeur: 40,
      epaisseur: 4,
      poids: 5.82,
      section: 7.41,
      inertiex: 34.2,
      inertiey: 17.1,
      moduleX: 11.4,
      moduleY: 8.55,
      rayonX: 2.15,
      rayonY: 1.52,
    },
    {
      type: 'RHS',
      dimensions: '80x40x4',
      hauteur: 80,
      largeur: 40,
      epaisseur: 4,
      poids: 7.09,
      section: 9.03,
      inertiex: 55.4,
      inertiey: 17.1,
      moduleX: 13.9,
      moduleY: 8.55,
      rayonX: 2.48,
      rayonY: 1.38,
    },
    {
      type: 'RHS',
      dimensions: '100x50x4',
      hauteur: 100,
      largeur: 50,
      epaisseur: 4,
      poids: 8.96,
      section: 11.4,
      inertiex: 106,
      inertiey: 30.8,
      moduleX: 21.2,
      moduleY: 12.3,
      rayonX: 3.05,
      rayonY: 1.64,
    },
    {
      type: 'RHS',
      dimensions: '120x60x5',
      hauteur: 120,
      largeur: 60,
      epaisseur: 5,
      poids: 13.5,
      section: 17.2,
      inertiex: 200,
      inertiey: 54.5,
      moduleX: 33.3,
      moduleY: 18.2,
      rayonX: 3.41,
      rayonY: 1.78,
    },
    {
      type: 'RHS',
      dimensions: '120x80x5',
      hauteur: 120,
      largeur: 80,
      epaisseur: 5,
      poids: 15.0,
      section: 19.1,
      inertiex: 225,
      inertiey: 90.0,
      moduleX: 37.5,
      moduleY: 22.5,
      rayonX: 3.43,
      rayonY: 2.17,
    },
    {
      type: 'RHS',
      dimensions: '140x80x5',
      hauteur: 140,
      largeur: 80,
      epaisseur: 5,
      poids: 16.4,
      section: 20.9,
      inertiex: 310,
      inertiey: 90.0,
      moduleX: 44.3,
      moduleY: 22.5,
      rayonX: 3.85,
      rayonY: 2.08,
    },
    {
      type: 'RHS',
      dimensions: '150x100x6',
      hauteur: 150,
      largeur: 100,
      epaisseur: 6,
      poids: 22.2,
      section: 28.3,
      inertiex: 486,
      inertiey: 193,
      moduleX: 64.8,
      moduleY: 38.6,
      rayonX: 4.14,
      rayonY: 2.61,
    },
    {
      type: 'RHS',
      dimensions: '160x80x6',
      hauteur: 160,
      largeur: 80,
      epaisseur: 6,
      poids: 21.8,
      section: 27.7,
      inertiex: 458,
      inertiey: 116,
      moduleX: 57.3,
      moduleY: 29.0,
      rayonX: 4.07,
      rayonY: 2.05,
    },
    {
      type: 'RHS',
      dimensions: '180x100x6',
      hauteur: 180,
      largeur: 100,
      epaisseur: 6,
      poids: 25.1,
      section: 32.0,
      inertiex: 689,
      inertiey: 193,
      moduleX: 76.5,
      moduleY: 38.6,
      rayonX: 4.64,
      rayonY: 2.45,
    },
    {
      type: 'RHS',
      dimensions: '200x100x6',
      hauteur: 200,
      largeur: 100,
      epaisseur: 6,
      poids: 27.0,
      section: 34.4,
      inertiex: 866,
      inertiey: 193,
      moduleX: 86.6,
      moduleY: 38.6,
      rayonX: 5.01,
      rayonY: 2.37,
    },
    {
      type: 'RHS',
      dimensions: '200x120x8',
      hauteur: 200,
      largeur: 120,
      epaisseur: 8,
      poids: 38.5,
      section: 49.0,
      inertiex: 1380,
      inertiey: 415,
      moduleX: 138,
      moduleY: 69.2,
      rayonX: 5.31,
      rayonY: 2.91,
    },
    {
      type: 'RHS',
      dimensions: '250x150x8',
      hauteur: 250,
      largeur: 150,
      epaisseur: 8,
      poids: 48.6,
      section: 61.9,
      inertiex: 2730,
      inertiey: 866,
      moduleX: 218,
      moduleY: 115,
      rayonX: 6.64,
      rayonY: 3.74,
    },
    {
      type: 'RHS',
      dimensions: '300x200x10',
      hauteur: 300,
      largeur: 200,
      epaisseur: 10,
      poids: 76.8,
      section: 97.9,
      inertiex: 5410,
      inertiey: 1950,
      moduleX: 361,
      moduleY: 195,
      rayonX: 7.43,
      rayonY: 4.46,
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
      famille: ArticleFamille.TUBES_PROFILES,
      sousFamille: 'SHS_RHS',
    }
  }

  async generateArticles(): Promise<ArticleMetallurgie[]> {
    const articles: ArticleMetallurgie[] = []
    const materials = ['S235JH', 'S275JH', 'S355JH'] // Qualités spécifiques pour profilés creux

    for (const profile of this.shsRhsSpecifications) {
      for (const material of materials) {
        const caracteristiques: CaracteristiquesTechniques = {
          hauteur: profile.hauteur,
          largeur: profile.largeur,
          epaisseur: profile.epaisseur,
          poids: profile.poids,
          section: profile.section,
          momentInertieX: profile.inertiex,
          momentInertieY: profile.inertiey,
          moduleResistanceX: profile.moduleX,
          moduleResistanceY: profile.moduleY,
          rayonGirationX: profile.rayonX,
          rayonGirationY: profile.rayonY,
          nuance: material,
          norme: 'EN 10210-2',
          limiteElastique: this.getLimiteElastique(material),
          resistanceTraction: this.getResistanceTraction(material),
          allongement: this.getAllongement(material),
          applications: this.getApplications(profile.type),
          specifications: {
            typeProfile: profile.type,
            designationCommerciale: `${profile.type} ${profile.dimensions}`,
            tolerances: 'EN 10210-2',
            etatLivraison: 'Formé à chaud',
            modeFormage: 'Soudé longitudinalement',
          },
        }

        const article: ArticleMetallurgie = {
          reference: `${profile.type}${profile.dimensions.replace(/[^a-zA-Z0-9]/g, '')}-${material}`,
          designation: `Profilé ${profile.type} ${profile.dimensions} ${material}`,
          description: `Profilé creux ${profile.type === 'SHS' ? 'carré' : 'rectangulaire'} ${profile.dimensions}, épaisseur ${profile.epaisseur}mm, nuance ${material}, conforme EN 10210-2`,
          type: ArticleType.MATIERE_PREMIERE,
          status: ArticleStatus.ACTIF,
          famille: ArticleFamille.TUBES_PROFILES,
          sousFamille: 'SHS_RHS',
          uniteStock: UniteStock.ML,
          uniteAchat: UniteStock.ML,
          uniteVente: UniteStock.ML,
          coefficientAchat: 1.0,
          coefficientVente: 1.0,
          gereEnStock: true,
          poids: profile.poids,
          caracteristiquesTechniques: caracteristiques,
          societeId: this.config.societeId,
        }

        this.calculatePricing(article)
        articles.push(article)
      }
    }

    this.logger.info(`${articles.length} articles profilés SHS/RHS générés`)
    return articles
  }

  private getLimiteElastique(material: string): number {
    const limits: Record<string, number> = {
      S235JH: 235,
      S275JH: 275,
      S355JH: 355,
    }
    return limits[material] || 235
  }

  private getResistanceTraction(material: string): number {
    const resistances: Record<string, number> = {
      S235JH: 360,
      S275JH: 430,
      S355JH: 510,
    }
    return resistances[material] || 360
  }

  private getAllongement(material: string): number {
    const allongements: Record<string, number> = {
      S235JH: 26,
      S275JH: 22,
      S355JH: 22,
    }
    return allongements[material] || 26
  }

  private getApplications(type: string): string[] {
    const commonApps = [
      'Structures légères et moyennes',
      'Ossatures de bâtiments',
      'Poteaux et poutres',
      'Structures de parkings',
      'Hangars agricoles et industriels',
    ]

    if (type === 'SHS') {
      return [
        ...commonApps,
        'Poteaux carrés esthétiques',
        'Structures architecturales',
        'Garde-corps et balustrades',
        'Mobilier urbain',
        'Structures de serres',
      ]
    } else {
      return [
        ...commonApps,
        'Poutres principales',
        'Éléments de planchers',
        'Structures porteuses',
        'Charpentes industrielles',
        'Ponts et passerelles',
      ]
    }
  }
}
