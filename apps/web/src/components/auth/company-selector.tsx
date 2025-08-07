'use client'

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@erp/ui/primitives'
import { AlertTriangle, Building2, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n/hooks'
import { getApproximateTabCount } from '@/lib/tab-detection'
import { authService } from '@/services/auth-service'
import { callClientApi } from '@/utils/backend-api'

// Interface pour les données de rôle
interface RoleData {
  key: string
  value: string
  icon?: string
  color?: string
  order?: number
  permissions?: string[]
  category?: string
  translationKey?: string
}

// Cache pour les rôles avec persistance sessionStorage
const ROLES_CACHE_KEY = 'topsteel-roles-cache'
const ROLES_CACHE_EXPIRY_KEY = 'topsteel-roles-cache-expiry'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

let rolesCache: RoleData[] | null = null

// Fonction pour charger le cache depuis sessionStorage
const loadCacheFromStorage = (): RoleData[] | null => {
  if (typeof window === 'undefined') return null

  try {
    const cached = sessionStorage.getItem(ROLES_CACHE_KEY)
    const expiry = sessionStorage.getItem(ROLES_CACHE_EXPIRY_KEY)

    if (cached && expiry && Date.now() < parseInt(expiry)) {
      return JSON.parse(cached)
    }
  } catch {}

  return null
}

// Fonction pour sauvegarder le cache dans sessionStorage
const saveCacheToStorage = (roles: RoleData[]) => {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(ROLES_CACHE_KEY, JSON.stringify(roles))
    sessionStorage.setItem(ROLES_CACHE_EXPIRY_KEY, (Date.now() + CACHE_TTL).toString())
  } catch {}
}

// Fonction pour charger les rôles depuis l'API des paramètres
const loadRolesFromParameters = async (
  language: string = 'fr',
  forceReload: boolean = false
): Promise<RoleData[]> => {
  // Vérifier d'abord le cache en mémoire
  if (rolesCache && !forceReload) return rolesCache

  // Puis le cache sessionStorage
  if (!forceReload) {
    const cachedRoles = loadCacheFromStorage()
    if (cachedRoles) {
      rolesCache = cachedRoles
      return cachedRoles
    }
  }

  try {
    const response = await callClientApi(`parameters/system/user_roles?language=${language}`)
    if (response.ok) {
      const data = await response.json()

      // Vérifier la structure de la réponse
      let rolesList = []

      if (Array.isArray(data)) {
        // Réponse directe en tableau
        rolesList = data
      } else if (data.data && Array.isArray(data.data)) {
        // Réponse avec data wrapper (cas de l'API backend)
        rolesList = data.data
      } else if (data.success && Array.isArray(data.roles)) {
        // Autre format possible
        rolesList = data.roles
      } else if (typeof data === 'object' && data !== null) {
        // Si c'est un objet, vérifier s'il contient des rôles
        const possibleArrays = Object.values(data).filter(Array.isArray)
        if (possibleArrays.length > 0) {
          rolesList = possibleArrays[0] as any[]
        }
      }

      if (!Array.isArray(rolesList) || rolesList.length === 0) {
        // Si la réponse semble être des rôles par défaut de la route Next.js (array direct)
        if (Array.isArray(data) && data.some((item) => item.id && item.name)) {
          rolesList = data.map((role: any) => ({
            key: role.id,
            value: role.name,
            icon: '👤',
            color: 'blue',
            order: 999,
            description: role.description,
          }))
        } else {
          // Utiliser des rôles hardcodés en dernier recours
          rolesList = [
            { key: 'ADMIN', value: 'Administrateur', icon: '🔧', color: 'orange', order: 1 },
            { key: 'USER', value: 'Utilisateur', icon: '👤', color: 'blue', order: 2 },
          ]
        }
      }

      // Mapper les données du backend vers le format attendu
      rolesCache = rolesList.map((role: any) => ({
        key: role.key || role.id || 'UNKNOWN',
        value: role.value || role.name || role.label || 'Rôle',
        icon: role.icon || '👤',
        color: role.color || 'blue',
        order: role.order || 999,
        permissions: role.permissions || [],
        category: role.category || 'standard',
        translationKey: role.translationKey || null,
      }))

      // Sauvegarder en cache
      saveCacheToStorage(rolesCache)
      return rolesCache
    }
  } catch {}

  // Fallback sur les rôles hardcodés si l'API échoue
  return getFallbackRoles(language)
}

