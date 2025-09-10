import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client-instance'
import { deleteTyped, fetchTyped, postTyped } from '@/lib/api-typed'

// Types pour les articles (similaires aux matériaux)
export interface Article extends Record<string, unknown> {
  id: string
  reference: string
  designation: string
  type: ArticleType
  status: ArticleStatus
  description?: string
  famille?: string
  sousFamille?: string
  marque?: string
  modele?: string
  uniteStock: string
  uniteAchat?: string
  uniteVente?: string
  coefficientAchat: number
  coefficientVente: number
  gereEnStock: boolean
  stockPhysique?: number
  stockReserve?: number
  stockDisponible?: number
  stockMini?: number
  stockMaxi?: number
  stockSecurite?: number
  methodeValorisation: string
  prixAchatStandard?: number
  prixAchatMoyen?: number
  prixVenteHT?: number
  tauxTVA?: number
  tauxMarge?: number
  fournisseurPrincipalId?: string
  referenceFournisseur?: string
  delaiApprovisionnement?: number
  quantiteMiniCommande?: number
  quantiteMultipleCommande?: number
  poids?: number
  volume?: number
  longueur?: number
  largeur?: number
  hauteur?: number
  couleur?: string
  compteComptableAchat?: string
  compteComptableVente?: string
  compteComptableStock?: string
  codeDouanier?: string
  codeEAN?: string
  caracteristiquesTechniques?: Record<string, unknown>
  informationsLogistiques?: Record<string, unknown>
  metadonnees?: Record<string, unknown>
  dateCreationFiche?: string
  dateDerniereModification?: string
  dateDernierInventaire?: string
  createdAt?: string
  updatedAt?: string
}

export enum ArticleType {
  MATIERE_PREMIERE = 'MATIERE_PREMIERE',
  PRODUIT_FINI = 'PRODUIT_FINI',
  PRODUIT_SEMI_FINI = 'PRODUIT_SEMI_FINI',
  FOURNITURE = 'FOURNITURE',
  CONSOMMABLE = 'CONSOMMABLE',
  SERVICE = 'SERVICE',
}

export enum ArticleStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  OBSOLETE = 'OBSOLETE',
  EN_COURS_CREATION = 'EN_COURS_CREATION',
  EN_ATTENTE = 'EN_ATTENTE',
}

