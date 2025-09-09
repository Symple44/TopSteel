'use client'

import { Badge, Card, CardContent, CardHeader, CardTitle, Label, Separator } from '@erp/ui'
import {
  Button,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@erp/ui'
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  Info,
  Settings,
  Shield,
  Users,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Group, MenuItem, Permission, Role } from '@/types/menu'

interface MenuItemRightsEditorProps {
  item: MenuItem
  availableGroups: Group[]
  availableRoles: Role[]
  availablePermissions: Permission[]
  parentItem?: MenuItem
  onUpdate: (item: MenuItem) => void
  className?: string
}

export function MenuItemRightsEditor({
  item,
  availableGroups,
  availableRoles,
  availablePermissions,
  parentItem,
  onUpdate,
  className,
}: MenuItemRightsEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [_previewMode, _setPreviewMode] = useState<'simple' | 'advanced'>('simple')
  const [selectedPreviewGroup, setSelectedPreviewGroup] = useState<string>('')

  // États locaux pour les droits
  const [isPublic, setIsPublic] = useState(item.isPublic ?? false)
  const [inheritFromParent, setInheritFromParent] = useState(item.inheritFromParent ?? true)
  const [allowedGroups, setAllowedGroups] = useState<string[]>(item.allowedGroups ?? [])
  const [requiredRoles, setRequiredRoles] = useState<string[]>(item.requiredRoles ?? [])
  const [requiredPermissions, setRequiredPermissions] = useState<string[]>(
    item.requiredPermissions ?? []
  )

  // Mettre à jour l'item parent quand les droits changent
  useEffect(() => {
    const updatedItem = {
      ...item,
      isPublic,
      inheritFromParent,
      allowedGroups: allowedGroups.length > 0 ? allowedGroups : undefined,
      requiredRoles: requiredRoles.length > 0 ? requiredRoles : undefined,
      requiredPermissions: requiredPermissions.length > 0 ? requiredPermissions : undefined,
    }
    onUpdate(updatedItem)
  }, [
    isPublic,
    inheritFromParent,
    allowedGroups,
    requiredRoles,
    requiredPermissions,
    item,
    onUpdate,
  ])

  // Calculer les droits effectifs (avec héritage)
  const getEffectiveRights = () => {
    if (isPublic) {
      return {
        groups: [],
        roles: [],
        permissions: [],
        isRestricted: false,
      }
    }

    if (inheritFromParent && parentItem) {
      return {
        groups: parentItem.allowedGroups ?? [],
        roles: parentItem.requiredRoles ?? [],
        permissions: parentItem.requiredPermissions ?? [],
        isRestricted: true,
        inheritedFrom: parentItem.title,
      }
    }

    return {
      groups: allowedGroups,
      roles: requiredRoles,
      permissions: requiredPermissions,
      isRestricted:
        allowedGroups.length > 0 || requiredRoles.length > 0 || requiredPermissions.length > 0,
    }
  }

  const effectiveRights = getEffectiveRights()

  // Simuler l'accès pour un groupe donné
  const simulateAccess = (groupId: string) => {
    const group = availableGroups?.find((g) => g.id === groupId)
    if (!group) return { hasAccess: false, reason: 'Groupe non trouvé' }

    if (isPublic) return { hasAccess: true, reason: 'Élément public' }

    if (effectiveRights?.groups?.length === 0 && effectiveRights?.roles?.length === 0) {
      return { hasAccess: true, reason: 'Aucune restriction' }
    }

    if (effectiveRights?.groups?.includes(groupId)) {
      return { hasAccess: true, reason: 'Groupe autorisé' }
    }

    return { hasAccess: false, reason: 'Groupe non autorisé' }
  }

  const _handleGroupsChange = (selectedGroups: string[]) => {
    setAllowedGroups(selectedGroups)
  }

  const _handleRolesChange = (selectedRoles: string[]) => {
    setRequiredRoles(selectedRoles)
  }

  const handlePermissionsChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setRequiredPermissions([...requiredPermissions, permissionId])
    } else {
      setRequiredPermissions(requiredPermissions?.filter((p) => p !== permissionId))
    }
  }

  const getRightsStatusBadge = () => {
    if (isPublic) {
      return (
        <Badge variant="secondary" className="text-green-700 bg-green-100">
          🌍 Public
        </Badge>
      )
    }

    if (effectiveRights?.inheritedFrom) {
      return (
        <Badge variant="outline" className="text-blue-700 bg-blue-50">
          ⬆️ Hérité
        </Badge>
      )
    }

    if (!effectiveRights?.isRestricted) {
      return (
        <Badge variant="outline" className="text-gray-600">
          🔓 Libre accès
        </Badge>
      )
    }

    return (
      <Badge variant="default" className="text-orange-700 bg-orange-100">
        🔐 Restreint
      </Badge>
    )
  }

  return (
    <Card className={cn('border-l-4 border-l-blue-500', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-blue-600" />
            Droits d'Accès
            {getRightsStatusBadge()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm"
            >
              {showAdvanced ? (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Mode Simple
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Mode Avancé
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuration de base */}
        <div className="space-y-4">
          {/* Accès public */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="is-public" className="font-medium">
                  Accès Public
                </Label>
                {isPublic && (
                  <Badge variant="secondary" className="text-xs">
                    Visible par tous
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Cet élément est accessible à tous les utilisateurs
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {/* Héritage du parent */}
          {parentItem && !isPublic && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="inherit-parent" className="font-medium">
                    Hériter du Parent
                  </Label>
                  {inheritFromParent && (
                    <Badge variant="outline" className="text-xs">
                      De: {parentItem.title}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Utiliser les mêmes droits que l'élément parent
                </p>
              </div>
              <Switch checked={inheritFromParent} onCheckedChange={setInheritFromParent} />
            </div>
          )}
        </div>

        {/* Configuration des droits (si pas public et pas d'héritage) */}
        {!isPublic && !inheritFromParent && (
          <div className="space-y-4">
            <Separator />

            {/* Sélection des groupes */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-medium">
                <Users className="h-4 w-4" />
                Groupes Autorisés
                {allowedGroups.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {allowedGroups.length} sélectionné(s)
                  </Badge>
                )}
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {availableGroups?.map((group) => (
                  <div key={group?.id} className="flex items-center space-x-2 p-2 rounded border">
                    <Checkbox
                      checked={allowedGroups?.includes(group?.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAllowedGroups([...allowedGroups, group?.id])
                        } else {
                          setAllowedGroups(allowedGroups?.filter((g) => g !== group?.id))
                        }
                      }}
                    />
                    <Label htmlFor={`group-${group?.id}`} className="text-sm cursor-pointer flex-1">
                      <div className="font-medium">{group?.name}</div>
                      <div className="text-xs text-muted-foreground">{group?.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Mode avancé */}
            {showAdvanced && (
              <>
                {/* Sélection des rôles */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium">
                    <Shield className="h-4 w-4" />
                    Rôles Requis
                    {requiredRoles.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {requiredRoles.length} requis
                      </Badge>
                    )}
                  </Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {availableRoles?.map((role) => (
                      <div
                        key={role?.id}
                        className="flex items-center space-x-2 p-2 rounded border"
                      >
                        <Checkbox
                          checked={requiredRoles?.includes(role?.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setRequiredRoles([...requiredRoles, role?.id])
                            } else {
                              setRequiredRoles(requiredRoles?.filter((r) => r !== role?.id))
                            }
                          }}
                        />
                        <Label
                          htmlFor={`role-${role?.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {role?.name}
                          {role?.isSystemRole && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              Système
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sélection des permissions */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium">
                    <Settings className="h-4 w-4" />
                    Permissions Spécifiques
                    {requiredPermissions.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {requiredPermissions.length} permission(s)
                      </Badge>
                    )}
                  </Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    {Object.entries(
                      availablePermissions?.reduce(
                        (acc, permission) => {
                          const module = permission.module
                          if (!acc[module]) {
                            acc[module] = []
                          }
                          acc?.[module]?.push(permission)
                          return acc
                        },
                        {} as Record<string, Permission[]>
                      )
                    ).map(([module, permissions]) => (
                      <div key={module} className="p-3 border-b last:border-b-0">
                        <h4 className="font-medium text-sm mb-2 text-blue-600">{module}</h4>
                        <div className="space-y-2">
                          {permissions?.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={requiredPermissions?.includes(permission.id)}
                                onCheckedChange={(checked) =>
                                  handlePermissionsChange(permission.id, checked as boolean)
                                }
                              />
                              <Label
                                htmlFor={`perm-${permission.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {permission.name}
                                <div className="text-xs text-muted-foreground">
                                  {permission.description}
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <Separator />

        {/* Aperçu des droits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 font-medium">
              <Eye className="h-4 w-4" />
              Aperçu des Accès
            </Label>
            <Select value={selectedPreviewGroup} onValueChange={setSelectedPreviewGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tester avec un groupe..." />
              </SelectTrigger>
              <SelectContent>
                {availableGroups?.map((group) => (
                  <SelectItem key={group?.id} value={group?.id}>
                    {group?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Résumé des droits effectifs */}
          <div className="p-4 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Info className="h-4 w-4 text-blue-500" />
              Droits Effectifs
            </div>

            {isPublic && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                Accessible à tous les utilisateurs
              </div>
            )}

            {effectiveRights?.inheritedFrom && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Info className="h-4 w-4" />
                Droits hérités de "{effectiveRights?.inheritedFrom}"
              </div>
            )}

            {effectiveRights?.groups?.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Groupes: </span>
                {effectiveRights?.groups
                  .map((groupId) => {
                    const group = availableGroups?.find((g) => g.id === groupId)
                    return group?.name
                  })
                  .filter(Boolean)
                  .join(', ')}
              </div>
            )}

            {effectiveRights?.roles?.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Rôles requis: </span>
                {effectiveRights?.roles
                  .map((roleId) => {
                    const role = availableRoles?.find((r) => r.id === roleId)
                    return role?.name
                  })
                  .filter(Boolean)
                  .join(', ')}
              </div>
            )}

            {!isPublic && !effectiveRights?.isRestricted && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle className="h-4 w-4" />
                Aucune restriction - accessible à tous les utilisateurs connectés
              </div>
            )}
          </div>

          {/* Test d'accès pour un groupe */}
          {selectedPreviewGroup && (
            <div className="p-3 rounded-lg border">
              {(() => {
                const access = simulateAccess(selectedPreviewGroup)
                const group = availableGroups?.find((g) => g.id === selectedPreviewGroup)
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {access?.hasAccess ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{group?.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{access?.reason}</div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
