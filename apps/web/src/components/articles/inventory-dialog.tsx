'use client'

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  useFormFieldIds,
} from '@erp/ui'
import { AlertCircle, Package2, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Article, useEffectuerInventaire } from '@/hooks/use-articles'
import { sanitizeInput } from '@/lib/security-utils'
import { cn, formatCurrency } from '@/lib/utils'

interface InventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: Article | null
}

interface FormData {
  stockPhysiqueReel: string
  commentaire: string
}

const defaultFormData: FormData = {
  stockPhysiqueReel: '',
  commentaire: '',
}

export function InventoryDialog({ open, onOpenChange, article }: InventoryDialogProps) {
  const ids = useFormFieldIds(['stockPhysiqueReel', 'commentaire'])
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const effectuerInventaire = useEffectuerInventaire()

  const isSubmitting = effectuerInventaire?.isPending

  useEffect(() => {
    if (article && open) {
      setFormData({
        stockPhysiqueReel: String(article.stockPhysique ?? 0),
        commentaire: '',
      })
    } else {
      setFormData(defaultFormData)
    }
    setErrors({})
  }, [article, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    const stockReel = parseFloat(formData.stockPhysiqueReel)
    if (Number.isNaN(stockReel) || stockReel < 0) {
      newErrors.stockPhysiqueReel = 'Le stock réel doit être un nombre positif ou nul'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    if (!article || !validateForm()) {
      return
    }

    try {
      await effectuerInventaire?.mutateAsync({
        id: article.id,
        stockPhysiqueReel: parseFloat(formData.stockPhysiqueReel),
        commentaire: sanitizeInput(formData.commentaire) || undefined,
      })
      onOpenChange(false)
    } catch (_error) {}
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  if (!article) {
    return null
  }

  const stockActuel = article.stockPhysique ?? 0
  const stockReel = parseFloat(formData.stockPhysiqueReel) || 0
  const ecart = stockReel - stockActuel
  const ecartPourcentage = stockActuel > 0 ? (ecart / stockActuel) * 100 : 0

  const valeurActuelle = stockActuel * ((article.prixAchatStandard || article.prixVenteHT) ?? 0)
  const valeurReelle = stockReel * ((article.prixAchatStandard || article.prixVenteHT) ?? 0)
  const ecartValeur = valeurReelle - valeurActuelle

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Inventaire - {article.reference}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations article */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{article.designation}</h3>
              <Badge variant="outline">{article.type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Famille:</span> {article.famille || '-'}
              </div>
              <div>
                <span className="font-medium">Unité:</span> {article.uniteStock}
              </div>
            </div>
          </div>

          {/* État actuel du stock */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{stockActuel}</div>
              <div className="text-sm text-muted-foreground">Stock actuel</div>
              <div className="text-xs text-muted-foreground">{article.uniteStock}</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stockReel}</div>
              <div className="text-sm text-muted-foreground">Stock réel</div>
              <div className="text-xs text-muted-foreground">{article.uniteStock}</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div
                className={cn(
                  'text-2xl font-bold',
                  ecart > 0 ? 'text-green-600' : ecart < 0 ? 'text-red-600' : 'text-gray-600'
                )}
              >
                {ecart > 0 ? '+' : ''}
                {ecart}
              </div>
              <div className="text-sm text-muted-foreground">Écart</div>
              <div className="text-xs text-muted-foreground">
                {ecartPourcentage > 0 ? '+' : ''}
                {ecartPourcentage?.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Impact financier */}
          {(article.prixAchatStandard || article.prixVenteHT) && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Impact financier
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Valeur actuelle</div>
                  <div>{formatCurrency(valeurActuelle)}</div>
                </div>
                <div>
                  <div className="font-medium">Valeur réelle</div>
                  <div>{formatCurrency(valeurReelle)}</div>
                </div>
                <div>
                  <div className="font-medium">Écart de valeur</div>
                  <div
                    className={cn(
                      ecartValeur > 0
                        ? 'text-green-600'
                        : ecartValeur < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    )}
                  >
                    {ecartValeur > 0 ? '+' : ''}
                    {formatCurrency(ecartValeur)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alertes */}
          {stockReel <= (article.stockMini ?? 0) && stockReel > 0 && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Attention: Stock sous le minimum</span>
              </div>
              <div className="text-sm text-orange-700 mt-1">
                Le stock réel ({stockReel} {article.uniteStock}) est inférieur au stock minimum (
                {article.stockMini} {article.uniteStock})
              </div>
            </div>
          )}

          {stockReel === 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Rupture de stock</span>
              </div>
              <div className="text-sm text-red-700 mt-1">
                L'article sera en rupture de stock après cet inventaire
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor={ids.stockPhysiqueReel}>Stock physique réel *</Label>
              <Input
                id={ids.stockPhysiqueReel}
                type="number"
                min="0"
                step="0.01"
                value={formData.stockPhysiqueReel}
                onChange={(e) => handleInputChange('stockPhysiqueReel', e?.target?.value)}
                className={cn(errors.stockPhysiqueReel && 'border-red-500')}
              />
              {errors.stockPhysiqueReel && (
                <p className="text-sm text-red-600 mt-1">{errors.stockPhysiqueReel}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Saisissez la quantité réellement comptée en stock
              </p>
            </div>

            <div>
              <Label htmlFor={ids.commentaire}>Commentaire</Label>
              <Textarea
                id={ids.commentaire}
                value={formData.commentaire}
                onChange={(e) => handleInputChange('commentaire', e?.target?.value)}
                placeholder="Observations, raisons de l'écart..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : "Confirmer l'inventaire"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
