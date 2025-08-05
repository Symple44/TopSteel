/**
 * Injecteur pour profilés IPE
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

interface IpeProfile {
  dimension: string
  hauteur: number
  largeur: number
  epaisseurAme: number
  epaisseurAile: number
  poids: number
  section: number
  inertiex: number
  inertiey: number
  moduleX: number
  moduleY: number
  rayon: number
}

export class IpeProfilesInjector extends BaseArticleInjector {
  private readonly ipeProfiles: IpeProfile[] = [
    {
      dimension: '80',
      hauteur: 80,
      largeur: 46,
      epaisseurAme: 3.8,
      epaisseurAile: 5.2,
      poids: 6.0,
      section: 7.64,
      inertiex: 80.1,
      inertiey: 8.49,
      moduleX: 20.0,
      moduleY: 3.69,
      rayon: 5,
    },
    {
      dimension: '100',
      hauteur: 100,
      largeur: 55,
      epaisseurAme: 4.1,
      epaisseurAile: 5.7,
      poids: 8.1,
      section: 10.3,
      inertiex: 171,
      inertiey: 15.9,
      moduleX: 34.2,
      moduleY: 5.79,
      rayon: 7,
    },
    {
      dimension: '120',
      hauteur: 120,
      largeur: 64,
      epaisseurAme: 4.4,
      epaisseurAile: 6.3,
      poids: 10.4,
      section: 13.2,
      inertiex: 318,
      inertiey: 27.7,
      moduleX: 53.0,
      moduleY: 8.65,
      rayon: 7,
    },
    {
      dimension: '140',
      hauteur: 140,
      largeur: 73,
      epaisseurAme: 4.7,
      epaisseurAile: 6.9,
      poids: 12.9,
      section: 16.4,
      inertiex: 541,
      inertiey: 44.9,
      moduleX: 77.3,
      moduleY: 12.3,
      rayon: 7,
    },
    {
      dimension: '160',
      hauteur: 160,
      largeur: 82,
      epaisseurAme: 5.0,
      epaisseurAile: 7.4,
      poids: 15.8,
      section: 20.1,
      inertiex: 869,
      inertiey: 68.3,
      moduleX: 109,
      moduleY: 16.7,
      rayon: 9,
    },
    {
      dimension: '180',
      hauteur: 180,
      largeur: 91,
      epaisseurAme: 5.3,
      epaisseurAile: 8.0,
      poids: 18.8,
      section: 23.9,
      inertiex: 1320,
      inertiey: 101,
      moduleX: 146,
      moduleY: 22.2,
      rayon: 9,
    },
    {
      dimension: '200',
      hauteur: 200,
      largeur: 100,
      epaisseurAme: 5.6,
      epaisseurAile: 8.5,
      poids: 22.4,
      section: 28.5,
      inertiex: 1940,
      inertiey: 142,
      moduleX: 194,
      moduleY: 28.5,
      rayon: 12,
    },
    {
      dimension: '220',
      hauteur: 220,
      largeur: 110,
      epaisseurAme: 5.9,
      epaisseurAile: 9.2,
      poids: 26.2,
      section: 33.4,
      inertiex: 2770,
      inertiey: 204,
      moduleX: 252,
      moduleY: 37.1,
      rayon: 12,
    },
    {
      dimension: '240',
      hauteur: 240,
      largeur: 120,
      epaisseurAme: 6.2,
      epaisseurAile: 9.8,
      poids: 30.7,
      section: 39.1,
      inertiex: 3890,
      inertiey: 284,
      moduleX: 324,
      moduleY: 47.3,
      rayon: 15,
    },
    {
      dimension: '270',
      hauteur: 270,
      largeur: 135,
      epaisseurAme: 6.6,
      epaisseurAile: 10.2,
      poids: 36.1,
      section: 45.9,
      inertiex: 5790,
      inertiey: 420,
      moduleX: 429,
      moduleY: 62.2,
      rayon: 15,
    },
    {
      dimension: '300',
      hauteur: 300,
      largeur: 150,
      epaisseurAme: 7.1,
      epaisseurAile: 10.7,
      poids: 42.2,
      section: 53.8,
      inertiex: 8360,
      inertiey: 604,
      moduleX: 557,
      moduleY: 80.5,
      rayon: 15,
    },
    {
      dimension: '330',
      hauteur: 330,
      largeur: 160,
      epaisseurAme: 7.5,
      epaisseurAile: 11.5,
      poids: 49.1,
      section: 62.6,
      inertiex: 11770,
      inertiey: 788,
      moduleX: 713,
      moduleY: 98.5,
      rayon: 18,
    },
    {
      dimension: '360',
      hauteur: 360,
      largeur: 170,
      epaisseurAme: 8.0,
      epaisseurAile: 12.7,
      poids: 57.1,
      section: 72.7,
      inertiex: 16270,
      inertiey: 1040,
      moduleX: 904,
      moduleY: 123,
      rayon: 18,
    },
    {
      dimension: '400',
      hauteur: 400,
      largeur: 180,
      epaisseurAme: 8.6,
      epaisseurAile: 13.5,
      poids: 66.3,
      section: 84.5,
      inertiex: 23130,
      inertiey: 1320,
      moduleX: 1160,
      moduleY: 146,
      rayon: 21,
    },
    {
      dimension: '450',
      hauteur: 450,
      largeur: 190,
      epaisseurAme: 9.4,
      epaisseurAile: 14.6,
      poids: 77.6,
      section: 98.8,
      inertiex: 33740,
      inertiey: 1680,
      moduleX: 1500,
      moduleY: 176,
      rayon: 21,
    },
    {
      dimension: '500',
      hauteur: 500,
      largeur: 200,
      epaisseurAme: 10.2,
      epaisseurAile: 16.0,
      poids: 90.7,
      section: 116,
      inertiex: 48200,
      inertiey: 2140,
      moduleX: 1930,
      moduleY: 214,
      rayon: 21,
    },
    {
      dimension: '550',
      hauteur: 550,
      largeur: 210,
      epaisseurAme: 11.1,
      epaisseurAile: 17.2,
      poids: 106,
      section: 134,
      inertiex: 67120,
      inertiey: 2670,
      moduleX: 2440,
      moduleY: 254,
      rayon: 24,
    },
    {
      dimension: '600',
      hauteur: 600,
      largeur: 220,
      epaisseurAme: 12.0,
      epaisseurAile: 19.0,
      poids: 122,
      section: 156,
      inertiex: 92080,
      inertiey: 3390,
      moduleX: 3070,
      moduleY: 308,
      rayon: 24,
    },
  ]

  getFamilleInfo(): { famille: ArticleFamille; sousFamille: string } {
    return {
      famille: ArticleFamille.PROFILES_ACIER,
      sousFamille: 'IPE',
    }
  }

  async generateArticles(): Promise<ArticleMetallurgie[]> {
    const articles: ArticleMetallurgie[] = []
    const materials = ['S235JR', 'S275JR', 'S355JR']

    for (const profile of this.ipeProfiles) {
      for (const material of materials) {
        const caracteristiques: CaracteristiquesTechniques = {
          hauteur: profile.hauteur,
          largeur: profile.largeur,
          epaisseurAme: profile.epaisseurAme,
          epaisseurAile: profile.epaisseurAile,
          poids: profile.poids,
          section: profile.section,
          momentInertieX: profile.inertiex,
          momentInertieY: profile.inertiey,
          moduleResistanceX: profile.moduleX,
          moduleResistanceY: profile.moduleY,
          rayonGirationX: Math.sqrt(profile.inertiex / profile.section),
          rayonGirationY: Math.sqrt(profile.inertiey / profile.section),
          nuance: material,
          norme: 'EN 10025-2',
          limiteElastique: this.getLimiteElastique(material),
          resistanceTraction: this.getResistanceTraction(material),
          allongement: this.getAllongement(material),
          applications: ['Structure métallique', 'Charpente', 'Construction'],
          specifications: {
            typeProfile: 'IPE',
            dimension: profile.dimension,
            rayonConge: profile.rayon,
          },
        }

        const article: ArticleMetallurgie = {
          reference: `IPE${profile.dimension}-${material}`,
          designation: `Profilé IPE ${profile.dimension} ${material}`,
          description: `Poutrelle IPE ${profile.dimension}mm, nuance ${material}, conforme EN 10025-2`,
          type: ArticleType.MATIERE_PREMIERE,
          status: ArticleStatus.ACTIF,
          famille: ArticleFamille.PROFILES_ACIER,
          sousFamille: 'IPE',
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

        // Calculer le prix basé sur le poids et la nuance
        this.calculatePricing(article)

        articles.push(article)
      }
    }

    this.logger.info(`${articles.length} articles profilés IPE générés`)
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
}
