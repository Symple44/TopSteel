# Script de correction des imports TypeScript
# fix-imports.ps1

Write-Host "🔧 CORRECTION DES IMPORTS TYPESCRIPT" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Gray

# 1. Corriger client.ts
Write-Host "`n📝 Correction de client.ts..." -ForegroundColor Cyan
$clientContent = @'
// packages/types/src/client.ts
import { BaseEntity, Address, Contact } from './common'

export enum ClientType {
  PARTICULIER = 'PARTICULIER',
  PROFESSIONNEL = 'PROFESSIONNEL',
  COLLECTIVITE = 'COLLECTIVITE'
}

export interface Client extends BaseEntity {
  nom: string
  type: ClientType
  siret?: string
  adresse: Address
  contact: Contact
  email: string
  telephone: string
  notes?: string
  chiffreAffaires?: number
  projetsActifs?: number
  isActif: boolean
}
'@
$clientContent | Out-File -FilePath "packages\types\src\client.ts" -Encoding UTF8

# 2. Corriger devis.ts
Write-Host "`n📝 Correction de devis.ts..." -ForegroundColor Cyan
$devisContent = @'
// packages/types/src/devis.ts
import { BaseEntity, Unit } from './common'
import type { Projet } from './projet'
import type { Client } from './client'

export enum DevisStatut {
  BROUILLON = 'BROUILLON',
  ENVOYE = 'ENVOYE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EXPIRE = 'EXPIRE'
}

export interface LigneDevis {
  id: string
  designation: string
  description?: string
  quantite: number
  unite: Unit
  prixUnitaireHT: number
  totalHT: number
  tauxTVA: number
  totalTTC: number
}

export interface Devis extends BaseEntity {
  numero: string
  projetId: string
  projet: Projet
  clientId: string
  client: Client
  statut: DevisStatut
  dateValidite: Date
  dateEnvoi?: Date
  dateAcceptation?: Date
  lignes: LigneDevis[]
  totalHT: number
  totalTVA: number
  totalTTC: number
  conditions?: string
  notes?: string
  remise?: number
  acompte?: number
  delaiLivraison?: string
}
'@
$devisContent | Out-File -FilePath "packages\types\src\devis.ts" -Encoding UTF8

# 3. Corriger forms.ts
Write-Host "`n📝 Correction de forms.ts..." -ForegroundColor Cyan
$formsContent = @'
// packages/types/src/forms.ts
import { Address, Contact, Unit } from './common'
import { ProjetType, ProjetPriorite } from './projet'
import { ClientType } from './client'
import { StockType } from './stock'

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ProjetFormData {
  clientId: string
  description: string
  type: ProjetType
  priorite: ProjetPriorite
  dateDebut?: string
  dateFin?: string
  adresseChantier: Address
  notes?: string
}

export interface ClientFormData {
  nom: string
  type: ClientType
  siret?: string
  adresse: Address
  contact: Contact
  email: string
  telephone: string
  notes?: string
}

export interface StockFormData {
  reference: string
  designation: string
  description?: string
  type: StockType
  quantiteStock: number
  quantiteMin: number
  quantiteMax: number
  unite: Unit
  prixAchat: number
  prixVente?: number
  fournisseur: string
  emplacement: string
}
'@
$formsContent | Out-File -FilePath "packages\types\src\forms.ts" -Encoding UTF8

# 4. Corriger projet.ts
Write-Host "`n📝 Correction de projet.ts..." -ForegroundColor Cyan
$projetContent = @'
// packages/types/src/projet.ts
import { BaseEntity, Address } from './common'
import type { Client } from './client'
import type { User } from './user'

export enum ProjetStatut {
  BROUILLON = 'BROUILLON',
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  FACTURE = 'FACTURE'
}

export enum ProjetType {
  PORTAIL = 'PORTAIL',
  CLOTURE = 'CLOTURE',
  ESCALIER = 'ESCALIER',
  RAMPE = 'RAMPE',
  VERRIERE = 'VERRIERE',
  STRUCTURE = 'STRUCTURE',
  BARDAGE = 'BARDAGE',
  COUVERTURE = 'COUVERTURE',
  CHARPENTE = 'CHARPENTE',
  PHOTOVOLTAIQUE = 'PHOTOVOLTAIQUE',
  AUTRE = 'AUTRE'
}

export enum ProjetPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE'
}

export interface Projet extends BaseEntity {
  reference: string
  description: string
  client: Client
  clientId: string
  statut: ProjetStatut
  type: ProjetType
  priorite: ProjetPriorite
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  adresseChantier: Address
  montantHT: number
  montantTTC: number
  tauxTVA: number
  marge: number
  avancement: number
  notes?: string
  alertes?: string[]
  responsable?: User
  responsableId?: string
  documentsIds: string[]
  ordresFabricationIds: string[]
}
'@
$projetContent | Out-File -FilePath "packages\types\src\projet.ts" -Encoding UTF8

# 5. Corriger stock.ts
Write-Host "`n📝 Correction de stock.ts..." -ForegroundColor Cyan
$stockContent = @'
// packages/types/src/stock.ts
import { BaseEntity, Unit } from './common'
import type { User } from './user'