// Fonction pour obtenir la traduction d'un rôle
const getRoleTranslation = (roleKey: string, translator: (key: string) => string): string => {
  const roleMap: Record<string, string> = {
    OWNER: translator('roles.owner'),
    SUPER_ADMIN: translator('roles.super_admin'),
    ADMIN: translator('roles.admin'),
    MANAGER: translator('roles.manager'),
    COMMERCIAL: translator('roles.commercial'),
    TECHNICIEN: translator('roles.technician'),
    COMPTABLE: translator('roles.accountant'),
    OPERATEUR: translator('roles.operator'),
    USER: translator('roles.user'),
    VIEWER: translator('roles.viewer'),
    GUEST: translator('roles.guest'),
  }
  return roleMap[roleKey] || roleKey
}

// Rôles de fallback (cas où l'API des paramètres n'est pas disponible)
const getFallbackRoles = (language: string = 'fr'): RoleData[] => {
  // Créer un translator simple pour le fallback
  const fallbackTranslator = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'roles.owner': {
        fr: 'Propriétaire',
        en: 'Owner',
        es: 'Propietario',
      },
      'roles.super_admin': {
        fr: 'Super Administrateur',
        en: 'Super Administrator',
        es: 'Super Administrador',
      },
      'roles.admin': { fr: 'Administrateur', en: 'Administrator', es: 'Administrador' },
      'roles.manager': { fr: 'Manager', en: 'Manager', es: 'Gerente' },
      'roles.commercial': { fr: 'Commercial', en: 'Sales Representative', es: 'Comercial' },
      'roles.technician': { fr: 'Technicien', en: 'Technician', es: 'Técnico' },
      'roles.accountant': { fr: 'Comptable', en: 'Accountant', es: 'Contador' },
      'roles.operator': { fr: 'Opérateur', en: 'Operator', es: 'Operador' },
      'roles.user': { fr: 'Utilisateur', en: 'User', es: 'Usuario' },
      'roles.viewer': { fr: 'Observateur', en: 'Viewer', es: 'Observador' },
      'roles.guest': { fr: 'Invité', en: 'Guest', es: 'Invitado' },
    }
    return translations[key]?.[language] || key
  }

  return [
    {
      key: 'OWNER',
      value: fallbackTranslator('roles.owner'),
      icon: '🏛️',
      color: 'destructive',
      order: 1,
    },
    {
      key: 'SUPER_ADMIN',
      value: fallbackTranslator('roles.super_admin'),
      icon: '👑',
      color: 'destructive',
      order: 2,
    },
    {
      key: 'ADMIN',
      value: fallbackTranslator('roles.admin'),
      icon: '🔧',
      color: 'orange',
      order: 3,
    },
    {
      key: 'MANAGER',
      value: fallbackTranslator('roles.manager'),
      icon: '📋',
      color: 'purple',
      order: 4,
    },
    {
      key: 'COMMERCIAL',
      value: fallbackTranslator('roles.commercial'),
      icon: '💼',
      color: 'green',
      order: 5,
    },
    {
      key: 'TECHNICIEN',
      value: fallbackTranslator('roles.technician'),
      icon: '🔨',
      color: 'yellow',
      order: 6,
    },
    {
      key: 'COMPTABLE',
      value: fallbackTranslator('roles.accountant'),
      icon: '💰',
      color: 'cyan',
      order: 7,
    },
    {
      key: 'OPERATEUR',
      value: fallbackTranslator('roles.operator'),
      icon: '⚙️',
      color: 'blue',
      order: 8,
    },
    { key: 'USER', value: fallbackTranslator('roles.user'), icon: '👤', color: 'blue', order: 9 },
    {
      key: 'VIEWER',
      value: fallbackTranslator('roles.viewer'),
      icon: '👁️',
      color: 'gray',
      order: 10,
    },
    {
      key: 'GUEST',
      value: fallbackTranslator('roles.guest'),
      icon: '👥',
      color: 'gray',
      order: 11,
    },
  ]
}

