/**
 * Injecteur pour fers ronds et plats
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

interface BarSpecification {
  type: 'ROND' | 'PLAT'
  dimensions: string
  diametre?: number
  largeur?: number
  epaisseur?: number
  poids: number // kg/m
  section: number // cm²
}

export class BarsInjector extends BaseArticleInjector {
  private readonly barSpecifications: BarSpecification[] = [
    // Fers ronds
    { type: 'ROND', dimensions: 'Ø6', diametre: 6, poids: 0.222, section: 0.283 },
    { type: 'ROND', dimensions: 'Ø8', diametre: 8, poids: 0.395, section: 0.503 },
    { type: 'ROND', dimensions: 'Ø10', diametre: 10, poids: 0.617, section: 0.785 },
    { type: 'ROND', dimensions: 'Ø12', diametre: 12, poids: 0.888, section: 1.131 },
    { type: 'ROND', dimensions: 'Ø14', diametre: 14, poids: 1.208, section: 1.539 },
    { type: 'ROND', dimensions: 'Ø16', diametre: 16, poids: 1.578, section: 2.011 },
    { type: 'ROND', dimensions: 'Ø18', diametre: 18, poids: 1.998, section: 2.545 },
    { type: 'ROND', dimensions: 'Ø20', diametre: 20, poids: 2.466, section: 3.142 },
    { type: 'ROND', dimensions: 'Ø22', diametre: 22, poids: 2.984, section: 3.801 },
    { type: 'ROND', dimensions: 'Ø25', diametre: 25, poids: 3.853, section: 4.909 },
    { type: 'ROND', dimensions: 'Ø28', diametre: 28, poids: 4.834, section: 6.158 },
    { type: 'ROND', dimensions: 'Ø30', diametre: 30, poids: 5.549, section: 7.069 },
    { type: 'ROND', dimensions: 'Ø32', diametre: 32, poids: 6.313, section: 8.042 },
    { type: 'ROND', dimensions: 'Ø35', diametre: 35, poids: 7.553, section: 9.621 },
    { type: 'ROND', dimensions: 'Ø40', diametre: 40, poids: 9.865, section: 12.566 },
    { type: 'ROND', dimensions: 'Ø45', diametre: 45, poids: 12.485, section: 15.904 },
    { type: 'ROND', dimensions: 'Ø50', diametre: 50, poids: 15.413, section: 19.635 },
    { type: 'ROND', dimensions: 'Ø55', diametre: 55, poids: 18.65, section: 23.758 },
    { type: 'ROND', dimensions: 'Ø60', diametre: 60, poids: 22.195, section: 28.274 },
    { type: 'ROND', dimensions: 'Ø65', diametre: 65, poids: 26.049, section: 33.183 },
    { type: 'ROND', dimensions: 'Ø70', diametre: 70, poids: 30.21, section: 38.485 },
    { type: 'ROND', dimensions: 'Ø80', diametre: 80, poids: 39.48, section: 50.265 },
    { type: 'ROND', dimensions: 'Ø90', diametre: 90, poids: 49.95, section: 63.617 },
    { type: 'ROND', dimensions: 'Ø100', diametre: 100, poids: 61.65, section: 78.54 },

    // Fers plats
    { type: 'PLAT', dimensions: '20x3', largeur: 20, epaisseur: 3, poids: 0.471, section: 0.6 },
    { type: 'PLAT', dimensions: '25x3', largeur: 25, epaisseur: 3, poids: 0.589, section: 0.75 },
    { type: 'PLAT', dimensions: '30x3', largeur: 30, epaisseur: 3, poids: 0.706, section: 0.9 },
    { type: 'PLAT', dimensions: '30x4', largeur: 30, epaisseur: 4, poids: 0.942, section: 1.2 },
    { type: 'PLAT', dimensions: '35x4', largeur: 35, epaisseur: 4, poids: 1.099, section: 1.4 },
    { type: 'PLAT', dimensions: '40x4', largeur: 40, epaisseur: 4, poids: 1.256, section: 1.6 },
    { type: 'PLAT', dimensions: '40x5', largeur: 40, epaisseur: 5, poids: 1.57, section: 2.0 },
    { type: 'PLAT', dimensions: '50x5', largeur: 50, epaisseur: 5, poids: 1.963, section: 2.5 },
    { type: 'PLAT', dimensions: '50x6', largeur: 50, epaisseur: 6, poids: 2.355, section: 3.0 },
    { type: 'PLAT', dimensions: '60x6', largeur: 60, epaisseur: 6, poids: 2.826, section: 3.6 },
    { type: 'PLAT', dimensions: '60x8', largeur: 60, epaisseur: 8, poids: 3.768, section: 4.8 },
    { type: 'PLAT', dimensions: '70x8', largeur: 70, epaisseur: 8, poids: 4.396, section: 5.6 },
    { type: 'PLAT', dimensions: '80x8', largeur: 80, epaisseur: 8, poids: 5.024, section: 6.4 },
    { type: 'PLAT', dimensions: '80x10', largeur: 80, epaisseur: 10, poids: 6.28, section: 8.0 },
    { type: 'PLAT', dimensions: '100x10', largeur: 100, epaisseur: 10, poids: 7.85, section: 10.0 },
    { type: 'PLAT', dimensions: '100x12', largeur: 100, epaisseur: 12, poids: 9.42, section: 12.0 },
    { type: 'PLAT', dimensions: '120x10', largeur: 120, epaisseur: 10, poids: 9.42, section: 12.0 },
    {
      type: 'PLAT',
      dimensions: '120x12',
      largeur: 120,
      epaisseur: 12,
      poids: 11.304,
      section: 14.4,
    },
    {
      type: 'PLAT',
      dimensions: '140x12',
      largeur: 140,
      epaisseur: 12,
      poids: 13.188,
      section: 16.8,
    },
    {
      type: 'PLAT',
      dimensions: '150x12',
      largeur: 150,
      epaisseur: 12,
      poids: 14.13,
      section: 18.0,
    },
    {
      type: 'PLAT',
      dimensions: '160x15',
      largeur: 160,
      epaisseur: 15,
      poids: 18.84,
      section: 24.0,
    },
    {
      type: 'PLAT',
      dimensions: '180x15',
      largeur: 180,
      epaisseur: 15,
      poids: 21.195,
      section: 27.0,
    },
    {
      type: 'PLAT',
      dimensions: '200x15',
      largeur: 200,
      epaisseur: 15,
      poids: 23.55,
      section: 30.0,
    },
    { type: 'PLAT', dimensions: '200x20', largeur: 200, epaisseur: 20, poids: 31.4, section: 40.0 },
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
      famille: ArticleFamille.ACIERS_LONGS,
      sousFamille: 'FERS',
    }
  }

  async generateArticles(): Promise<ArticleMetallurgie[]> {
    const articles: ArticleMetallurgie[] = []
    const materials = ['S235JR', 'S275JR', 'S355JR']

    for (const bar of this.barSpecifications) {
      for (const material of materials) {
        const caracteristiques: CaracteristiquesTechniques = {
          diametre: bar.diametre,
          largeur: bar.largeur,
          epaisseur: bar.epaisseur,
          poids: bar.poids,
          section: bar.section,
          nuance: material,
          norme: bar.type === 'ROND' ? 'EN 10060' : 'EN 10058',
          limiteElastique: this.getLimiteElastique(material),
          resistanceTraction: this.getResistanceTraction(material),
          allongement: this.getAllongement(material),
          applications: this.getApplications(bar.type),
          specifications: {
            typeBarre: bar.type,
            dimensionsCommerciales: bar.dimensions,
            tolerances: bar.type === 'ROND' ? 'h11' : 'h11/k11',
            etatLivraison: 'Laminé à chaud',
          },
        }

        // Calcul du moment d'inertie selon le type
        if (bar.type === 'ROND' && bar.diametre) {
          const rayon = bar.diametre / 2
          caracteristiques.momentInertieX = (Math.PI * rayon ** 4) / 4
          caracteristiques.momentInertieY = caracteristiques.momentInertieX
          caracteristiques.moduleResistanceX = caracteristiques.momentInertieX / rayon
          caracteristiques.moduleResistanceY = caracteristiques.moduleResistanceX
          caracteristiques.rayonGirationX = rayon / 2
          caracteristiques.rayonGirationY = caracteristiques.rayonGirationX
        } else if (bar.type === 'PLAT' && bar.largeur && bar.epaisseur) {
          // Moment d'inertie pour section rectangulaire
          const b = bar.largeur / 10 // conversion mm -> cm
          const h = bar.epaisseur / 10 // conversion mm -> cm
          caracteristiques.momentInertieX = (b * h ** 3) / 12
          caracteristiques.momentInertieY = (h * b ** 3) / 12
          caracteristiques.moduleResistanceX = caracteristiques.momentInertieX / (h / 2)
          caracteristiques.moduleResistanceY = caracteristiques.momentInertieY / (b / 2)
          caracteristiques.rayonGirationX = Math.sqrt(caracteristiques.momentInertieX / bar.section)
          caracteristiques.rayonGirationY = Math.sqrt(caracteristiques.momentInertieY / bar.section)
        }

        const article: ArticleMetallurgie = {
          reference: `F${bar.type.substring(0, 1)}${bar.dimensions.replace(/[Ø]/g, '')}-${material}`,
          designation: `Fer ${bar.type.toLowerCase()} ${bar.dimensions} ${material}`,
          description: `Barre ${bar.type.toLowerCase()} ${bar.dimensions}, nuance ${material}, ${bar.type === 'ROND' ? 'conforme EN 10060' : 'conforme EN 10058'}`,
          type: ArticleType.MATIERE_PREMIERE,
          status: ArticleStatus.ACTIF,
          famille: ArticleFamille.ACIERS_LONGS,
          sousFamille: bar.type,
          uniteStock: UniteStock.ML,
          uniteAchat: UniteStock.ML,
          uniteVente: UniteStock.ML,
          coefficientAchat: 1.0,
          coefficientVente: 1.0,
          gereEnStock: true,
          poids: bar.poids,
          caracteristiquesTechniques: caracteristiques,
          societeId: this.config.societeId,
        }

        this.calculatePricing(article)
        articles.push(article)
      }
    }

    this.logger.info(`${articles.length} articles fers ronds/plats générés`)
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
    if (type === 'ROND') {
      return [
        'Axes et arbres',
        'Tirants et entretoises',
        'Armatures béton',
        'Boulonnerie usinée',
        'Pièces forgées',
        'Ferronnerie décorative',
      ]
    } else {
      return [
        'Ossatures légères',
        'Renforts et équerres',
        'Platines de fixation',
        'Lames et ressorts',
        'Couteaux et outils',
        'Ferronnerie et serrurerie',
      ]
    }
  }
}
