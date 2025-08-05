/**
 * Injecteur pour profilés UPN (Profils U Normaux)
 * TopSteel ERP - Clean Architecture
 */

import { BaseArticleInjector } from '../core/base-article-injector'
import {
  ArticleFamille,
  type ArticleMetallurgie,
  ArticleStatus,
  ArticleType,
  type CaracteristiquesTechniques,
  UniteStock,
} from '../types/article-injection.types'

interface UpnSpecification {
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

export class UpnProfilesInjector extends BaseArticleInjector {
  private readonly upnSpecifications: UpnSpecification[] = [
    // UPN 50 à UPN 400
    {
      dimension: '50',
      hauteur: 50,
      largeur: 38,
      epaisseurAme: 3.5,
      epaisseurAile: 5.5,
      poids: 3.88,
      section: 4.94,
      inertiex: 45.2,
      inertiey: 9.13,
      moduleX: 18.1,
      moduleY: 4.81,
      rayonX: 3.03,
      rayonY: 1.36,
    },
    {
      dimension: '60',
      hauteur: 60,
      largeur: 42,
      epaisseurAme: 4.0,
      epaisseurAile: 6.0,
      poids: 4.78,
      section: 6.09,
      inertiex: 78.9,
      inertiey: 13.5,
      moduleX: 26.3,
      moduleY: 6.43,
      rayonX: 3.6,
      rayonY: 1.49,
    },
    {
      dimension: '65',
      hauteur: 65,
      largeur: 42,
      epaisseurAme: 4.0,
      epaisseurAile: 6.5,
      poids: 5.14,
      section: 6.55,
      inertiex: 97.4,
      inertiey: 14.1,
      moduleX: 30.0,
      moduleY: 6.71,
      rayonX: 3.86,
      rayonY: 1.47,
    },
    {
      dimension: '80',
      hauteur: 80,
      largeur: 45,
      epaisseurAme: 4.0,
      epaisseurAile: 7.0,
      poids: 6.0,
      section: 7.64,
      inertiex: 165,
      inertiey: 17.9,
      moduleX: 41.2,
      moduleY: 7.94,
      rayonX: 4.65,
      rayonY: 1.53,
    },
    {
      dimension: '100',
      hauteur: 100,
      largeur: 50,
      epaisseurAme: 4.5,
      epaisseurAile: 7.5,
      poids: 7.59,
      section: 9.66,
      inertiex: 308,
      inertiey: 26.9,
      moduleX: 61.6,
      moduleY: 10.8,
      rayonX: 5.65,
      rayonY: 1.67,
    },
    {
      dimension: '120',
      hauteur: 120,
      largeur: 55,
      epaisseurAme: 5.0,
      epaisseurAile: 8.0,
      poids: 9.46,
      section: 12.0,
      inertiex: 515,
      inertiey: 39.5,
      moduleX: 85.8,
      moduleY: 14.4,
      rayonX: 6.55,
      rayonY: 1.81,
    },
    {
      dimension: '140',
      hauteur: 140,
      largeur: 60,
      epaisseurAme: 5.0,
      epaisseurAile: 9.0,
      poids: 11.5,
      section: 14.7,
      inertiex: 812,
      inertiey: 57.5,
      moduleX: 116,
      moduleY: 19.2,
      rayonX: 7.43,
      rayonY: 1.98,
    },
    {
      dimension: '160',
      hauteur: 160,
      largeur: 65,
      epaisseurAme: 5.5,
      epaisseurAile: 9.5,
      poids: 13.8,
      section: 17.6,
      inertiex: 1200,
      inertiey: 79.5,
      moduleX: 150,
      moduleY: 24.5,
      rayonX: 8.27,
      rayonY: 2.12,
    },
    {
      dimension: '180',
      hauteur: 180,
      largeur: 70,
      epaisseurAme: 6.0,
      epaisseurAile: 10.0,
      poids: 16.6,
      section: 21.1,
      inertiex: 1700,
      inertiey: 107,
      moduleX: 189,
      moduleY: 30.5,
      rayonX: 8.97,
      rayonY: 2.25,
    },
    {
      dimension: '200',
      hauteur: 200,
      largeur: 75,
      epaisseurAme: 6.5,
      epaisseurAile: 11.0,
      poids: 20.1,
      section: 25.6,
      inertiex: 2360,
      inertiey: 143,
      moduleX: 236,
      moduleY: 38.1,
      rayonX: 9.59,
      rayonY: 2.36,
    },
    {
      dimension: '220',
      hauteur: 220,
      largeur: 80,
      epaisseurAme: 7.0,
      epaisseurAile: 11.5,
      poids: 23.8,
      section: 30.3,
      inertiex: 3190,
      inertiey: 186,
      moduleX: 290,
      moduleY: 46.5,
      rayonX: 10.3,
      rayonY: 2.47,
    },
    {
      dimension: '240',
      hauteur: 240,
      largeur: 85,
      epaisseurAme: 7.0,
      epaisseurAile: 12.0,
      poids: 27.0,
      section: 34.4,
      inertiex: 4050,
      inertiey: 230,
      moduleX: 338,
      moduleY: 54.1,
      rayonX: 10.8,
      rayonY: 2.58,
    },
    {
      dimension: '260',
      hauteur: 260,
      largeur: 90,
      epaisseurAme: 7.5,
      epaisseurAile: 12.5,
      poids: 30.6,
      section: 39.0,
      inertiex: 5130,
      inertiey: 283,
      moduleX: 395,
      moduleY: 62.9,
      rayonX: 11.5,
      rayonY: 2.69,
    },
    {
      dimension: '280',
      hauteur: 280,
      largeur: 95,
      epaisseurAme: 8.0,
      epaisseurAile: 13.0,
      poids: 34.8,
      section: 44.3,
      inertiex: 6400,
      inertiey: 344,
      moduleX: 457,
      moduleY: 72.4,
      rayonX: 12.0,
      rayonY: 2.79,
    },
    {
      dimension: '300',
      hauteur: 300,
      largeur: 100,
      epaisseurAme: 8.5,
      epaisseurAile: 14.0,
      poids: 39.8,
      section: 50.7,
      inertiex: 7980,
      inertiey: 420,
      moduleX: 532,
      moduleY: 84.0,
      rayonX: 12.5,
      rayonY: 2.88,
    },
    {
      dimension: '320',
      hauteur: 320,
      largeur: 100,
      epaisseurAme: 9.0,
      epaisseurAile: 14.5,
      poids: 43.2,
      section: 55.0,
      inertiex: 9320,
      inertiey: 442,
      moduleX: 583,
      moduleY: 88.4,
      rayonX: 13.0,
      rayonY: 2.83,
    },
    {
      dimension: '350',
      hauteur: 350,
      largeur: 100,
      epaisseurAme: 9.5,
      epaisseurAile: 14.5,
      poids: 46.2,
      section: 58.8,
      inertiex: 11800,
      inertiey: 446,
      moduleX: 674,
      moduleY: 89.2,
      rayonX: 14.2,
      rayonY: 2.76,
    },
    {
      dimension: '380',
      hauteur: 380,
      largeur: 102,
      epaisseurAme: 10.0,
      epaisseurAile: 16.0,
      poids: 52.7,
      section: 67.1,
      inertiex: 15100,
      inertiey: 564,
      moduleX: 795,
      moduleY: 111,
      rayonX: 15.0,
      rayonY: 2.9,
    },
    {
      dimension: '400',
      hauteur: 400,
      largeur: 110,
      epaisseurAme: 11.0,
      epaisseurAile: 18.0,
      poids: 61.5,
      section: 78.3,
      inertiex: 19600,
      inertiey: 746,
      moduleX: 980,
      moduleY: 136,
      rayonX: 15.8,
      rayonY: 3.09,
    },
  ]