export enum StockType {
  MATIERE_PREMIERE = 'MATIERE_PREMIERE',
  PRODUIT_FINI = 'PRODUIT_FINI',
  CONSOMMABLE = 'CONSOMMABLE',
  OUTILLAGE = 'OUTILLAGE'
}

export interface Stock extends BaseEntity {
  reference: string
  designation: string
  description?: string
  type: StockType
  quantiteStock: number
  quantiteMin: number
  quantiteMax: number
  quantiteReservee: number
  unite: Unit
  prixAchat: number
  prixVente?: number
  fournisseur: string
  emplacement: string
  alerteStockBas: boolean
}

export interface MouvementStock extends BaseEntity {
  stockId: string
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT' | 'RESERVATION' | 'LIBERATION'
  quantite: number
  quantiteAvant: number
  quantiteApres: number
  motif: string
  reference?: string
  cout?: number
  utilisateur?: User
  utilisateurId?: string
}
'@
$stockContent | Out-File -FilePath "packages\types\src\stock.ts" -Encoding UTF8

# 6. Corriger user.ts
Write-Host "`n📝 Correction de user.ts..." -ForegroundColor Cyan
$userContent = @'
// packages/types/src/user.ts
import { BaseEntity } from './common'

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  COMMERCIAL = 'COMMERCIAL',
  PRODUCTION = 'PRODUCTION',
  COMPTABLE = 'COMPTABLE',
  EMPLOYE = 'EMPLOYE'
}

export interface User extends BaseEntity {
  email: string
  nom: string
  prenom: string
  role: UserRole
  telephone?: string
  isActive: boolean
  lastLogin?: Date
  permissions: string[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
'@
$userContent | Out-File -FilePath "packages\types\src\user.ts" -Encoding UTF8

# 7. Corriger production.ts (chercher d'abord s'il existe)
if (Test-Path "packages\types\src\production.ts") {
    Write-Host "`n📝 Correction de production.ts..." -ForegroundColor Cyan
    $productionContent = @'
// packages/types/src/production.ts
import { BaseEntity } from './common'
import type { Projet } from './projet'
import { ProjetPriorite } from './projet'
import type { User } from './user'
import type { Stock } from './stock'

export enum OrdreFabricationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE'
}

export interface OrdreFabrication extends BaseEntity {
  numero: string
  projetId: string
  projet: Projet
  statut: OrdreFabricationStatut
  description: string
  priorite: ProjetPriorite
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  notes?: string
  responsable?: User
  responsableId?: string
  taches: TacheFabrication[]
  materiaux: MateriauRequis[]
  coutMain: number
  coutMateriaux: number
  coutTotal: number
}

export interface MateriauRequis {
  stockId: string
  stock: Stock
  quantiteRequise: number
  quantiteUtilisee: number
  cout: number
}

export interface TacheFabrication extends BaseEntity {
  ordreFabricationId: string
  nom: string
  description?: string
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE'
  dureeEstimee: number
  dureeRealise?: number
  dateDebut?: Date
  dateFin?: Date
  responsable?: User
  responsableId?: string
  notes?: string
}
'@
    $productionContent | Out-File -FilePath "packages\types\src\production.ts" -Encoding UTF8
}

# 8. Corriger utils tsconfig et fichiers
Write-Host "`n📝 Correction du package utils..." -ForegroundColor Cyan

# Corriger tsconfig.json pour utils
$utilsConfig = @'
{
  "extends": "@erp/config/typescript/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022", "DOM"],
    "types": ["node"]
  }
}
'@
$utilsConfig | Out-File -FilePath "packages\utils\tsconfig.json" -Encoding UTF8

# Corriger le fichier utils src/index.ts pour supprimer les erreurs
$utilsIndex = @'
// packages/utils/src/index.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilitaires de formatage
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR').format(d)
}

// Utilitaires de validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Utilitaire de debug sûr
export function debugLog(message: string, data?: any): void {
  if (typeof window !== 'undefined' && window.console) {
    console.log(message, data)
  }
}
'@
$utilsIndex | Out-File -FilePath "packages\utils\src\index.ts" -Encoding UTF8

Write-Host "`n✅ Correction des imports terminée!" -ForegroundColor Green

# 9. Tester la compilation
Write-Host "`n🧪 Test de compilation..." -ForegroundColor Cyan

try {
    Write-Host "Test types..."
    pnpm build --filter @erp/types
    Write-Host "✅ Types OK!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Problèmes avec types" -ForegroundColor Yellow
}

try {
    Write-Host "Test utils..."
    pnpm build --filter @erp/utils
    Write-Host "✅ Utils OK!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Problèmes avec utils" -ForegroundColor Yellow
}

try {
    Write-Host "Test ui..."
    pnpm build --filter @erp/ui
    Write-Host "✅ UI OK!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Problèmes avec ui" -ForegroundColor Yellow
}

Write-Host "`n🚀 Lancement du serveur de développement..." -ForegroundColor Cyan
pnpm dev