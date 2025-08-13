'use client'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@erp/ui'
import { useEffect, useMemo, useState } from 'react'
import {
  type Article,
  ArticleStatus,
  ArticleType,
  useCreateArticle,
  useUpdateArticle,
} from '@/hooks/use-articles'
import { sanitizeInput } from '@/lib/security-utils'
import { cn } from '@/lib/utils'

interface ArticleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article?: Article | null
  mode: 'create' | 'edit'
}

interface FormData {
  reference: string
  designation: string
  description: string
  type: ArticleType
  status: ArticleStatus
  famille: string
  sousFamille: string
  marque: string
  modele: string
  uniteStock: string
  uniteAchat: string
  uniteVente: string
  coefficientAchat: string
  coefficientVente: string
  gereEnStock: boolean
  stockPhysique: string
  stockMini: string
  stockMaxi: string
  stockSecurite: string
  methodeValorisation: string
  prixAchatStandard: string
  prixVenteHT: string
  tauxTVA: string
  tauxMarge: string
  delaiApprovisionnement: string
  quantiteMiniCommande: string
  poids: string
  longueur: string
  largeur: string
  hauteur: string
  couleur: string
}

const defaultFormData: FormData = {
  reference: '',
  designation: '',
  description: '',
  type: ArticleType.MATIERE_PREMIERE,
  status: ArticleStatus.ACTIF,
  famille: '',
  sousFamille: '',
  marque: '',
  modele: '',
  uniteStock: 'pcs',
  uniteAchat: '',
  uniteVente: '',
  coefficientAchat: '1',
  coefficientVente: '1',
  gereEnStock: true,
  stockPhysique: '0',
  stockMini: '0',
  stockMaxi: '0',
  stockSecurite: '0',
  methodeValorisation: 'FIFO',
  prixAchatStandard: '',
  prixVenteHT: '',
  tauxTVA: '20',
  tauxMarge: '',
  delaiApprovisionnement: '',
  quantiteMiniCommande: '',
  poids: '',
  longueur: '',
  largeur: '',
  hauteur: '',
  couleur: '',
}

