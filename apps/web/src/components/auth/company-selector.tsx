'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Building2, Check, Loader2, AlertTriangle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'
import { getApproximateTabCount } from '@/lib/tab-detection'

interface Company {
  id: string
  nom: string
  code: string
  role: string
  isDefault: boolean
  permissions: string[]
  sites: any[]
}

interface CompanySelectorProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCompanySelected?: () => void
  showInDialog?: boolean
}

export default function CompanySelector({
  open = true,
  onOpenChange,
  onCompanySelected,
  showInDialog = true,
}: CompanySelectorProps) {
  const router = useRouter()
  const { user, refreshAuth, logout, selectCompany } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tabCount, setTabCount] = useState(1)

  useEffect(() => {
    loadCompanies()
    
    // Détecter le nombre d'onglets ouverts
    const count = getApproximateTabCount()
    setTabCount(count)
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const data = await authService.getUserCompanies()
      setCompanies(data)
      
      // Sélectionner automatiquement la société par défaut s'il y en a une
      const defaultCompany = data.find(c => c.isDefault)
      if (defaultCompany) {
        setSelectedCompanyId(defaultCompany.id)
        setSaveAsDefault(true)
      } else if (data.length === 1) {
        // Si une seule société, la sélectionner automatiquement
        setSelectedCompanyId(data[0].id)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sociétés:', error)
      toast.error('Impossible de charger les sociétés disponibles')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCompany = async () => {
    if (!selectedCompanyId) {
      toast.error('Veuillez sélectionner une société')
      return
    }

    try {
      setSubmitting(true)
      
      // Trouver la société sélectionnée
      const selectedCompany = companies.find(c => c.id === selectedCompanyId)
      if (!selectedCompany) {
        throw new Error('Société non trouvée')
      }
      
      // Utiliser la fonction selectCompany du hook qui met à jour l'état correctement
      await selectCompany({
        id: selectedCompany.id,
        nom: selectedCompany.nom,
        code: selectedCompany.code,
        status: 'active',
        plan: 'standard'
      })
      
      // Attendre une petite pause pour s'assurer que les tokens sont synchronisés
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Sauvegarder la préférence si demandé
      if (saveAsDefault) {
        try {
          await authService.setDefaultCompany(selectedCompanyId)
        } catch (error) {
          // Ne pas bloquer si l'appel échoue
          console.warn('Impossible de définir la société par défaut:', error)
        }
      }
      
      toast.success(`Connecté à ${selectedCompany.nom}`)
      
      // Attendre un peu pour s'assurer que les tokens sont stockés avant de rediriger
      setTimeout(() => {
        const storedTokens = localStorage.getItem('topsteel-tokens')
        
        if (storedTokens) {
          window.location.href = '/dashboard'
        } else {
          toast.error('Erreur de synchronisation, veuillez vous reconnecter')
        }
      }, 500)
    } catch (error) {
      console.error('Erreur lors de la connexion à la société:', error)
      toast.error('Impossible de se connecter à cette société')
    } finally {
      setSubmitting(false)
    }
  }

  const content = (
    <div className="space-y-3">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className="bg-primary/10 p-3 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium text-sm">Chargement des sociétés...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <div className="bg-muted/50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-sm">Aucune société disponible</h3>
            <p className="text-muted-foreground text-xs">
              Contactez votre administrateur pour obtenir les accès nécessaires.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => logout()}
            className="mx-auto hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            🚪 Se déconnecter
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {companies.map((company) => (
              <Card
                key={company.id}
                className={`group relative p-3 cursor-pointer transition-all duration-200 border-2 ${
                  selectedCompanyId === company.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:shadow-lg hover:bg-accent/50'
                }`}
                onClick={() => setSelectedCompanyId(company.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded-lg transition-colors ${
                      selectedCompanyId === company.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }`}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-semibold transition-colors truncate ${
                          selectedCompanyId === company.id 
                            ? 'text-primary' 
                            : 'text-foreground group-hover:text-primary'
                        }`}>
                          {company.nom}
                        </h4>
                        {selectedCompanyId === company.id && (
                          <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-sm">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors mb-2">
                        <span className="font-medium">Code:</span> {company.code} • 
                        <span className="font-medium ml-1">Rôle:</span> {company.role}
                      </p>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-xs transition-all ${
                          selectedCompanyId === company.id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-green-50 text-green-600 group-hover:bg-green-100 group-hover:text-green-700'
                        }`}>
                          ✓ ACTIF
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-xs transition-all ${
                          company.permissions.includes('*')
                            ? selectedCompanyId === company.id
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:text-amber-700'
                            : selectedCompanyId === company.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                        }`}>
                          {company.permissions.includes('*') ? '👑 Admin' : '👤 Utilisateur'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Effet de hover subtil */}
                <div className={`absolute inset-0 rounded-lg transition-all duration-200 pointer-events-none ${
                  selectedCompanyId === company.id
                    ? 'bg-gradient-to-r from-primary/5 to-transparent'
                    : 'bg-gradient-to-r from-transparent to-transparent group-hover:from-primary/5 group-hover:to-transparent'
                }`} />
              </Card>
            ))}
          </div>

          {/* Avertissement multi-onglets optimisé */}
          {tabCount > 1 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="bg-amber-100 rounded-full p-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                </div>
                <div className="text-xs flex-1">
                  <p className="font-medium text-amber-900">
                    🔄 Changement sur {tabCount} onglet{tabCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-amber-700 mt-0.5">
                    Affectera tous les onglets ouverts ({tabCount} détecté{tabCount > 1 ? 's' : ''}).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Checkbox optimisé */}
          <div className="flex items-center space-x-2 py-2 px-3 bg-muted/30 rounded-lg border">
            <Checkbox
              id="saveAsDefault"
              checked={saveAsDefault}
              onCheckedChange={(checked) => setSaveAsDefault(checked as boolean)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="saveAsDefault"
              className="text-xs font-medium text-foreground cursor-pointer select-none"
            >
              💾 Définir comme société par défaut
            </label>
          </div>

          {/* Actions optimisées */}
          <div className="flex justify-between items-center pt-3 border-t">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCompanies}
                disabled={loading || submitting}
                className="hover:bg-muted transition-colors text-xs h-8"
              >
                🔄 Actualiser
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                disabled={submitting}
                className="hover:bg-destructive/10 hover:text-destructive transition-colors text-xs h-8"
              >
                🚪 Se déconnecter
              </Button>
            </div>
            <div className="flex space-x-2">
              {onOpenChange && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                  className="hover:bg-muted transition-colors text-xs h-8"
                >
                  Annuler
                </Button>
              )}
              <Button
                onClick={handleSelectCompany}
                disabled={!selectedCompanyId || submitting}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 min-w-[100px] h-8"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    <span className="text-xs">Connexion...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="mr-1 h-3 w-3" />
                    <span className="text-xs">Se connecter</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (!showInDialog) {
    return content
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-3 border-b flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2 text-lg font-semibold">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <span>Sélectionner une société</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Choisissez la société sur laquelle vous souhaitez travailler.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-3 px-1">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}