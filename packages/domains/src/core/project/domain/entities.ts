/**
 * 🏗️ ENTITÉS MÉTIER - DOMAINE PROJECT
 * Logique métier pure pour les projets
 */

import type { BaseEntity } from '../../base'

// ===== ENUMS MÉTIER =====

export enum ProjetStatut {
  BROUILLON = 'BROUILLON',
  DEVIS = 'DEVIS',
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTE = 'ACCEPTE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  FACTURE = 'FACTURE',
  ANNULE = 'ANNULE',
}

export enum ProjetType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  MAINTENANCE = 'MAINTENANCE',
  CONCEPTION = 'CONCEPTION',
  FABRICATION = 'FABRICATION',
  INSTALLATION = 'INSTALLATION',
}

export enum ProjetPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
}

// ===== VALUE OBJECTS =====

export interface ProjetContact {
  readonly nom: string
  readonly prenom: string
  readonly telephone?: string
  readonly email?: string
  readonly fonction?: string
}

export interface ProjetAdresse {
  readonly nom?: string
  readonly rue: string
  readonly ville: string
  readonly codePostal: string
  readonly pays: string
  readonly complement?: string
  readonly coordonnees?: {
    latitude: number
    longitude: number
  }
}

export interface ProjetDelais {
  readonly dateDebut: Date
  readonly dateFin: Date
  readonly delaiProduction?: number // en jours
  readonly delaiLivraison?: number // en jours
  readonly dateLivraison?: Date
}

export interface ProjetMontants {
  readonly montantHT: number
  readonly montantTTC: number
  readonly tauxTVA: number
  readonly acompte?: number
  readonly montantFacture?: number
}

export interface ProjetDocuments {
  readonly cahierCharges?: string
  readonly plans: string[]
  readonly photos: string[]
  readonly certificats: string[]
  readonly rapports: string[]
}

// ===== ENTITÉ PRINCIPALE =====

export interface Projet extends BaseEntity {
  // Identification
  readonly reference: string
  readonly nom: string
  readonly description?: string
  readonly type: ProjetType
  readonly statut: ProjetStatut
  readonly priorite: ProjetPriorite
  
  // Relations
  readonly clientId: string
  readonly responsableId: string
  readonly commercialId?: string
  readonly equipeIds: string[]
  
  // Détails projet
  readonly adresseLivraison: ProjetAdresse
  readonly contact: ProjetContact
  readonly delais: ProjetDelais
  readonly montants: ProjetMontants
  
  // Contenu technique
  readonly specifications?: string
  readonly materiaux: string[]
  readonly operations: string[]
  readonly documents: ProjetDocuments
  
  // Suivi
  readonly avancement: number // 0-100
  readonly heuresEstimees?: number
  readonly heuresRealisees?: number
  readonly coutEstime?: number
  readonly coutReel?: number
  
  // Métadonnées
  readonly tags: string[]
  readonly notes?: string
  readonly dateValidation?: Date
  readonly dateFacturation?: Date
  
  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy: string
  readonly lastModifiedBy?: string
}

// ===== FILTRES ET REQUÊTES =====

export interface ProjetFilters {
  readonly search?: string
  readonly statut?: ProjetStatut[]
  readonly type?: ProjetType[]
  readonly priorite?: ProjetPriorite[]
  readonly clientId?: string
  readonly responsableId?: string
  readonly dateDebutMin?: Date
  readonly dateDebutMax?: Date
  readonly dateFinMin?: Date
  readonly dateFinMax?: Date
  readonly montantMin?: number
  readonly montantMax?: number
  readonly avancementMin?: number
  readonly avancementMax?: number
  readonly tags?: string[]
}

export interface ProjetSortOptions {
  readonly field: 'reference' | 'nom' | 'statut' | 'priorite' | 'dateDebut' | 'dateFin' | 'montantHT' | 'avancement' | 'createdAt'
  readonly direction: 'asc' | 'desc'
}

// ===== AGRÉGATS =====

export interface ProjetStats {
  readonly total: number
  readonly parStatut: Record<ProjetStatut, number>
  readonly parType: Record<ProjetType, number>
  readonly chiffreAffaireMoyen: number
  readonly delaiMoyen: number
  readonly tauxReussite: number
}

export interface ProjetWithDetails extends Projet {
  readonly client: {
    nom: string
    email: string
    telephone: string
  }
  readonly responsable: {
    nom: string
    prenom: string
    email: string
  }
  readonly equipe: Array<{
    id: string
    nom: string
    prenom: string
    role: string
  }>
  readonly devis: Array<{
    id: string
    numero: string
    montant: number
    statut: string
  }>
  readonly factures: Array<{
    id: string
    numero: string
    montant: number
    dateEmission: Date
  }>
}