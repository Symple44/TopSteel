/**
 * Injecteur pour tubes métalliques
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

interface TubeSpecification {
  type: 'CARRE' | 'RECTANGULAIRE' | 'ROND'
  dimensions: string
  hauteur?: number
  largeur?: number
  diametre?: number
  epaisseur: number
  poids: number
  section: number
}

export class TubesInjector extends BaseArticleInjector {
  private readonly tubeSpecifications: TubeSpecification[] = [
    // Tubes carrés
    {
      type: 'CARRE',
      dimensions: '20x20x2',
      hauteur: 20,
      largeur: 20,
      epaisseur: 2,
      poids: 1.19,
      section: 1.52,
    },
    {
      type: 'CARRE',
      dimensions: '25x25x2',
      hauteur: 25,
      largeur: 25,
      epaisseur: 2,
      poids: 1.51,
      section: 1.92,
    },
    {
      type: 'CARRE',
      dimensions: '30x30x2',
      hauteur: 30,
      largeur: 30,
      epaisseur: 2,
      poids: 1.83,
      section: 2.32,
    },
    {
      type: 'CARRE',
      dimensions: '40x40x3',
      hauteur: 40,
      largeur: 40,
      epaisseur: 3,
      poids: 3.52,
      section: 4.48,
    },
    {
      type: 'CARRE',
      dimensions: '50x50x3',
      hauteur: 50,
      largeur: 50,
      epaisseur: 3,
      poids: 4.47,
      section: 5.68,
    },
    {
      type: 'CARRE',
      dimensions: '60x60x4',
      hauteur: 60,
      largeur: 60,
      epaisseur: 4,
      poids: 7.09,
      section: 9.04,
    },
    {
      type: 'CARRE',
      dimensions: '80x80x4',
      hauteur: 80,
      largeur: 80,
      epaisseur: 4,
      poids: 9.59,
      section: 12.2,
    },
    {
      type: 'CARRE',
      dimensions: '100x100x5',
      hauteur: 100,
      largeur: 100,
      epaisseur: 5,
      poids: 14.8,
      section: 18.8,
    },
    {
      type: 'CARRE',
      dimensions: '120x120x5',
      hauteur: 120,
      largeur: 120,
      epaisseur: 5,
      poids: 18.0,
      section: 23.0,
    },
    {
      type: 'CARRE',
      dimensions: '140x140x6',
      hauteur: 140,
      largeur: 140,
      epaisseur: 6,
      poids: 25.2,
      section: 32.1,
    },

    // Tubes rectangulaires
    {
      type: 'RECTANGULAIRE',
      dimensions: '30x20x2',
      hauteur: 30,
      largeur: 20,
      epaisseur: 2,
      poids: 1.51,
      section: 1.92,
    },
    {
      type: 'RECTANGULAIRE',
      dimensions: '40x20x2',
      hauteur: 40,
      largeur: 20,
      epaisseur: 2,
      poids: 1.83,
      section: 2.32,
    },
    {
      type: 'RECTANGULAIRE',
      dimensions: '50x25x3',
      hauteur: 50,
      largeur: 25,
      epaisseur: 3,
      poids: 3.36,
      section: 4.28,
    },
    {
      type: 'RECTANGULAIRE',
      dimensions: '60x40x3',
      hauteur: 60,
      largeur: 40,
      epaisseur: 3,
      poids: 4.47,
      section: 5.68,
    },
    {
      type: 'RECTANGULAIRE',
      dimensions: '80x40x4',
      hauteur: 80,
      largeur: 40,
      epaisseur: 4,
      poids: 7.09,
      section: 9.04,
    },
    {
      type: 'RECTANGULAIRE',
      dimensions: '100x50x4',
      hauteur: 100,
      largeur: 50,
      epaisseur: 4,
      poids: 8.96,
      section: 11.4,
    },
    {
      type: 'RECTANGULAIRE',
      dimensions: '120x60x5',
      hauteur: 120,
      largeur: 60,
      epaisseur: 5,
      poids: 13.5,
      section: 17.2,
    },
    {
      type: 'RECTANGULAIRE',
      dimensions: '140x80x5',
      hauteur: 140,
      largeur: 80,
      epaisseur: 5,
      poids: 16.4,
      section: 20.9,
    },
    {
      type: 'RECTANGULAIRE',
      dimensions: '160x80x6',
      hauteur: 160,
      largeur: 80,
      epaisseur: 6,
      poids: 21.8,
      section: 27.7,
    },
    {
      type: 'RECTANGULAIRE',
      dimensions: '200x100x6',
      hauteur: 200,
      largeur: 100,
      epaisseur: 6,
      poids: 27.0,
      section: 34.4,
    },

    // Tubes ronds
    {
      type: 'ROND',
      dimensions: 'Ø21.3x2',
      diametre: 21.3,
      epaisseur: 2,
      poids: 1.03,
      section: 1.31,
    },
    {
      type: 'ROND',
      dimensions: 'Ø26.9x2',
      diametre: 26.9,
      epaisseur: 2,
      poids: 1.34,
      section: 1.7,
    },
    {
      type: 'ROND',
      dimensions: 'Ø33.7x2',
      diametre: 33.7,
      epaisseur: 2,
      poids: 1.72,
      section: 2.19,
    },
    {
      type: 'ROND',
      dimensions: 'Ø42.4x2.6',
      diametre: 42.4,
      epaisseur: 2.6,
      poids: 2.69,
      section: 3.42,
    },
    {
      type: 'ROND',
      dimensions: 'Ø48.3x3',
      diametre: 48.3,
      epaisseur: 3,
      poids: 3.58,
      section: 4.56,
    },
    {
      type: 'ROND',
      dimensions: 'Ø60.3x3',
      diametre: 60.3,
      epaisseur: 3,
      poids: 4.51,
      section: 5.74,
    },
    {
      type: 'ROND',
      dimensions: 'Ø76.1x3',
      diametre: 76.1,
      epaisseur: 3,
      poids: 5.71,
      section: 7.27,
    },
    {
      type: 'ROND',
      dimensions: 'Ø88.9x4',
      diametre: 88.9,
      epaisseur: 4,
      poids: 8.67,
      section: 11.0,
    },
    { type: 'ROND', dimensions: 'Ø108x4', diametre: 108, epaisseur: 4, poids: 10.9, section: 13.9 },
    {
      type: 'ROND',
      dimensions: 'Ø139.7x5',
      diametre: 139.7,
      epaisseur: 5,
      poids: 17.1,
      section: 21.8,
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
      sousFamille: 'TUBES',
    }
  }

  async generateArticles(): Promise<ArticleMetallurgie[]> {
    const articles: ArticleMetallurgie[] = []
    const materials = ['S235JR', 'S275JR', 'S355JR']

    for (const tube of this.tubeSpecifications) {
      for (const material of materials) {
        const caracteristiques: CaracteristiquesTechniques = {
          hauteur: tube.hauteur,
          largeur: tube.largeur,
          diametre: tube.diametre,
          epaisseur: tube.epaisseur,
          poids: tube.poids,
          section: tube.section,
          nuance: material,
          norme: 'EN 10219-1',
          limiteElastique: this.getLimiteElastique(material),
          resistanceTraction: this.getResistanceTraction(material),
          allongement: this.getAllongement(material),
          applications: this.getApplications(tube.type),
          specifications: {
            typeTube: tube.type,
            dimensionsCommerciales: tube.dimensions,
            modeFormage: 'Formé à froid',
            soudure: 'Longitudinale',
          },
        }

        // Calcul du moment d'inertie selon le type
        if (tube.type === 'ROND' && tube.diametre) {
          const r_ext = tube.diametre / 2
          const r_int = r_ext - tube.epaisseur
          caracteristiques.momentInertieX = (Math.PI * (r_ext ** 4 - r_int ** 4)) / 4
          caracteristiques.momentInertieY = caracteristiques.momentInertieX
          caracteristiques.moduleResistanceX = caracteristiques.momentInertieX / r_ext
          caracteristiques.moduleResistanceY = caracteristiques.moduleResistanceX
        } else if (tube.hauteur && tube.largeur) {
          // Calcul approximatif pour tubes rectangulaires
          const h = tube.hauteur
          const b = tube.largeur
          const t = tube.epaisseur
          caracteristiques.momentInertieX = (b * h ** 3 - (b - 2 * t) * (h - 2 * t) ** 3) / 12
          caracteristiques.momentInertieY = (h * b ** 3 - (h - 2 * t) * (b - 2 * t) ** 3) / 12
          caracteristiques.moduleResistanceX = caracteristiques.momentInertieX / (h / 2)
          caracteristiques.moduleResistanceY = caracteristiques.momentInertieY / (b / 2)
        }

        const article: ArticleMetallurgie = {
          reference: `T${tube.type.substring(0, 1)}${tube.dimensions.replace(/[.]/g, '_')}-${material}`,
          designation: `Tube ${tube.type.toLowerCase()} ${tube.dimensions} ${material}`,
          description: `Tube ${tube.type.toLowerCase()} ${tube.dimensions}, nuance ${material}, conforme EN 10219-1`,
          type: ArticleType.MATIERE_PREMIERE,
          status: ArticleStatus.ACTIF,
          famille: ArticleFamille.TUBES_PROFILES,
          sousFamille: 'TUBES',
          uniteStock: UniteStock.ML,
          uniteAchat: UniteStock.ML,
          uniteVente: UniteStock.ML,
          coefficientAchat: 1.0,
          coefficientVente: 1.0,
          gereEnStock: true,
          poids: tube.poids,
          caracteristiquesTechniques: caracteristiques,
          societeId: this.config.societeId,
        }

        this.calculatePricing(article)
        articles.push(article)
      }
    }

    this.logger.info(`${articles.length} articles tubes générés`)
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

  private getApplications(type: string): string[] {
    const applications: Record<string, string[]> = {
      CARRE: ['Structure légère', 'Garde-corps', 'Mobilier urbain', 'Ossatures'],
      RECTANGULAIRE: ['Ossatures', 'Châssis', 'Structure porteuse', 'Bardage'],
      ROND: ['Rampes', 'Mains courantes', 'Canalisations', 'Structure tubulaire'],
    }
    return applications[type] || ['Usage général']
  }
}