// Fonction pour récupérer les données d'un rôle
const getRoleData = async (roleKey: string, language: string = 'fr'): Promise<RoleData | null> => {
  const roles = await loadRolesFromParameters(language)
  return roles.find((role) => role.key === roleKey) || null
}

// Utilitaires pour l'affichage des rôles (maintenant basés sur les paramètres)
const _getRoleDisplay = async (role: string, language: string = 'fr') => {
  const roleData = await getRoleData(role, language)
  if (roleData) {
    return `${roleData.icon || '👤'} ${roleData.value}`
  }
  return `👤 ${role}`
}

const _getRoleStyle = async (role: string, isSelected: boolean, language: string = 'fr') => {
  const roleData = await getRoleData(role, language)
  const color = roleData?.color || 'blue'

  // Mappage des couleurs vers les classes Tailwind
  const colorMap: Record<string, { selected: string; hover: string }> = {
    destructive: {
      selected: 'bg-destructive/20 text-destructive border-destructive/30',
      hover:
        'bg-destructive/10 text-destructive/80 group-hover:bg-destructive/20 group-hover:text-destructive',
    },
    orange: {
      selected: 'bg-orange-100 text-orange-700 border-orange-200',
      hover: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100 group-hover:text-orange-700',
    },
    purple: {
      selected: 'bg-purple-100 text-purple-700 border-purple-200',
      hover: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700',
    },
    green: {
      selected: 'bg-green-100 text-green-700 border-green-200',
      hover: 'bg-green-50 text-green-600 group-hover:bg-green-100 group-hover:text-green-700',
    },
    yellow: {
      selected: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      hover: 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100 group-hover:text-yellow-700',
    },
    cyan: {
      selected: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      hover: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 group-hover:text-cyan-700',
    },
    blue: {
      selected: 'bg-blue-100 text-blue-700 border-blue-200',
      hover: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700',
    },
    gray: {
      selected: 'bg-gray-100 text-gray-700 border-gray-200',
      hover: 'bg-gray-50 text-gray-600 group-hover:bg-gray-100 group-hover:text-gray-700',
    },
  }

  const colorClasses = colorMap[color] || colorMap.blue
  return isSelected ? colorClasses.selected : colorClasses.hover
}

// Versions synchrones pour l'affichage immédiat (utilise le cache ou fallback)
const getRoleDisplaySync = (role: string, translator: (key: string) => string): string => {
  if (rolesCache) {
    const roleData = rolesCache.find((r) => r.key === role)
    if (roleData) {
      // Si on a une clé de traduction, utiliser le système i18n, sinon utiliser la valeur
      const displayName = roleData.translationKey
        ? translator(roleData.translationKey)
        : roleData.value
      return `${roleData.icon || '👤'} ${displayName}`
    }
  }

  // Fallback immédiat avec traduction
  const fallbackRoles = getFallbackRoles()
  const roleData = fallbackRoles.find((r) => r.key === role)
  return roleData ? `${roleData.icon} ${getRoleTranslation(role, translator)}` : `👤 ${role}`
}

const getRoleStyleSync = (role: string, isSelected: boolean): string => {
  let color = 'blue'

  if (rolesCache) {
    const roleData = rolesCache.find((r) => r.key === role)
    color = roleData?.color || 'blue'
  } else {
    // Fallback immédiat
    const fallbackRoles = getFallbackRoles()
    const roleData = fallbackRoles.find((r) => r.key === role)
    color = roleData?.color || 'blue'
  }

  const colorMap: Record<string, { selected: string; hover: string }> = {
    destructive: {
      selected: 'bg-destructive/20 text-destructive border-destructive/30',
      hover:
        'bg-destructive/10 text-destructive/80 group-hover:bg-destructive/20 group-hover:text-destructive',
    },
    orange: {
      selected: 'bg-orange-100 text-orange-700 border-orange-200',
      hover: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100 group-hover:text-orange-700',
    },
    purple: {
      selected: 'bg-purple-100 text-purple-700 border-purple-200',
      hover: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700',
    },
    green: {
      selected: 'bg-green-100 text-green-700 border-green-200',
      hover: 'bg-green-50 text-green-600 group-hover:bg-green-100 group-hover:text-green-700',
    },
    yellow: {
      selected: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      hover: 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100 group-hover:text-yellow-700',
    },
    cyan: {
      selected: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      hover: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 group-hover:text-cyan-700',
    },
    blue: {
      selected: 'bg-blue-100 text-blue-700 border-blue-200',
      hover: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700',
    },
    gray: {
      selected: 'bg-gray-100 text-gray-700 border-gray-200',
      hover: 'bg-gray-50 text-gray-600 group-hover:bg-gray-100 group-hover:text-gray-700',
    },
  }

  const colorClasses = colorMap[color] || colorMap.blue
  return isSelected ? colorClasses.selected : colorClasses.hover
}