  getFamilleInfo(): { famille: ArticleFamille; sousFamille: string } {
    return {
      famille: ArticleFamille.PROFILES_ACIER,
      sousFamille: 'UPN',
    }
  }

  async generateArticles(): Promise<ArticleMetallurgie[]> {
    const articles: ArticleMetallurgie[] = []
    const materials = ['S235JR', 'S275JR', 'S355JR']

    for (const upn of this.upnSpecifications) {
      for (const material of materials) {
        const caracteristiques: CaracteristiquesTechniques = {
          hauteur: upn.hauteur,
          largeur: upn.largeur,
          epaisseurAme: upn.epaisseurAme,
          epaisseurAile: upn.epaisseurAile,
          poids: upn.poids,
          section: upn.section,
          momentInertieX: upn.inertiex,
          momentInertieY: upn.inertiey,
          moduleResistanceX: upn.moduleX,
          moduleResistanceY: upn.moduleY,
          rayonGirationX: upn.rayonX,
          rayonGirationY: upn.rayonY,
          nuance: material,
          norme: 'EN 10365',
          limiteElastique: this.getLimiteElastique(material),
          resistanceTraction: this.getResistanceTraction(material),
          allongement: this.getAllongement(material),
          applications: this.getApplications(),
          specifications: {
            typeProfile: 'UPN',
            designationCommerciale: `UPN ${upn.dimension}`,
            tolerances: 'EN 10279',
            etatLivraison: 'Laminé à chaud',
          },
        }

        const article: ArticleMetallurgie = {
          reference: `UPN${upn.dimension}-${material}`,
          designation: `Profilé UPN ${upn.dimension} ${material}`,
          description: `Profilé en U normal UPN ${upn.dimension}, hauteur ${upn.hauteur}mm, largeur ${upn.largeur}mm, nuance ${material}, conforme EN 10365`,
          type: ArticleType.MATIERE_PREMIERE,
          status: ArticleStatus.ACTIF,
          famille: ArticleFamille.PROFILES_ACIER,
          sousFamille: 'UPN',
          uniteStock: UniteStock.ML,
          uniteAchat: UniteStock.ML,
          uniteVente: UniteStock.ML,
          coefficientAchat: 1.0,
          coefficientVente: 1.0,
          gereEnStock: true,
          poids: upn.poids,
          caracteristiquesTechniques: caracteristiques,
          societeId: this.config.societeId,
        }

        this.calculatePricing(article)
        articles.push(article)
      }
    }

    this.logger.info(`${articles.length} articles profilés UPN générés`)
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
      'Charpente métallique légère',
      'Ossatures de bâtiments',
      'Poutres secondaires',
      'Lisses de bardage',
      'Pannes de couverture',
      'Structures industrielles',
      'Mezzanines et plateformes',
      'Charpente de maisons',
      'Éléments de façade',
      'Structures de serres',
    ]
  }
}