export interface ArticleFilters {
  page?: number
  limit?: number
  search?: string
  type?: ArticleType
  status?: ArticleStatus
  famille?: string
  marque?: string
  stockCondition?: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface ArticleStatistics {
  totalArticles: number
  repartitionParType: Record<ArticleType, number>
  repartitionParStatus: Record<ArticleStatus, number>
  repartitionParFamille: Record<string, number>
  articlesGeresEnStock: number
  valeurTotaleStock: number
  articlesEnRupture: number
  articlesSousStockMini: number
  articlesObsoletes: number
}

export interface StockValorisation {
  nombreArticles: number
  valeurTotale: number
  valeurParFamille: Record<string, number>
  articlesSansStock: number
  articlesEnRupture: number
  articlesSousStockMini: number
}

// Hook pour récupérer la liste des articles avec filtres
export function useArticles(filters: ArticleFilters = {}) {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async (): Promise<Article[]> => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await fetchTyped<Article[]>(`/api/business/articles?${params.toString()}`)
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook pour récupérer un article par ID
export function useArticle(id: string) {
  return useQuery({
    queryKey: ['articles', id],
    queryFn: async (): Promise<Article> => {
      const response = await fetchTyped<Article>(`/api/business/articles/${id}`)
      return response
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook pour les statistiques des articles
export function useArticleStatistics() {
  return useQuery({
    queryKey: ['articles', 'statistics'],
    queryFn: async (): Promise<ArticleStatistics> => {
      const response = await fetchTyped<ArticleStatistics>('/api/business/articles/statistics')
      return response
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Hook pour la valorisation du stock
export function useStockValorisation(famille?: string) {
  return useQuery({
    queryKey: ['articles', 'valorisation', famille],
    queryFn: async (): Promise<StockValorisation> => {
      const params = famille ? `?famille=${encodeURIComponent(famille)}` : ''
      const response = await fetchTyped<StockValorisation>(
        `/api/business/articles/valorisation${params}`
      )
      return response
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Hook pour les articles en rupture
export function useArticlesEnRupture() {
  return useQuery({
    queryKey: ['articles', 'rupture'],
    queryFn: async (): Promise<Article[]> => {
      const response = await fetchTyped<Article[]>('/api/business/articles/rupture')
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook pour les articles sous stock minimum
export function useArticlesSousStockMini() {
  return useQuery({
    queryKey: ['articles', 'sous-stock-mini'],
    queryFn: async (): Promise<Article[]> => {
      const response = await fetchTyped<Article[]>('/api/business/articles/sous-stock-mini')
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook pour les articles à réapprovisionner
export function useArticlesAReapprovisionner() {
  return useQuery({
    queryKey: ['articles', 'a-reapprovisionner'],
    queryFn: async (): Promise<Array<Article & { quantiteACommander: number }>> => {
      const response = await fetchTyped<Array<Article & { quantiteACommander: number }>>(
        '/api/business/articles/a-reapprovisionner'
      )
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook pour créer un article
export function useCreateArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Article>): Promise<Article> => {
      const response = await postTyped<Article, Partial<Article>>('/api/business/articles', data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      toast.success('Article créé avec succès')
    },
    onError: () => {
      toast.error("Erreur lors de la création de l'article")
    },
  })
}

// Hook pour modifier un article
export function useUpdateArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Article> }): Promise<Article> => {
      const response = await apiClient.patch<Article>(`/api/business/articles/${id}`, data)
      return response
    },
    onSuccess: (updatedArticle) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.setQueryData(['articles', updatedArticle.id], updatedArticle)
      toast.success('Article modifié avec succès')
    },
    onError: () => {
      toast.error("Erreur lors de la modification de l'article")
    },
  })
}

// Hook pour supprimer un article
export function useDeleteArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await deleteTyped<void>(`/api/business/articles/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      toast.success('Article supprimé avec succès')
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'article")
    },
  })
}

// Hook pour effectuer un inventaire
export function useEffectuerInventaire() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      stockPhysiqueReel,
      commentaire,
    }: {
      id: string
      stockPhysiqueReel: number
      commentaire?: string
    }): Promise<Article> => {
      const response = await postTyped<
        Article,
        { stockPhysiqueReel: number; commentaire?: string }
      >(`/api/business/articles/${id}/inventaire`, {
        stockPhysiqueReel,
        commentaire,
      })
      return response
    },
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.setQueryData(['articles', article.id], article)
      toast.success('Inventaire effectué avec succès')
    },
    onError: () => {
      toast.error("Erreur lors de l'inventaire")
    },
  })
}

// Hook pour dupliquer un article
export function useDupliquerArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      nouvelleReference,
      modifications,
    }: {
      id: string
      nouvelleReference: string
      modifications?: Partial<Article>
    }): Promise<Article> => {
      const response = await postTyped<
        Article,
        { nouvelleReference: string; modifications?: Partial<Article> }
      >(`/api/business/articles/${id}/dupliquer`, {
        nouvelleReference,
        modifications,
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      toast.success('Article dupliqué avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la duplication')
    },
  })
}

// Hook pour créer une commande de réapprovisionnement
export function useCreerCommandeReapprovisionnement() {
  return useMutation({
    mutationFn: async (
      fournisseurId: string
    ): Promise<{ articles: Article[]; quantitesTotales: number }> => {
      const response = await postTyped<
        { articles: Article[]; quantitesTotales: number },
        undefined
      >(`/api/business/articles/reapprovisionner/${fournisseurId}`)
      return response
    },
    onSuccess: (result) => {
      toast.success(
        `Commande créée: ${result.articles.length} articles (${result.quantitesTotales} unités)`
      )
    },
    onError: () => {
      toast.error('Erreur lors de la création de la commande')
    },
  })
}
