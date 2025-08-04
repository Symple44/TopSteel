/**
 * Injecteur pour tôles métalliques
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

interface SheetSpecification {
  type: 'LISSE' | 'LARMEE' | 'GAUFFREE' | 'PERFOREE'
  material: 'ACIER' | 'INOX' | 'ALUMINIUM'
  epaisseur: number
  largeur: number
  longueur: number
  poids: number // kg/m²
  surface?: string
  perforation?: string
}

export class SheetsInjector extends BaseArticleInjector {
  private readonly sheetSpecifications: SheetSpecification[] = [
    // Tôles lisses acier
    { type: 'LISSE', material: 'ACIER', epaisseur: 1, largeur: 1250, longueur: 2500, poids: 7.85, surface: 'Brute' },
    { type: 'LISSE', material: 'ACIER', epaisseur: 1.5, largeur: 1250, longueur: 2500, poids: 11.78, surface: 'Brute' },
    { type: 'LISSE', material: 'ACIER', epaisseur: 2, largeur: 1250, longueur: 2500, poids: 15.70, surface: 'Brute' },
    { type: 'LISSE', material: 'ACIER', epaisseur: 3, largeur: 1250, longueur: 2500, poids: 23.55, surface: 'Brute' },
    { type: 'LISSE', material: 'ACIER', epaisseur: 4, largeur: 1250, longueur: 2500, poids: 31.40, surface: 'Brute' },
    { type: 'LISSE', material: 'ACIER', epaisseur: 5, largeur: 1250, longueur: 2500, poids: 39.25, surface: 'Brute' },
    { type: 'LISSE', material: 'ACIER', epaisseur: 6, largeur: 1250, longueur: 2500, poids: 47.10, surface: 'Brute' },
    { type: 'LISSE', material: 'ACIER', epaisseur: 8, largeur: 1250, longueur: 2500, poids: 62.80, surface: 'Brute' },
    { type: 'LISSE', material: 'ACIER', epaisseur: 10, largeur: 1250, longueur: 2500, poids: 78.50, surface: 'Brute' },
    { type: 'LISSE', material: 'ACIER', epaisseur: 12, largeur: 1250, longueur: 2500, poids: 94.20, surface: 'Brute' },

    // Tôles larmées acier
    { type: 'LARMEE', material: 'ACIER', epaisseur: 2, largeur: 1250, longueur: 2500, poids: 17.20, surface: 'Larmée quinze' },
    { type: 'LARMEE', material: 'ACIER', epaisseur: 3, largeur: 1250, longueur: 2500, poids: 25.80, surface: 'Larmée quinze' },
    { type: 'LARMEE', material: 'ACIER', epaisseur: 4, largeur: 1250, longueur: 2500, poids: 34.40, surface: 'Larmée quinze' },
    { type: 'LARMEE', material: 'ACIER', epaisseur: 5, largeur: 1250, longueur: 2500, poids: 43.00, surface: 'Larmée quinze' },
    { type: 'LARMEE', material: 'ACIER', epaisseur: 6, largeur: 1250, longueur: 2500, poids: 51.60, surface: 'Larmée quinze' },

    // Tôles gaufrées acier
    { type: 'GAUFFREE', material: 'ACIER', epaisseur: 1.5, largeur: 1250, longueur: 2500, poids: 12.90, surface: 'Gaufrée' },
    { type: 'GAUFFREE', material: 'ACIER', epaisseur: 2, largeur: 1250, longueur: 2500, poids: 17.20, surface: 'Gaufrée' },
    { type: 'GAUFFREE', material: 'ACIER', epaisseur: 3, largeur: 1250, longueur: 2500, poids: 25.80, surface: 'Gaufrée' },

    // Tôles inox
    { type: 'LISSE', material: 'INOX', epaisseur: 1, largeur: 1250, longueur: 2500, poids: 8.02, surface: '2B' },
    { type: 'LISSE', material: 'INOX', epaisseur: 1.5, largeur: 1250, longueur: 2500, poids: 12.03, surface: '2B' },
    { type: 'LISSE', material: 'INOX', epaisseur: 2, largeur: 1250, longueur: 2500, poids: 16.04, surface: '2B' },
    { type: 'LISSE', material: 'INOX', epaisseur: 3, largeur: 1250, longueur: 2500, poids: 24.06, surface: '2B' },
    { type: 'LISSE', material: 'INOX', epaisseur: 4, largeur: 1250, longueur: 2500, poids: 32.08, surface: '2B' },

    // Tôles aluminium
    { type: 'LISSE', material: 'ALUMINIUM', epaisseur: 1, largeur: 1250, longueur: 2500, poids: 2.70, surface: 'Brute' },
    { type: 'LISSE', material: 'ALUMINIUM', epaisseur: 1.5, largeur: 1250, longueur: 2500, poids: 4.05, surface: 'Brute' },
    { type: 'LISSE', material: 'ALUMINIUM', epaisseur: 2, largeur: 1250, longueur: 2500, poids: 5.40, surface: 'Brute' },
    { type: 'LISSE', material: 'ALUMINIUM', epaisseur: 3, largeur: 1250, longueur: 2500, poids: 8.10, surface: 'Brute' },
    { type: 'LISSE', material: 'ALUMINIUM', epaisseur: 4, largeur: 1250, longueur: 2500, poids: 10.80, surface: 'Brute' },

    // Tôles perforées
    { type: 'PERFOREE', material: 'ACIER', epaisseur: 1, largeur: 1000, longueur: 2000, poids: 6.28, perforation: 'R5 T8' },
    { type: 'PERFOREE', material: 'ACIER', epaisseur: 1.5, largeur: 1000, longueur: 2000, poids: 9.42, perforation: 'R5 T8' },
    { type: 'PERFOREE', material: 'ACIER', epaisseur: 2, largeur: 1000, longueur: 2000, poids: 12.56, perforation: 'R5 T8' },
    { type: 'PERFOREE', material: 'INOX', epaisseur: 1, largeur: 1000, longueur: 2000, poids: 6.42, perforation: 'R5 T8' },
    { type: 'PERFOREE', material: 'INOX', epaisseur: 1.5, largeur: 1000, longueur: 2000, poids: 9.63, perforation: 'R5 T8' }
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
      famille: ArticleFamille.TOLES_PLAQUES,
      sousFamille: 'TOLES'
    }
  }

  async generateArticles(): Promise<ArticleMetallurgie[]> {
    const articles: ArticleMetallurgie[] = []

    for (const sheet of this.sheetSpecifications) {
      const caracteristiques: CaracteristiquesTechniques = {
        epaisseur: sheet.epaisseur,
        largeur: sheet.largeur,
        longueur: sheet.longueur,
        poids: sheet.poids,
        surface: sheet.largeur * sheet.longueur / 1000000, // m²
        nuance: this.getNuance(sheet.material),
        norme: this.getNorme(sheet.material),
        limiteElastique: this.getLimiteElastique(sheet.material),
        resistanceTraction: this.getResistanceTraction(sheet.material),
        allongement: this.getAllongement(sheet.material),
        revetement: this.getRevetement(sheet.material),
        traitement: this.getTraitement(sheet.type, sheet.surface),
        applications: this.getApplications(sheet.type, sheet.material),
        specifications: {
          typeTole: sheet.type,
          materiauBase: sheet.material,
          formatStandard: `${sheet.largeur}x${sheet.longueur}`,
          etatSurface: sheet.surface,
          perforation: sheet.perforation,
          densité: this.getDensite(sheet.material)
        }
      }

      const article: ArticleMetallurgie = {
        reference: `T${sheet.material.substring(0,1)}${sheet.type.substring(0,1)}${sheet.epaisseur.toString().replace('.', '_')}`,
        designation: `Tôle ${sheet.material.toLowerCase()} ${sheet.type.toLowerCase()} ${sheet.epaisseur}mm`,
        description: this.getDescription(sheet),
        type: ArticleType.MATIERE_PREMIERE,
        status: ArticleStatus.ACTIF,
        famille: ArticleFamille.TOLES_PLAQUES,
        sousFamille: 'TOLES',
        uniteStock: UniteStock.M2,
        uniteAchat: UniteStock.M2,
        uniteVente: UniteStock.M2,
        coefficientAchat: 1.0,
        coefficientVente: 1.0,
        gereEnStock: true,
        poids: sheet.poids,
        caracteristiquesTechniques: caracteristiques,
        societeId: this.config.societeId
      }

      this.calculatePricing(article)
      articles.push(article)
    }

    this.logger.info(`${articles.length} articles tôles générés`)
    return articles
  }

  private getNuance(material: string): string {
    const nuances: Record<string, string> = {
      'ACIER': 'S235JR',
      'INOX': '304L',
      'ALUMINIUM': '5754'
    }
    return nuances[material] || 'S235JR'
  }

  private getNorme(material: string): string {
    const normes: Record<string, string> = {
      'ACIER': 'EN 10025-2',
      'INOX': 'EN 10088-2',
      'ALUMINIUM': 'EN 573-3'
    }
    return normes[material] || 'EN 10025-2'
  }

  private getLimiteElastique(material: string): number {
    const limits: Record<string, number> = {
      'ACIER': 235,
      'INOX': 200,
      'ALUMINIUM': 80
    }
    return limits[material] || 235
  }

  private getResistanceTraction(material: string): number {
    const resistances: Record<string, number> = {
      'ACIER': 360,
      'INOX': 520,
      'ALUMINIUM': 190
    }
    return resistances[material] || 360
  }

  private getAllongement(material: string): number {
    const allongements: Record<string, number> = {
      'ACIER': 26,
      'INOX': 45,
      'ALUMINIUM': 18
    }
    return allongements[material] || 26
  }

  private getRevetement(material: string): string {
    const revetements: Record<string, string> = {
      'ACIER': 'Brut',
      'INOX': 'Passivé',
      'ALUMINIUM': 'Brut'
    }
    return revetements[material] || 'Brut'
  }

  private getTraitement(type: string, surface?: string): string {
    if (type === 'LARMEE') return 'Laminage larmé'
    if (type === 'GAUFFREE') return 'Laminage gaufré'
    if (type === 'PERFOREE') return 'Perforation'
    return surface || 'Laminé à chaud'
  }

  private getApplications(type: string, material: string): string[] {
    const baseApps = {
      'LISSE': ['Découpe', 'Pliage', 'Soudage', 'Habillage'],
      'LARMEE': ['Sol antidérapant', 'Escaliers', 'Plateformes'],
      'GAUFFREE': ['Décoration', 'Habillage', 'Antidérapant'],
      'PERFOREE': ['Filtration', 'Ventilation', 'Décoration']
    }

    const materialApps = {
      'ACIER': ['Construction', 'Industrie'],
      'INOX': ['Alimentaire', 'Chimie', 'Naval'],
      'ALUMINIUM': ['Aéronautique', 'Transport', 'Façades']
    }

    return [...(baseApps[type] || []), ...(materialApps[material] || [])]
  }

  private getDensite(material: string): number {
    const densites: Record<string, number> = {
      'ACIER': 7.85,
      'INOX': 8.02,
      'ALUMINIUM': 2.70
    }
    return densites[material] || 7.85
  }

  private getDescription(sheet: SheetSpecification): string {
    const typeDesc = {
      'LISSE': 'lisse',
      'LARMEE': 'larmée',
      'GAUFFREE': 'gaufrée',
      'PERFOREE': 'perforée'
    }

    let desc = `Tôle ${sheet.material.toLowerCase()} ${typeDesc[sheet.type]} épaisseur ${sheet.epaisseur}mm`
    
    if (sheet.surface) {
      desc += `, finition ${sheet.surface}`
    }
    
    if (sheet.perforation) {
      desc += `, perforation ${sheet.perforation}`
    }
    
    desc += `, format ${sheet.largeur}x${sheet.longueur}mm`
    
    return desc
  }
}