export function ArticleFormDialog({ open, onOpenChange, article, mode }: ArticleFormDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createArticle = useCreateArticle()
  const updateArticle = useUpdateArticle()

  const isSubmitting = createArticle.isPending || updateArticle.isPending

  useEffect(() => {
    if (article && mode === 'edit') {
      setFormData({
        reference: article.reference || '',
        designation: article.designation || '',
        description: article.description || '',
        type: article.type || ArticleType.MATIERE_PREMIERE,
        status: article.status || ArticleStatus.ACTIF,
        famille: article.famille || '',
        sousFamille: article.sousFamille || '',
        marque: article.marque || '',
        modele: article.modele || '',
        uniteStock: article.uniteStock || 'pcs',
        uniteAchat: article.uniteAchat || '',
        uniteVente: article.uniteVente || '',
        coefficientAchat: String(article.coefficientAchat || 1),
        coefficientVente: String(article.coefficientVente || 1),
        gereEnStock: article.gereEnStock || false,
        stockPhysique: String(article.stockPhysique || 0),
        stockMini: String(article.stockMini || 0),
        stockMaxi: String(article.stockMaxi || 0),
        stockSecurite: String(article.stockSecurite || 0),
        methodeValorisation: article.methodeValorisation || 'FIFO',
        prixAchatStandard: String(article.prixAchatStandard || ''),
        prixVenteHT: String(article.prixVenteHT || ''),
        tauxTVA: String(article.tauxTVA || 20),
        tauxMarge: String(article.tauxMarge || ''),
        delaiApprovisionnement: String(article.delaiApprovisionnement || ''),
        quantiteMiniCommande: String(article.quantiteMiniCommande || ''),
        poids: String(article.poids || ''),
        longueur: String(article.longueur || ''),
        largeur: String(article.largeur || ''),
        hauteur: String(article.hauteur || ''),
        couleur: article.couleur || '',
      })
    } else if (mode === 'create') {
      setFormData(defaultFormData)
    }
    setErrors({})
  }, [article, mode])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.reference.trim()) {
      newErrors.reference = 'La référence est obligatoire'
    }

    if (!formData.designation.trim()) {
      newErrors.designation = 'La désignation est obligatoire'
    }

    if (!formData.uniteStock.trim()) {
      newErrors.uniteStock = "L'unité de stock est obligatoire"
    }

    const coeffAchat = parseFloat(formData.coefficientAchat)
    if (Number.isNaN(coeffAchat) || coeffAchat <= 0) {
      newErrors.coefficientAchat = "Le coefficient d'achat doit être supérieur à 0"
    }

    const coeffVente = parseFloat(formData.coefficientVente)
    if (Number.isNaN(coeffVente) || coeffVente <= 0) {
      newErrors.coefficientVente = 'Le coefficient de vente doit être supérieur à 0'
    }

    if (formData.gereEnStock) {
      const stockPhysique = parseFloat(formData.stockPhysique)
      if (Number.isNaN(stockPhysique) || stockPhysique < 0) {
        newErrors.stockPhysique = 'Le stock physique doit être positif ou nul'
      }

      const stockMini = parseFloat(formData.stockMini)
      if (Number.isNaN(stockMini) || stockMini < 0) {
        newErrors.stockMini = 'Le stock minimum doit être positif ou nul'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const sanitizedData = {
      reference: sanitizeInput(formData.reference),
      designation: sanitizeInput(formData.designation),
      description: sanitizeInput(formData.description) || undefined,
      type: formData.type,
      status: formData.status,
      famille: sanitizeInput(formData.famille) || undefined,
      sousFamille: sanitizeInput(formData.sousFamille) || undefined,
      marque: sanitizeInput(formData.marque) || undefined,
      modele: sanitizeInput(formData.modele) || undefined,
      uniteStock: sanitizeInput(formData.uniteStock),
      uniteAchat: sanitizeInput(formData.uniteAchat) || undefined,
      uniteVente: sanitizeInput(formData.uniteVente) || undefined,
      coefficientAchat: parseFloat(formData.coefficientAchat),
      coefficientVente: parseFloat(formData.coefficientVente),
      gereEnStock: formData.gereEnStock,
      stockPhysique: formData.gereEnStock ? parseFloat(formData.stockPhysique) || 0 : undefined,
      stockMini: formData.gereEnStock ? parseFloat(formData.stockMini) || 0 : undefined,
      stockMaxi:
        formData.gereEnStock && formData.stockMaxi ? parseFloat(formData.stockMaxi) : undefined,
      stockSecurite:
        formData.gereEnStock && formData.stockSecurite
          ? parseFloat(formData.stockSecurite)
          : undefined,
      methodeValorisation: formData.methodeValorisation,
      prixAchatStandard: formData.prixAchatStandard
        ? parseFloat(formData.prixAchatStandard)
        : undefined,
      prixVenteHT: formData.prixVenteHT ? parseFloat(formData.prixVenteHT) : undefined,
      tauxTVA: formData.tauxTVA ? parseFloat(formData.tauxTVA) : undefined,
      tauxMarge: formData.tauxMarge ? parseFloat(formData.tauxMarge) : undefined,
      delaiApprovisionnement: formData.delaiApprovisionnement
        ? parseInt(formData.delaiApprovisionnement)
        : undefined,
      quantiteMiniCommande: formData.quantiteMiniCommande
        ? parseFloat(formData.quantiteMiniCommande)
        : undefined,
      poids: formData.poids ? parseFloat(formData.poids) : undefined,
      longueur: formData.longueur ? parseFloat(formData.longueur) : undefined,
      largeur: formData.largeur ? parseFloat(formData.largeur) : undefined,
      hauteur: formData.hauteur ? parseFloat(formData.hauteur) : undefined,
      couleur: sanitizeInput(formData.couleur) || undefined,
    }

    try {
      if (mode === 'create') {
        await createArticle.mutateAsync(sanitizedData)
      } else if (article) {
        await updateArticle.mutateAsync({ id: article.id, data: sanitizedData })
      }
      onOpenChange(false)
    } catch (_error) {}
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const typeLabels = useMemo(
    () => ({
      [ArticleType.MATIERE_PREMIERE]: 'Matière première',
      [ArticleType.PRODUIT_FINI]: 'Produit fini',
      [ArticleType.PRODUIT_SEMI_FINI]: 'Produit semi-fini',
      [ArticleType.FOURNITURE]: 'Fourniture',
      [ArticleType.CONSOMMABLE]: 'Consommable',
      [ArticleType.SERVICE]: 'Service',
    }),
    []
  )

  const statusLabels = useMemo(
    () => ({
      [ArticleStatus.ACTIF]: 'Actif',
      [ArticleStatus.INACTIF]: 'Inactif',
      [ArticleStatus.OBSOLETE]: 'Obsolète',
      [ArticleStatus.EN_COURS_CREATION]: 'En cours de création',
    }),
    []
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? 'Créer un nouvel article'
              : `Modifier l'article ${article?.reference}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations générales</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reference">Référence *</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  className={cn(errors.reference && 'border-red-500')}
                />
                {errors.reference && (
                  <p className="text-sm text-red-600 mt-1">{errors.reference}</p>
                )}
              </div>

              <div>
                <Label htmlFor="designation">Désignation *</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  className={cn(errors.designation && 'border-red-500')}
                />
                {errors.designation && (
                  <p className="text-sm text-red-600 mt-1">{errors.designation}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="famille">Famille</Label>
                <Input
                  id="famille"
                  value={formData.famille}
                  onChange={(e) => handleInputChange('famille', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="marque">Marque</Label>
                <Input
                  id="marque"
                  value={formData.marque}
                  onChange={(e) => handleInputChange('marque', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="modele">Modèle</Label>
                <Input
                  id="modele"
                  value={formData.modele}
                  onChange={(e) => handleInputChange('modele', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Unités et coefficients */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Unités et coefficients</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="uniteStock">Unité de stock *</Label>
                <Input
                  id="uniteStock"
                  value={formData.uniteStock}
                  onChange={(e) => handleInputChange('uniteStock', e.target.value)}
                  className={cn(errors.uniteStock && 'border-red-500')}
                />
                {errors.uniteStock && (
                  <p className="text-sm text-red-600 mt-1">{errors.uniteStock}</p>
                )}
              </div>

              <div>
                <Label htmlFor="uniteAchat">Unité d'achat</Label>
                <Input
                  id="uniteAchat"
                  value={formData.uniteAchat}
                  onChange={(e) => handleInputChange('uniteAchat', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="uniteVente">Unité de vente</Label>
                <Input
                  id="uniteVente"
                  value={formData.uniteVente}
                  onChange={(e) => handleInputChange('uniteVente', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coefficientAchat">Coefficient d'achat *</Label>
                <Input
                  id="coefficientAchat"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.coefficientAchat}
                  onChange={(e) => handleInputChange('coefficientAchat', e.target.value)}
                  className={cn(errors.coefficientAchat && 'border-red-500')}
                />
                {errors.coefficientAchat && (
                  <p className="text-sm text-red-600 mt-1">{errors.coefficientAchat}</p>
                )}
              </div>

              <div>
                <Label htmlFor="coefficientVente">Coefficient de vente *</Label>
                <Input
                  id="coefficientVente"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.coefficientVente}
                  onChange={(e) => handleInputChange('coefficientVente', e.target.value)}
                  className={cn(errors.coefficientVente && 'border-red-500')}
                />
                {errors.coefficientVente && (
                  <p className="text-sm text-red-600 mt-1">{errors.coefficientVente}</p>
                )}
              </div>
            </div>
          </div>

          {/* Gestion du stock */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Gestion du stock</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="gereEnStock"
                  checked={formData.gereEnStock}
                  onCheckedChange={(checked) => handleInputChange('gereEnStock', checked)}
                />
                <Label htmlFor="gereEnStock">Géré en stock</Label>
              </div>
            </div>

            {formData.gereEnStock && (
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="stockPhysique">Stock physique *</Label>
                  <Input
                    id="stockPhysique"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.stockPhysique}
                    onChange={(e) => handleInputChange('stockPhysique', e.target.value)}
                    className={cn(errors.stockPhysique && 'border-red-500')}
                  />
                  {errors.stockPhysique && (
                    <p className="text-sm text-red-600 mt-1">{errors.stockPhysique}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="stockMini">Stock minimum *</Label>
                  <Input
                    id="stockMini"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.stockMini}
                    onChange={(e) => handleInputChange('stockMini', e.target.value)}
                    className={cn(errors.stockMini && 'border-red-500')}
                  />
                  {errors.stockMini && (
                    <p className="text-sm text-red-600 mt-1">{errors.stockMini}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="stockMaxi">Stock maximum</Label>
                  <Input
                    id="stockMaxi"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.stockMaxi}
                    onChange={(e) => handleInputChange('stockMaxi', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="stockSecurite">Stock de sécurité</Label>
                  <Input
                    id="stockSecurite"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.stockSecurite}
                    onChange={(e) => handleInputChange('stockSecurite', e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="methodeValorisation">Méthode de valorisation</Label>
              <Select
                value={formData.methodeValorisation}
                onValueChange={(value) => handleInputChange('methodeValorisation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIFO">FIFO (Premier entré, premier sorti)</SelectItem>
                  <SelectItem value="LIFO">LIFO (Dernier entré, premier sorti)</SelectItem>
                  <SelectItem value="PMP">PMP (Prix moyen pondéré)</SelectItem>
                  <SelectItem value="STANDARD">Prix standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prix */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Prix et tarification</h3>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="prixAchatStandard">Prix d'achat standard</Label>
                <Input
                  id="prixAchatStandard"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.prixAchatStandard}
                  onChange={(e) => handleInputChange('prixAchatStandard', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="prixVenteHT">Prix de vente HT</Label>
                <Input
                  id="prixVenteHT"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.prixVenteHT}
                  onChange={(e) => handleInputChange('prixVenteHT', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="tauxTVA">Taux TVA (%)</Label>
                <Input
                  id="tauxTVA"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tauxTVA}
                  onChange={(e) => handleInputChange('tauxTVA', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="tauxMarge">Taux de marge (%)</Label>
                <Input
                  id="tauxMarge"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.tauxMarge}
                  onChange={(e) => handleInputChange('tauxMarge', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Approvisionnement */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Approvisionnement</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delaiApprovisionnement">Délai d'approvisionnement (jours)</Label>
                <Input
                  id="delaiApprovisionnement"
                  type="number"
                  min="0"
                  value={formData.delaiApprovisionnement}
                  onChange={(e) => handleInputChange('delaiApprovisionnement', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="quantiteMiniCommande">Quantité minimum de commande</Label>
                <Input
                  id="quantiteMiniCommande"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantiteMiniCommande}
                  onChange={(e) => handleInputChange('quantiteMiniCommande', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Caractéristiques physiques */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Caractéristiques physiques</h3>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="poids">Poids (kg)</Label>
                <Input
                  id="poids"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.poids}
                  onChange={(e) => handleInputChange('poids', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="longueur">Longueur (mm)</Label>
                <Input
                  id="longueur"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.longueur}
                  onChange={(e) => handleInputChange('longueur', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="largeur">Largeur (mm)</Label>
                <Input
                  id="largeur"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.largeur}
                  onChange={(e) => handleInputChange('largeur', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="hauteur">Hauteur (mm)</Label>
                <Input
                  id="hauteur"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hauteur}
                  onChange={(e) => handleInputChange('hauteur', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="couleur">Couleur</Label>
              <Input
                id="couleur"
                value={formData.couleur}
                onChange={(e) => handleInputChange('couleur', e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === 'create'
                  ? 'Création...'
                  : 'Modification...'
                : mode === 'create'
                  ? "Créer l'article"
                  : "Modifier l'article"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
