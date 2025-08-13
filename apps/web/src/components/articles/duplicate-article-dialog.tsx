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
  Textarea,
} from '@erp/ui'
import { Copy, Package2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Article, ArticleStatus, useDupliquerArticle } from '@/hooks/use-articles'
import { sanitizeInput } from '@/lib/security-utils'
import { cn } from '@/lib/utils'

interface DuplicateArticleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: Article | null
}

interface FormData {
  nouvelleReference: string
  designation: string
  description: string
  status: ArticleStatus
  famille: string
  marque: string
  modele: string
  gereEnStock: boolean
  stockPhysique: string
  stockMini: string
  prixVenteHT: string
}

const defaultFormData: FormData = {
  nouvelleReference: '',
  designation: '',
  description: '',
  status: ArticleStatus.ACTIF,
  famille: '',
  marque: '',
  modele: '',
  gereEnStock: true,
  stockPhysique: '0',
  stockMini: '0',
  prixVenteHT: '',
}

export function DuplicateArticleDialog({
  open,
  onOpenChange,
  article,
}: DuplicateArticleDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const dupliquerArticle = useDupliquerArticle()

  const isSubmitting = dupliquerArticle.isPending

  useEffect(() => {
    if (article && open) {
      // Générer une nouvelle référence suggérée
      const refSuggestion = `${article.reference}_COPY`

      setFormData({
        nouvelleReference: refSuggestion,
        designation: `${article.designation} (Copie)`,
        description: article.description || '',
        status: ArticleStatus.ACTIF,
        famille: article.famille || '',
        marque: article.marque || '',
        modele: article.modele || '',
        gereEnStock: article.gereEnStock,
        stockPhysique: '0', // Nouveau stock à zéro par défaut
        stockMini: String(article.stockMini || 0),
        prixVenteHT: String(article.prixVenteHT || ''),
      })
    } else {
      setFormData(defaultFormData)
    }
    setErrors({})
  }, [article, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nouvelleReference.trim()) {
      newErrors.nouvelleReference = 'La nouvelle référence est obligatoire'
    }

    if (!formData.designation.trim()) {
      newErrors.designation = 'La désignation est obligatoire'
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

    if (!article || !validateForm()) {
      return
    }

    const modifications = {
      designation: sanitizeInput(formData.designation),
      description: sanitizeInput(formData.description) || undefined,
      status: formData.status,
      famille: sanitizeInput(formData.famille) || undefined,
      marque: sanitizeInput(formData.marque) || undefined,
      modele: sanitizeInput(formData.modele) || undefined,
      gereEnStock: formData.gereEnStock,
      stockPhysique: formData.gereEnStock ? parseFloat(formData.stockPhysique) || 0 : undefined,
      stockMini: formData.gereEnStock ? parseFloat(formData.stockMini) || 0 : undefined,
      prixVenteHT: formData.prixVenteHT ? parseFloat(formData.prixVenteHT) : undefined,
    }

    try {
      await dupliquerArticle.mutateAsync({
        id: article.id,
        nouvelleReference: sanitizeInput(formData.nouvelleReference),
        modifications,
      })
      onOpenChange(false)
    } catch (_error) {}
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const statusLabels = {
    [ArticleStatus.ACTIF]: 'Actif',
    [ArticleStatus.INACTIF]: 'Inactif',
    [ArticleStatus.OBSOLETE]: 'Obsolète',
    [ArticleStatus.EN_ATTENTE]: 'En attente',
  }

  if (!article) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Dupliquer l'article {article.reference}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Article source */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Package2 className="h-4 w-4" />
              Article source
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Référence:</span> {article.reference}
              </div>
              <div>
                <span className="font-medium">Type:</span> {article.type}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Désignation:</span> {article.designation}
              </div>
            </div>
          </div>

          {/* Formulaire de duplication */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Nouvel article</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nouvelleReference">Nouvelle référence *</Label>
                  <Input
                    id="nouvelleReference"
                    value={formData.nouvelleReference}
                    onChange={(e) => handleInputChange('nouvelleReference', e.target.value)}
                    className={cn(errors.nouvelleReference && 'border-red-500')}
                  />
                  {errors.nouvelleReference && (
                    <p className="text-sm text-red-600 mt-1">{errors.nouvelleReference}</p>
                  )}
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

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
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

            {/* Configuration du stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuration du stock</h3>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="gereEnStock"
                  checked={formData.gereEnStock}
                  onChange={(e) => handleInputChange('gereEnStock', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="gereEnStock">Gérer en stock</Label>
              </div>

              {formData.gereEnStock && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stockPhysique">Stock initial</Label>
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
                    <p className="text-sm text-muted-foreground mt-1">
                      Stock physique du nouvel article
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="stockMini">Stock minimum</Label>
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
                </div>
              )}
            </div>

            {/* Prix */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tarification</h3>

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
                <p className="text-sm text-muted-foreground mt-1">
                  Laissez vide pour conserver le prix de l'article source
                </p>
              </div>
            </div>

            {/* Éléments qui seront copiés */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Éléments copiés automatiquement</h4>
              <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                <div>• Type d'article</div>
                <div>• Unités (stock, achat, vente)</div>
                <div>• Coefficients</div>
                <div>• Méthode de valorisation</div>
                <div>• Caractéristiques techniques</div>
                <div>• Informations logistiques</div>
                <div>• Comptes comptables</div>
                <div>• Configuration fournisseur</div>
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
                {isSubmitting ? 'Duplication...' : "Dupliquer l'article"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