interface Company {
  id: string
  nom: string
  code: string
  role?: string
  isDefault?: boolean
  permissions?: string[]
  sites?: any[]
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
  const _router = useRouter()
  const { user, logout, selectCompany } = useAuth()
  const { t } = useTranslation()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tabCount, setTabCount] = useState(1)

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true)
      const data = await authService.getUserCompanies()

      // S'assurer que data est un tableau
      let companiesArray: Company[] = []
      if (Array.isArray(data)) {
        companiesArray = data
      } else if (data && typeof data === 'object') {
        // Si les données sont dans une propriété (ex: data.data, data.companies, etc.)
        const dataObj = data as any
        companiesArray = dataObj.data || dataObj.companies || dataObj.societes || []
      }

      setCompanies(companiesArray)

      // Sélectionner automatiquement la société par défaut s'il y en a une
      const defaultCompany = companiesArray.find((c) => c.isDefault === true)

      if (defaultCompany) {
        setSelectedCompanyId(defaultCompany.id)
        setSaveAsDefault(true)
      } else if (companiesArray.length === 1) {
        setSelectedCompanyId(companiesArray[0].id)
      } else {
      }
    } catch {
      toast.error(t('companies.loadingError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadCompanies()

    // Détecter le nombre d'onglets ouverts
    const count = getApproximateTabCount()
    setTabCount(count)

    // Précharger les rôles depuis l'API des paramètres
    // Ne plus vider le cache systématiquement, utiliser le cache persistant
    loadRolesFromParameters('fr', false).catch((_error) => {})
  }, [loadCompanies])

  const handleSelectCompany = async () => {
    if (!selectedCompanyId) {
      toast.error(t('companies.select'))
      return
    }

    try {
      setSubmitting(true)

      // Trouver la société sélectionnée
      const selectedCompany = companies.find((c) => c.id === selectedCompanyId)
      if (!selectedCompany) {
        throw new Error(t('companies.notFound'))
      }

      // Utiliser la fonction selectCompany du hook qui met à jour l'état correctement
      await selectCompany({
        id: selectedCompany.id,
        nom: selectedCompany.nom,
        name: selectedCompany.nom, // Add name property
        code: selectedCompany.code,
        status: 'active',
        plan: 'standard',
        isActive: true, // Add isActive property
      })

      // Attendre une petite pause pour s'assurer que les tokens sont synchronisés
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Sauvegarder la préférence si demandé
      if (saveAsDefault) {
        try {
          await authService.setDefaultCompany(selectedCompanyId)
        } catch {}
      }

      toast.success(t('companies.connectedTo', { name: selectedCompany.nom }))

      // Attendre un peu pour s'assurer que les tokens sont stockés avant de rediriger
      let attempts = 0
      const maxAttempts = 15 // Augmenter le nombre de tentatives
      const checkTokensAndRedirect = () => {
        const storedTokens =
          localStorage.getItem('topsteel_auth_tokens') ||
          sessionStorage.getItem('topsteel_auth_tokens')

        if (storedTokens) {
          try {
            const session = JSON.parse(storedTokens)
            // Vérifier que la session contient des tokens et qu'ils ne sont pas expirés
            if (session.tokens?.expiresAt && session.tokens.expiresAt > Date.now()) {
              window.location.href = '/dashboard'
              return
            }
          } catch {}
        }

        attempts++

        if (attempts < maxAttempts) {
          setTimeout(checkTokensAndRedirect, 300) // Augmenter le délai entre les tentatives
        } else {
          // Vérifier une dernière fois si l'utilisateur est toujours connecté avant d'afficher l'erreur
          if (user?.id) {
            window.location.href = '/dashboard'
          } else {
            toast.error(t('companies.syncError'))
          }
        }
      }

      setTimeout(checkTokensAndRedirect, 300)
    } catch {
      toast.error(t('companies.cannotConnect'))
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
          <p className="text-muted-foreground font-medium text-sm">{t('companies.loading')}</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <div className="bg-muted/50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-sm">{t('companies.none')}</h3>
            <p className="text-muted-foreground text-xs">{t('companies.contactAdmin')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="mx-auto hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            {t('actions.disconnect')}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {companies.map((company) => (
              <button
                key={company.id}
                type="button"
                className={`group relative p-3 cursor-pointer transition-all duration-200 border-2 rounded-lg text-left w-full ${
                  selectedCompanyId === company.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:shadow-lg hover:bg-accent/50'
                }`}
                onClick={() => setSelectedCompanyId(company.id)}
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') && setSelectedCompanyId(company.id)
                }
                tabIndex={0}
                aria-label={`Select company ${company.name}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        selectedCompanyId === company.id
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                      }`}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 max-w-full">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`text-sm font-semibold transition-colors truncate pr-2 ${
                            selectedCompanyId === company.id
                              ? 'text-primary'
                              : 'text-foreground group-hover:text-primary'
                          }`}
                        >
                          {company.nom}
                        </h4>
                        {selectedCompanyId === company.id && (
                          <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-sm flex-shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors mb-2">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-medium">{t('companies.code')}:</span>
                          <span className="truncate">{company.code}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{t('companies.role')}:</span>
                          <span className="truncate">{company.role || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-xs transition-all flex-shrink-0 border ${
                            selectedCompanyId === company.id
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-green-50 text-green-600 border-green-100 group-hover:bg-green-100 group-hover:text-green-700 group-hover:border-green-200'
                          }`}
                        >
                          {t('companies.active')}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-xs transition-all flex-shrink-0 border max-w-[150px] ${getRoleStyleSync(
                            company.role || 'USER',
                            selectedCompanyId === company.id
                          )}`}
                        >
                          <span className="truncate">
                            {getRoleDisplaySync(company.role || 'USER', t)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Effet de hover subtil */}
                <div
                  className={`absolute inset-0 rounded-lg transition-all duration-200 pointer-events-none ${
                    selectedCompanyId === company.id
                      ? 'bg-gradient-to-r from-primary/5 to-transparent'
                      : 'bg-gradient-to-r from-transparent to-transparent group-hover:from-primary/5 group-hover:to-transparent'
                  }`}
                />
              </button>
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
                    {t('companies.changeAffects', { count: tabCount })}
                  </p>
                  <p className="text-amber-700 mt-0.5">
                    {t('companies.changeAffectsMultiple', { count: tabCount })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Checkbox optimisé */}
          <div className="flex items-center space-x-2 py-2 px-3 bg-muted/30 rounded-lg border">
            <Checkbox
              id="save-as-default"
              checked={saveAsDefault}
              onCheckedChange={(checked) => setSaveAsDefault(checked as boolean)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="save-as-default"
              className="text-xs font-medium text-foreground cursor-pointer select-none"
            >
              {t('companies.setAsDefault')}
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
                {t('actions.refresh')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                disabled={submitting}
                className="hover:bg-destructive/10 hover:text-destructive transition-colors text-xs h-8"
              >
                {t('actions.disconnect')}
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
                  {t('common.cancel')}
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
                    <span className="text-xs">{t('actions.connecting')}</span>
                  </>
                ) : (
                  <>
                    <Building2 className="mr-1 h-3 w-3" />
                    <span className="text-xs">{t('actions.connect')}</span>
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
    return <div className="bg-card border border-border rounded-lg p-6 shadow-lg">{content}</div>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-card border border-border shadow-xl">
        <DialogHeader className="pb-3 border-b flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2 text-lg font-semibold">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <span>{t('companies.select')}</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            {t('companies.chooseSociety')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-3 px-1">{content}</div>
      </DialogContent>
    </Dialog>
  )
}
