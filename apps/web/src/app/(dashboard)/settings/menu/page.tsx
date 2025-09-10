'use client'

export const dynamic = 'force-dynamic'

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  useFormFieldIds,
} from '@erp/ui'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Database,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  FolderPlus,
  Globe,
  GripVertical,
  Home,
  Info,
  Key,
  LayoutDashboard,
  Link,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Package,
  Phone,
  PieChart,
  RefreshCw,
  RotateCcw as Reset,
  RotateCcw,
  Save,
  Search,
  Settings,
  // Icônes couramment utilisées dans l'app
  Shield,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  User,
  Users,
  Wrench,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { TranslationFieldWrapper } from '@/components/wrappers/translation-field-wrapper'
import { fetchTyped, postTyped } from '@/lib/api-typed'
import { useTranslation } from '@/lib/i18n/hooks'
import { translator } from '@/lib/i18n/translator'
import type { TranslationFunction } from '@/lib/i18n/types'
import { getTranslatedTitle, type TranslatableMenuItem } from '@/utils/menu-translations'

interface MenuItemConfig {
  id: string
  parentId?: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  orderIndex: number
  isVisible: boolean
  children: MenuItemConfig[]
  depth: number
  icon?: string
  badge?: string
  gradient?: string
}

interface UserMenuItem {
  id: string
  parentId?: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  orderIndex: number
  isVisible: boolean
  children: UserMenuItem[]
  icon?: string
  customTitle?: string
  titleTranslations?: Record<string, string>
  customIcon?: string
  customIconColor?: string
  isUserCreated?: boolean // Indique si l'élément a été créé par l'utilisateur (éditable)
}

const iconMap: Record<string, unknown> = {
  // Navigation & Structure
  Home,
  LayoutDashboard,
  FolderOpen,
  Settings,
  Search,
  Eye,

  // Administration & Sécurité
  Shield,
  Users,
  User,
  Key,
  Lock,

  // Entreprise & Organisation
  Building,
  Building2,
  Globe,
  Briefcase,

  // Données & Rapports
  Database,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  FileText,

  // Production & Stock
  Package,
  Wrench,
  Truck,

  // Communication & Documents
  Mail,
  Phone,
  Calendar,
  Bell,

  // Actions & États
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,

  // Finance
  CreditCard,

  // Technique
  Monitor,
  ExternalLink,
  MapPin,
  Check,
}

const _getAvailableIcons = () => {
  return Object.keys(iconMap).sort()
}

const getIconsByCategory = (t: TranslationFunction) => {
  return {
    [t('settings?.menu?.iconCategories.navigation')]: [
      'Home',
      'LayoutDashboard',
      'FolderOpen',
      'Settings',
      'Search',
      'Eye',
    ],
    [t('settings?.menu?.iconCategories.security')]: ['Shield', 'Users', 'User', 'Key', 'Lock'],
    [t('settings?.menu?.iconCategories.enterprise')]: [
      'Building',
      'Building2',
      'Globe',
      'Briefcase',
    ],
    [t('settings?.menu?.iconCategories.data')]: [
      'Database',
      'BarChart3',
      'PieChart',
      'Activity',
      'TrendingUp',
      'FileText',
    ],
    [t('settings?.menu?.iconCategories.production')]: ['Package', 'Wrench', 'Truck'],
    [t('settings?.menu?.iconCategories.communication')]: ['Mail', 'Phone', 'Calendar', 'Bell'],
    [t('settings?.menu?.iconCategories.actions')]: [
      'Download',
      'Upload',
      'CheckCircle',
      'AlertTriangle',
      'RefreshCw',
    ],
    [t('settings?.menu?.iconCategories.finance')]: [
      'CreditCard',
      'Monitor',
      'ExternalLink',
      'MapPin',
      'Check',
    ],
  }
}

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Settings
}

const getAvailableColors = (t: TranslationFunction) => {
  return {
    [t('settings?.menu?.colors.blue')]: '#3b82f6',
    [t('settings?.menu?.colors.green')]: '#10b981',
    [t('settings?.menu?.colors.orange')]: '#f97316',
    [t('settings?.menu?.colors.red')]: '#ef4444',
    [t('settings?.menu?.colors.purple')]: '#8b5cf6',
    [t('settings?.menu?.colors.pink')]: '#ec4899',
    [t('settings?.menu?.colors.yellow')]: '#eab308',
    [t('settings?.menu?.colors.cyan')]: '#06b6d4',
    [t('settings?.menu?.colors.gray')]: '#6b7280',
    [t('settings?.menu?.colors.slate')]: '#475569',
    [t('settings?.menu?.colors.zinc')]: '#52525b',
    [t('settings?.menu?.colors.indigo')]: '#6366f1',
    [t('settings?.menu?.colors.emerald')]: '#059669',
    [t('settings?.menu?.colors.lime')]: '#65a30d',
    [t('settings?.menu?.colors.amber')]: '#d97706',
  }
}

const getColorStyle = (color?: string) => {
  if (!color) return {}
  return { color: color }
}

// Composant dossier avec drag & drop natif uniquement
function FolderMenuItem({
  item,
  onRemove,
  level = 0,
  onDropInFolder,
  onEdit,
  expandedItems = [],
  onToggleExpanded,
}: {
  item: UserMenuItem
  onRemove: (id: string) => void
  level?: number
  onDropInFolder?: (parentId: string, droppedItem: unknown) => void
  onEdit?: (item: UserMenuItem) => void
  expandedItems?: string[]
  onToggleExpanded?: (id: string) => void
}) {
  const { t } = useTranslation('settings')
  const IconComponent = item.customIcon ? getIconComponent(item.customIcon) : getTypeIcon(item.type)
  const Icon = IconComponent
  const iconStyle = getColorStyle(item.customIconColor)
  const [isDragOver, setIsDragOver] = useState(false)
  const hasChildren = item.children && item?.children?.length > 0
  const isExpanded = expandedItems?.includes(item.id)

  const handleDrop = (e: React.DragEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (onDropInFolder) {
      // D'abord essayer de récupérer depuis dataTransfer
      let draggedData = e?.dataTransfer?.getData('application/json')

      // Si pas de données dans dataTransfer, essayer sessionStorage (fallback)
      if (!draggedData) {
        draggedData = sessionStorage?.getItem('draggedStandardItem') || ''
        sessionStorage?.removeItem('draggedStandardItem')
      }

      // Essayer aussi de récupérer depuis un état global
      if (!draggedData) {
        const globalDragData = (window as unknown as { currentDragData?: unknown }).currentDragData
        if (globalDragData) {
          draggedData = JSON.stringify(globalDragData)
          ;(window as unknown as { currentDragData?: unknown }).currentDragData = null
        }
      }

      if (draggedData) {
        try {
          const droppedItem = JSON.parse(draggedData)
          onDropInFolder(item.id, droppedItem)
        } catch {
          // Erreur lors du parsing des données de drag
        }
      } else {
        // Aucune donnée de drag trouvée pour le drop dans le dossier
      }
    }

    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setIsDragOver(false)
  }

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <section
        className={`p-3 mb-2 bg-card border rounded-lg transition-colors border-purple-200 ${
          isDragOver ? 'bg-purple-200 border-purple-400' : 'bg-purple-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        aria-label="Zone de dépôt pour réorganiser les éléments"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="cursor-move">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            {hasChildren && onToggleExpanded && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e?.stopPropagation()
                  onToggleExpanded(item.id)
                }}
                className="p-1 hover:bg-accent rounded transition-colors"
                aria-label={isExpanded ? 'Réduire le dossier' : 'Étendre le dossier'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-purple-600" />
                )}
              </Button>
            )}
          </div>
          <Icon className="h-4 w-4" style={iconStyle} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{getTranslatedTitle(item)}</span>
              <Badge className={`text-xs ${getTypeBadgeColor(item.type)} text-white`}>
                {getTypeLabel(item.type, t)}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  isDragOver
                    ? 'bg-purple-200 text-purple-800 border-purple-400'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}
              >
                {isDragOver ? `🎯 ${t('menu.dropHere')}` : t('menu.folderDropHint')}
              </Badge>
            </div>
            {item.programId && (
              <p className="text-xs text-muted-foreground mt-1">→ {item.programId}</p>
            )}
            {item.externalUrl && (
              <p className="text-xs text-muted-foreground mt-1">🌐 {item.externalUrl}</p>
            )}
            {item.queryBuilderId && (
              <p className="text-xs text-muted-foreground mt-1">📊 Query: {item.queryBuilderId}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e?.stopPropagation()
                onEdit?.(item)
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* Afficher les enfants du dossier seulement si étendu */}
      {hasChildren && isExpanded && (
        <div className="ml-4 border-l-2 border-purple-200 pl-4 space-y-1">
          {item?.children?.map((child) =>
            child.type === 'M' ? (
              <FolderMenuItem
                key={child.id}
                item={child}
                onRemove={onRemove}
                level={level + 1}
                onDropInFolder={onDropInFolder}
                onEdit={onEdit}
                expandedItems={expandedItems}
                onToggleExpanded={onToggleExpanded}
              />
            ) : (
              <SortableUserMenuItem
                key={child.id}
                item={child}
                onRemove={onRemove}
                level={level + 1}
                onDropInFolder={onDropInFolder}
                onEdit={onEdit}
              />
            )
          )}
        </div>
      )}

      {/* Debug pour voir si c'est un dossier vide */}
      {(!item.children || item?.children?.length === 0) && (
        <div className="ml-4 text-xs text-muted-foreground italic">📁 {t('menu.folderEmpty')}</div>
      )}
    </div>
  )
}

// Composant pour les éléments draggable du menu utilisateur (non-dossiers)
function SortableUserMenuItem({
  item,
  onRemove,
  level = 0,
  _onDropInFolder,
  onEdit,
}: {
  item: UserMenuItem
  onRemove: (id: string) => void
  level?: number
  onDropInFolder?: (parentId: string, droppedItem: unknown) => void
  _onDropInFolder?: (parentId: string, droppedItem: unknown) => void
  onEdit?: (item: UserMenuItem) => void
}) {
  const { t } = useTranslation('settings')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS?.Transform?.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Debug pour voir si l'élément est bien configuré
  if (isDragging) {
    // Element being dragged
  }

  const IconComponent = item.customIcon ? getIconComponent(item.customIcon) : getTypeIcon(item.type)
  const Icon = IconComponent
  const iconStyle = getColorStyle(item.customIconColor)

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <div
        ref={setNodeRef}
        style={style}
        className={`p-3 mb-2 bg-card border rounded-lg transition-colors ${
          isDragging ? 'shadow-lg bg-accent' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-move">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Icon className="h-4 w-4" style={iconStyle} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{getTranslatedTitle(item)}</span>
              <Badge className={`text-xs ${getTypeBadgeColor(item.type)} text-white`}>
                {getTypeLabel(item.type, t)}
              </Badge>
            </div>
            {item.programId && (
              <p className="text-xs text-muted-foreground mt-1">→ {item.programId}</p>
            )}
            {item.externalUrl && (
              <p className="text-xs text-muted-foreground mt-1">🌐 {item.externalUrl}</p>
            )}
            {item.queryBuilderId && (
              <p className="text-xs text-muted-foreground mt-1">📊 Query: {item.queryBuilderId}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e?.stopPropagation()
                onEdit?.(item)
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant pour les éléments de la bibliothèque (read-only)
function StandardMenuItemDisplay({
  item,
  level = 0,
  onDragStart,
  _expanded,
  _onToggleExpanded,
  expandedItems = [],
  onToggleExpandedItem,
  t,
}: {
  item: MenuItemConfig
  level?: number
  onDragStart: (item: MenuItemConfig) => void
  expanded?: boolean
  _expanded?: boolean
  onToggleExpanded?: () => void
  _onToggleExpanded?: () => void
  expandedItems?: string[]
  onToggleExpandedItem?: (id: string) => void
  t: TranslationFunction
}) {
  const Icon = getTypeIcon(item.type)
  const hasChildren = item.children && item?.children?.length > 0
  const isExpanded = expandedItems?.includes(item.id)

  const handleItemClick = (e: React.MouseEvent) => {
    e?.stopPropagation()
    if (hasChildren && onToggleExpandedItem) {
      onToggleExpandedItem(item.id)
    }
  }

  return (
    <>
      <li
        className={`p-3 mb-2 bg-card border rounded-lg transition-colors ${
          hasChildren
            ? 'cursor-pointer hover:bg-blue-50 border-blue-200'
            : 'cursor-move hover:bg-green-50 border-green-200'
        }`}
        style={{ marginLeft: `${level * 20}px` }}
        onClick={hasChildren ? handleItemClick : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e?.preventDefault()
            hasChildren && handleItemClick(e as unknown)
          }
        }}
        draggable={true}
        onDragStart={(e) => {
          // Empêcher la propagation pour éviter les conflits avec le clic
          e?.stopPropagation()

          // Fonction récursive pour mapper les enfants lors du drag
          const mapChildrenForDrag = (children: unknown[], newParentId: string): unknown[] => {
            return children?.map((child) => {
              const childTyped = child as {
                id?: string
                orderIndex?: number
                isVisible?: boolean
                children?: unknown[]
              }
              return {
                ...(child as Record<string, unknown>),
                id: `user-child-${childTyped.id}-${Date.now()}`,
                parentId: newParentId,
                orderIndex: childTyped.orderIndex ?? 0,
                isVisible: childTyped.isVisible !== false,
                children: Array.isArray(childTyped.children)
                  ? mapChildrenForDrag(
                      childTyped?.children,
                      `user-child-${childTyped.id}-${Date.now()}`
                    )
                  : [],
              }
            })
          }

          // Stocker les données de l'élément dans le dataTransfer
          const newId = `user-${item.id}-${Date.now()}`
          const dragData = {
            ...item,
            id: newId,
            orderIndex: 0,
            children: hasChildren ? mapChildrenForDrag(item.children, newId) : [], // Inclure les enfants avec mapping récursif
          }

          e?.dataTransfer?.setData('application/json', JSON.stringify(dragData))
          e?.dataTransfer?.setData('text/plain', item.title)

          // Stocker aussi dans sessionStorage comme fallback
          sessionStorage.setItem('draggedStandardItem', JSON.stringify(dragData))

          // Stocker aussi dans une variable globale pour les dossiers
          ;(window as unknown as { currentDragData?: unknown }).currentDragData = dragData

          onDragStart(item)
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4 text-blue-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-blue-500" />
              ))}
          </div>
          <Icon className="h-4 w-4" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{item.title}</span>
              <Badge className={`text-xs ${getTypeBadgeColor(item.type)} text-white`}>
                {getTypeLabel(item.type, t)}
              </Badge>
              {hasChildren && (
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  {t('menu.childrenCount').replace('{count}', item?.children?.length?.toString())}
                </Badge>
              )}
              {!hasChildren && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  {t('menu.dragToAdd')}
                </Badge>
              )}
            </div>
            {item.programId && (
              <p className="text-xs text-muted-foreground mt-1">→ {item.programId}</p>
            )}
            {item.externalUrl && (
              <p className="text-xs text-muted-foreground mt-1">🌐 {item.externalUrl}</p>
            )}
            {item.queryBuilderId && (
              <p className="text-xs text-muted-foreground mt-1">📊 Query: {item.queryBuilderId}</p>
            )}
          </div>
        </div>
      </li>

      {/* Afficher les enfants si déplié */}
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {item?.children?.map((child, index) => (
            <StandardMenuItemDisplay
              key={`${child.id}-${index}`}
              item={child}
              level={level + 1}
              onDragStart={onDragStart}
              expandedItems={expandedItems}
              onToggleExpandedItem={onToggleExpandedItem}
              t={t}
            />
          ))}
        </div>
      )}
    </>
  )
}

// Fonctions utilitaires
const getTypeLabel = (type: string, t: TranslationFunction) => {
  switch (type) {
    case 'M':
      return t('menu?.elementTypes?.folder')
    case 'P':
      return t('menu?.elementTypes?.program')
    case 'L':
      return t('menu?.elementTypes?.link')
    case 'D':
      return t('menu?.elementTypes?.dataView')
    default:
      return type
  }
}

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'M':
      return 'bg-blue-500'
    case 'P':
      return 'bg-green-500'
    case 'L':
      return 'bg-purple-500'
    case 'D':
      return 'bg-orange-500'
    default:
      return 'bg-gray-500'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'M':
      return FolderOpen
    case 'P':
      return LayoutDashboard
    case 'L':
      return ExternalLink
    case 'D':
      return BarChart3
    default:
      return Settings
  }
}

export default function MenuDragDropPage() {
  const ids = useFormFieldIds([
    'folder-title',
    'link-title',
    'link-url',
    'query-title',
    'query-id',
    'edit-url',
    'edit-query-id',
  ])
  const { t } = useTranslation('settings')
  const [standardMenu, setStandardMenu] = useState<MenuItemConfig[]>([])
  const [userMenu, setUserMenu] = useState<UserMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedStandardItem, setDraggedStandardItem] = useState<MenuItemConfig | null>(null)
  const [expandedStandardItems, setExpandedStandardItems] = useState<string[]>([])
  const [_isDraggingFromExternal, setIsDraggingFromExternal] = useState(false)

  // États pour gérer l'expansion des dossiers dans le menu utilisateur
  const [expandedUserItems, setExpandedUserItems] = useState<string[]>([])

  // États pour les modales de création
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCreateLink, setShowCreateLink] = useState(false)
  const [showCreateQuery, setShowCreateQuery] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemUrl, setNewItemUrl] = useState('')
  const [newItemQueryId, setNewItemQueryId] = useState('')

  // États pour la modale d'édition
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<UserMenuItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTitleTranslations, setEditTitleTranslations] = useState<Record<string, string>>({})
  const [editIcon, setEditIcon] = useState('')
  const [editIconColor, setEditIconColor] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editQueryId, setEditQueryId] = useState('')

  // États pour l'interface simplifiée
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Définir loadStandardMenu avant de l'utiliser dans useEffect
  const loadStandardMenu = useCallback(async () => {
    try {
      const response = await fetchTyped('/admin/menu-raw/configurations/active')
      if (
        (response as unknown as { data?: { success?: boolean; data?: { menuTree?: unknown[] } } })
          .data?.success &&
        (response as unknown as { data?: { data?: unknown } }).data?.data
      ) {
        const menuItems = Array.isArray(
          (response as unknown as { data: { data: { menuTree?: unknown[] } } }).data?.data?.menuTree
        )
          ? (response as unknown as { data: { data: { menuTree: unknown[] } } }).data?.data
              ?.menuTree
          : []
        setStandardMenu(menuItems as MenuItemConfig[])
      }
    } catch {
      // Erreur lors du chargement du menu standard
    } finally {
      setLoading(false)
    }
  }, [])

  // Fonction récursive pour mapper les éléments de menu
  const mapMenuItemRecursively = useCallback(
    (item: unknown, index: number, parentId?: string): UserMenuItem => {
      const itemTyped = item as {
        id?: string
        parentId?: string
        type?: 'M' | 'P' | 'L' | 'D'
        programId?: string
        externalUrl?: string
        queryBuilderId?: string
        orderIndex?: number
        isVisible?: boolean
        children?: unknown[]
        customIcon?: string
        icon?: string
        customTitle?: string
        customIconColor?: string
      }
      return {
        id: itemTyped.id || `item-${Date.now()}-${index}`,
        parentId: parentId || itemTyped.parentId,
        title: getTranslatedTitle(item as TranslatableMenuItem) || 'Sans titre',
        type: itemTyped.type || 'P',
        programId: itemTyped.programId,
        externalUrl: itemTyped.externalUrl,
        queryBuilderId: itemTyped.queryBuilderId,
        orderIndex: typeof itemTyped.orderIndex === 'number' ? itemTyped.orderIndex : index,
        isVisible: typeof itemTyped.isVisible === 'boolean' ? itemTyped.isVisible : true,
        children: Array.isArray(itemTyped.children)
          ? itemTyped?.children?.map((child: unknown, childIndex: number) =>
              mapMenuItemRecursively(child, childIndex, itemTyped?.id)
            )
          : [],
        icon: itemTyped.customIcon || itemTyped.icon,
        customTitle: itemTyped.customTitle,
        customIcon: itemTyped.customIcon,
        customIconColor: itemTyped.customIconColor,
      }
    },
    []
  )

  const loadUserMenu = useCallback(async () => {
    try {
      const response = await fetchTyped('/user/menu-preferences/custom-menu')

      if (
        (response as unknown as { data?: { success?: boolean; data?: unknown[] } }).data?.success &&
        Array.isArray((response as unknown as { data: { data: unknown[] } }).data.data)
      ) {
        // Convertir les données API vers le format UserMenuItem requis avec mapping récursif
        const menuItems = (response as unknown as { data: { data: unknown[] } }).data?.data?.map(
          (item: unknown, index: number) => mapMenuItemRecursively(item, index)
        )

        setUserMenu(menuItems)
      } else {
        setUserMenu([])
      }
    } catch {
      // Erreur lors du chargement du menu utilisateur
      setUserMenu([])
    }
  }, [mapMenuItemRecursively])

  useEffect(() => {
    loadStandardMenu()
    loadUserMenu()
  }, [loadStandardMenu, loadUserMenu])

  const saveUserMenu = async () => {
    setSaving(true)
    try {
      const response = await postTyped('/user/menu-preferences/custom-menu', {
        menuItems: userMenu,
      })

      if ((response as unknown as { data?: { success?: boolean } }).data?.success) {
        // Envoyer un événement personnalisé pour notifier la sidebar
        const event = new CustomEvent('menuPreferencesChanged', {
          detail: {
            fromCustomizationPage: true,
            savedAt: new Date().toISOString(),
            menuItemsCount: userMenu.length,
            menuItems: userMenu,
          },
        })
        window.dispatchEvent(event)

        // Notification de succès (optionnel - vous pouvez ajouter une lib de toast)
        // toast?.success('Menu sauvegardé avec succès')
      } else {
        // Erreur lors de la sauvegarde
      }
    } catch {
      // Erreur lors de la sauvegarde
    } finally {
      setSaving(false)
    }
  }

  const resetUserMenu = () => {
    setUserMenu([])
  }

  const createFolder = () => {
    if (!newItemTitle?.trim()) return

    const newFolder: UserMenuItem = {
      id: `folder-${Date.now()}`,
      title: newItemTitle,
      type: 'M',
      orderIndex: userMenu.length,
      isVisible: true,
      children: [],
      icon: 'FolderOpen',
    }
    setUserMenu([...userMenu, newFolder])
    setNewItemTitle('')
    setShowCreateFolder(false)
  }

  const createLink = () => {
    if (!newItemTitle?.trim() || !newItemUrl?.trim()) return

    const newLink: UserMenuItem = {
      id: `link-${Date.now()}`,
      title: newItemTitle,
      type: 'L',
      externalUrl: newItemUrl,
      orderIndex: userMenu.length,
      isVisible: true,
      children: [],
      icon: 'ExternalLink',
    }
    setUserMenu([...userMenu, newLink])
    setNewItemTitle('')
    setNewItemUrl('')
    setShowCreateLink(false)
  }

  const createQuery = () => {
    if (!newItemTitle?.trim() || !newItemQueryId?.trim()) return

    const newQuery: UserMenuItem = {
      id: `query-${Date.now()}`,
      title: newItemTitle,
      type: 'D',
      queryBuilderId: newItemQueryId,
      orderIndex: userMenu.length,
      isVisible: true,
      children: [],
      icon: 'BarChart3',
    }
    setUserMenu([...userMenu, newQuery])
    setNewItemTitle('')
    setNewItemQueryId('')
    setShowCreateQuery(false)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event || {}

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Fonction récursive pour trouver et déplacer un élément dans n'importe quel niveau
    const moveItemRecursively = (items: UserMenuItem[]): UserMenuItem[] => {
      // D'abord essayer de déplacer au niveau racine
      const activeIndex = items?.findIndex((item) => item.id === activeId)
      const overIndex = items?.findIndex((item) => item.id === overId)

      if (activeIndex !== -1 && overIndex !== -1) {
        // Les deux éléments sont au même niveau
        const newItems = arrayMove(items, activeIndex, overIndex)
        newItems?.forEach((item, index) => {
          item.orderIndex = index
        })
        return newItems
      }

      // Sinon, chercher dans les enfants
      return items?.map((item) => {
        if (item.children && item?.children?.length > 0) {
          const activeInChildren = item?.children?.findIndex((child) => child.id === activeId)
          const overInChildren = item?.children?.findIndex((child) => child.id === overId)

          if (activeInChildren !== -1 && overInChildren !== -1) {
            // Les deux sont des enfants du même parent
            const newChildren = arrayMove(item.children, activeInChildren, overInChildren)
            newChildren?.forEach((child, index) => {
              child.orderIndex = index
            })
            return { ...item, children: newChildren }
          } else {
            // Chercher récursivement dans les enfants
            return { ...item, children: moveItemRecursively(item.children) }
          }
        }
        return item
      })
    }

    setUserMenu(moveItemRecursively(userMenu))
  }

  const handleStandardItemDragStart = (item: MenuItemConfig) => {
    setDraggedStandardItem(item)
    setIsDraggingFromExternal(true)
  }

  const handleDropInFolder = (parentId: string, droppedItem: unknown) => {
    const droppedItemTyped = droppedItem as { id?: string; title?: string; children?: unknown[] }
    const newUserItem: UserMenuItem = {
      ...(droppedItem as UserMenuItem),
      id:
        droppedItemTyped?.id ||
        `user-${droppedItemTyped.id || droppedItemTyped.title}-${Date.now()}`,
      parentId: parentId,
      orderIndex: 0,
      children: Array.isArray(droppedItemTyped.children)
        ? (droppedItemTyped?.children as UserMenuItem[])
        : [],
    }

    // Ajouter l'élément au dossier parent
    const updateMenuWithNewItem = (items: UserMenuItem[]): UserMenuItem[] => {
      return items?.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...item.children, newUserItem],
          }
        }
        if (item?.children?.length > 0) {
          return {
            ...item,
            children: updateMenuWithNewItem(item.children),
          }
        }
        return item
      })
    }

    setUserMenu(updateMenuWithNewItem(userMenu))
    setIsDraggingFromExternal(false)
  }

  const handleUserMenuDrop = (e: React.DragEvent) => {
    e?.preventDefault()

    // Essayer de récupérer les données depuis dataTransfer
    let draggedData = e?.dataTransfer?.getData('application/json')

    // Fallback vers sessionStorage si nécessaire
    if (!draggedData) {
      draggedData = sessionStorage?.getItem('draggedStandardItem') || ''
      sessionStorage?.removeItem('draggedStandardItem')
    }

    if (draggedData) {
      try {
        const droppedItem = JSON.parse(draggedData)

        const newUserItem: UserMenuItem = {
          ...droppedItem,
          id: droppedItem.id || `user-${droppedItem.id}-${Date.now()}`,
          orderIndex: userMenu.length,
          children: Array.isArray(droppedItem.children) ? droppedItem.children : [],
        }

        setUserMenu([...userMenu, newUserItem])
      } catch {
        // Erreur lors du parsing des données de drop
      }
    }

    setDraggedStandardItem(null)
    setIsDraggingFromExternal(false)
  }

  const handleUserMenuDragOver = (e: React.DragEvent) => {
    e?.preventDefault()
  }

  const removeFromUserMenu = (id: string) => {
    const removeFromItems = (items: UserMenuItem[]): UserMenuItem[] => {
      return items?.filter((item) => {
        if (item.id === id) return false
        if (item?.children?.length > 0) {
          item.children = removeFromItems(item.children)
        }
        return true
      })
    }
    setUserMenu(removeFromItems(userMenu))
  }

  const toggleStandardItemExpansion = (itemId: string) => {
    setExpandedStandardItems((prev) =>
      prev?.includes(itemId) ? prev?.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const toggleUserItemExpansion = (itemId: string) => {
    setExpandedUserItems((prev) =>
      prev?.includes(itemId) ? prev?.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const openEditModal = (item: UserMenuItem) => {
    setEditingItem(item)
    setEditTitle(getTranslatedTitle(item))
    setEditTitleTranslations(item.titleTranslations || {})
    setEditIcon(item.customIcon || item.icon || '')
    setEditIconColor(item.customIconColor || '')
    setEditUrl(item.externalUrl || '')
    setEditQueryId(item.queryBuilderId || '')
    setShowIconSelector(false)
    setIsSaving(false)
    setShowInfo(false)
    setShowEditModal(true)
  }

  const resetItemEdit = useCallback(() => {
    if (!editingItem) return
    setEditTitle(getTranslatedTitle(editingItem))
    setEditTitleTranslations(editingItem.titleTranslations || {})
    setEditIcon(editingItem.customIcon || editingItem.icon || '')
    setEditIconColor(editingItem.customIconColor || '')
    setEditUrl(editingItem.externalUrl || '')
    setEditQueryId(editingItem.queryBuilderId || '')
  }, [editingItem])

  const saveItemEdit = useCallback(async () => {
    if (!editingItem || isSaving) return

    setIsSaving(true)

    try {
      // Simule un délai de sauvegarde pour montrer l'animation
      await new Promise((resolve) => setTimeout(resolve, 800))

      const updateItemRecursively = (items: UserMenuItem[]): UserMenuItem[] => {
        return items?.map((item) => {
          if (item.id === editingItem.id) {
            const currentLanguage = translator?.getCurrentLanguage()
            const updatedTranslations = { ...editTitleTranslations }

            // Sauvegarder le titre dans la langue courante
            if (editTitle?.trim()) {
              updatedTranslations[currentLanguage] = editTitle?.trim()
            }

            return {
              ...item,
              customTitle: editTitle?.trim() || item.title, // Garder pour compatibilité
              titleTranslations: updatedTranslations,
              customIcon: editIcon || item.icon,
              customIconColor: editIconColor || undefined,
              externalUrl: editingItem.type === 'L' ? editUrl : item.externalUrl,
              queryBuilderId: editingItem.type === 'D' ? editQueryId : item.queryBuilderId,
            }
          }
          if (item.children && item?.children?.length > 0) {
            return {
              ...item,
              children: updateItemRecursively(item.children),
            }
          }
          return item
        })
      }

      const updatedMenu = updateItemRecursively(userMenu)
      setUserMenu(updatedMenu)

      // Sauvegarder automatiquement en BDD après modification
      try {
        const _currentItem = updatedMenu?.find((item) => item.id === editingItem.id)

        const response = await postTyped('/user/menu-preferences/custom-menu', {
          menuItems: updatedMenu,
        })

        if ((response as unknown as { data?: { success?: boolean } }).data?.success) {
          // Envoyer un événement pour notifier la sidebar
          const event = new CustomEvent('menuPreferencesChanged', {
            detail: {
              fromEdit: true,
              editedItemId: editingItem.id,
              savedAt: new Date().toISOString(),
              menuItems: updatedMenu,
            },
          })
          window.dispatchEvent(event)
        } else {
          // Sauvegarde automatique échouée
        }
      } catch (_saveError) {
        // Erreur lors de la sauvegarde automatique
        // Ne pas bloquer l'interface même si la sauvegarde échoue
      }

      // Fermeture avec délai pour voir la confirmation
      setTimeout(() => {
        setShowEditModal(false)
        setEditingItem(null)
        setEditTitle('')
        setEditTitleTranslations({})
        setEditIcon('')
        setEditIconColor('')
        setEditUrl('')
        setEditQueryId('')
        setShowIconSelector(false)
        setIsSaving(false)
      }, 300)
    } catch {
      // Erreur lors de la sauvegarde
      setIsSaving(false)
    }
  }, [
    editingItem,
    isSaving,
    editTitleTranslations,
    editTitle,
    editIcon,
    editIconColor,
    editUrl,
    editQueryId,
    userMenu,
  ])

  // Raccourcis clavier optimisés
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showEditModal) return

      // Escape pour fermer le sélecteur ou la modale (sauf si sauvegarde en cours)
      if (e.key === 'Escape' && !isSaving) {
        if (showIconSelector) {
          setShowIconSelector(false)
        } else {
          setShowEditModal(false)
        }
        return
      }

      // Ctrl+S pour sauvegarder (sauf si déjà en cours)
      if (e.ctrlKey && e.key === 's' && !isSaving) {
        e?.preventDefault()
        saveItemEdit()
      }

      // Ctrl+R pour reset (sauf si sauvegarde en cours)
      if (e.ctrlKey && e.key === 'r' && !isSaving) {
        e?.preventDefault()
        resetItemEdit()
      }

      // Ctrl+Escape pour forcer la fermeture (urgence)
      if (e.ctrlKey && e.key === 'Escape') {
        e?.preventDefault()
        setShowEditModal(false)
        setIsSaving(false)
      }
    }

    if (showEditModal) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
    return undefined
  }, [showEditModal, showIconSelector, isSaving, resetItemEdit, saveItemEdit])

  // Fonction récursive pour collecter tous les IDs d'éléments déplaçables (non-dossiers)
  const getAllSortableIds = (items: UserMenuItem[]): string[] => {
    let ids: string[] = []

    items?.forEach((item) => {
      if (item.type !== 'M') {
        ids?.push(item.id)
      }

      if (item.children && item?.children?.length > 0) {
        ids = ids?.concat(getAllSortableIds(item.children))
      }
    })

    return ids
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('menu.title')}</h1>
          <p className="text-muted-foreground">{t('menu.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={resetUserMenu}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('menu.reset')}
          </Button>
          <Button type="button" onClick={saveUserMenu} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('menu.saving') : t('menu.save')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
        {/* Panneau WYSIWYG - Menu Utilisateur */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('menu.yourCustomMenu')}
            </CardTitle>
            <CardDescription>{t('menu.menuPreview')}</CardDescription>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <FolderPlus className="h-4 w-4 mr-1" />
                    {t('menu.folder')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('menu.createNewFolder')}</DialogTitle>
                    <DialogDescription>{t('menu.folderDescription')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={ids['folder-title']}>{t('menu.folderName')}</Label>
                      <Input
                        id={ids['folder-title']}
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e?.target?.value)}
                        placeholder={t('menu.folderPlaceholder')}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateFolder(false)}
                    >
                      {t('menu.cancel')}
                    </Button>
                    <Button type="button" onClick={createFolder}>
                      {t('menu.create')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateLink} onOpenChange={setShowCreateLink}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Link className="h-4 w-4 mr-1" />
                    {t('menu.link')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('menu.createNewLink')}</DialogTitle>
                    <DialogDescription>{t('menu.linkDescription')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={ids['link-title']}>{t('menu.linkName')}</Label>
                      <Input
                        id={ids['link-title']}
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e?.target?.value)}
                        placeholder={t('menu.linkPlaceholder')}
                      />
                    </div>
                    <div>
                      <Label htmlFor={ids['link-url']}>{t('menu.url')}</Label>
                      <Input
                        id={ids['link-url']}
                        value={newItemUrl}
                        onChange={(e) => setNewItemUrl(e?.target?.value)}
                        placeholder={t('menu.urlPlaceholder')}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateLink(false)}
                    >
                      {t('menu.cancel')}
                    </Button>
                    <Button type="button" onClick={createLink}>
                      {t('menu.create')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateQuery} onOpenChange={setShowCreateQuery}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-1" />
                    {t('menu.dataView')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('menu.createNewDataView')}</DialogTitle>
                    <DialogDescription>{t('menu.dataViewDescription')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={ids['query-title']}>{t('menu.dataViewName')}</Label>
                      <Input
                        id={ids['query-title']}
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e?.target?.value)}
                        placeholder={t('menu.dataViewPlaceholder')}
                      />
                    </div>
                    <div>
                      <Label htmlFor={ids['query-id']}>{t('menu.queryId')}</Label>
                      <Input
                        id={ids['query-id']}
                        value={newItemQueryId}
                        onChange={(e) => setNewItemQueryId(e?.target?.value)}
                        placeholder={t('menu.queryIdPlaceholder')}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateQuery(false)}
                    >
                      {t('menu.cancel')}
                    </Button>
                    <Button type="button" onClick={createQuery}>
                      {t('menu.create')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <section
              onDrop={handleUserMenuDrop}
              onDragOver={handleUserMenuDragOver}
              className={`h-full p-4 border-2 border-dashed rounded-lg transition-colors ${
                draggedStandardItem ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              aria-label="Zone de dépôt pour le menu personnalisé"
            >
              {userMenu.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">{t('menu.emptyMenu')}</p>
                    <p className="text-sm">{t('menu.emptyMenuDescription')}</p>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={getAllSortableIds(userMenu)}
                      strategy={verticalListSortingStrategy}
                    >
                      {userMenu?.map((item) =>
                        item.type === 'M' ? (
                          <FolderMenuItem
                            key={item.id}
                            item={item}
                            onRemove={removeFromUserMenu}
                            onDropInFolder={handleDropInFolder}
                            onEdit={openEditModal}
                            expandedItems={expandedUserItems}
                            onToggleExpanded={toggleUserItemExpansion}
                          />
                        ) : (
                          <SortableUserMenuItem
                            key={item.id}
                            item={item}
                            onRemove={removeFromUserMenu}
                            onDropInFolder={handleDropInFolder}
                            onEdit={openEditModal}
                          />
                        )
                      )}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </section>
          </CardContent>
        </Card>

        {/* Bibliothèque d'éléments - Menu Standard */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('menu.library')}
            </CardTitle>
            <CardDescription>{t('menu.libraryDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <div className="space-y-2 h-full overflow-y-auto">
              {standardMenu?.map((item) => (
                <StandardMenuItemDisplay
                  key={item.id}
                  item={item}
                  onDragStart={handleStandardItemDragStart}
                  expandedItems={expandedStandardItems}
                  onToggleExpandedItem={toggleStandardItemExpansion}
                  t={t}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modale d'édition simplifiée */}
      <Dialog open={showEditModal} onOpenChange={(open) => !isSaving && setShowEditModal(open)}>
        <DialogContent className="max-w-lg overflow-hidden relative">
          {/* Overlay de loading */}
          {isSaving && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg shadow-lg border">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <p className="text-sm font-medium text-green-600">Sauvegarde en cours...</p>
              </div>
            </div>
          )}
          <DialogHeader
            className={`pb-3 border-b transition-opacity duration-300 ${isSaving ? 'opacity-60' : 'opacity-100'}`}
          >
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit
                className={`h-5 w-5 transition-colors duration-300 ${
                  isSaving ? 'text-green-600' : 'text-foreground'
                }`}
              />
              <span className="transition-colors duration-300">
                {isSaving ? t('menu.savingInProgress') : t('menu.edit')}
              </span>
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div
              className={`pt-6 space-y-6 transition-all duration-300 ${
                isSaving ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
            >
              {/* Interface principale - Icône à gauche, titre à droite */}
              <div className="flex items-center gap-4">
                {/* Icône cliquable */}
                <div className="flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowIconSelector(!showIconSelector)}
                    className="group relative p-4 border-2 border-dashed rounded-lg hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    {(() => {
                      const IconComponent = editIcon
                        ? getIconComponent(editIcon)
                        : editingItem.customIcon
                          ? getIconComponent(editingItem.customIcon)
                          : getTypeIcon(editingItem.type)
                      const iconStyle = editIconColor
                        ? { color: editIconColor }
                        : editingItem.customIconColor
                          ? { color: editingItem.customIconColor }
                          : {}
                      return (
                        <IconComponent
                          className="h-8 w-8 transition-all duration-300"
                          style={iconStyle}
                        />
                      )
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/30 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Edit className="h-4 w-4 text-white drop-shadow-lg" />
                    </div>
                  </Button>
                </div>

                {/* Titre personnalisable */}
                <div className="flex-1 space-y-3">
                  <div>
                    <TranslationFieldWrapper
                      value={editTitle}
                      onChange={(value) =>
                        setEditTitle(
                          typeof value === 'string' ? value : Object.values(value)[0] || ''
                        )
                      }
                      translations={editTitleTranslations}
                      onTranslationsChange={setEditTitleTranslations}
                      placeholder={editingItem.title}
                      className="text-lg font-medium"
                      disabled={isSaving}
                      label={t('menu.title')}
                    />
                  </div>

                  {/* Champs spécifiques selon le type */}
                  {editingItem.type === 'L' && (
                    <Input
                      id={ids['edit-url']}
                      value={editUrl}
                      onChange={(e) => setEditUrl(e?.target?.value)}
                      placeholder="https://example.com"
                      className="transition-all duration-200"
                      disabled={isSaving}
                    />
                  )}

                  {editingItem.type === 'D' && (
                    <Input
                      id={ids['edit-query-id']}
                      value={editQueryId}
                      onChange={(e) => setEditQueryId(e?.target?.value)}
                      placeholder="query-123"
                      className="transition-all duration-200"
                      disabled={isSaving}
                    />
                  )}
                </div>
              </div>

              {/* Sélecteur d'icône et couleur (affiché conditionnellement) */}
              {showIconSelector && (
                <div className="space-y-4 border-t pt-4">
                  {/* Sélecteur de couleurs */}
                  <div>
                    <div className="grid grid-cols-8 gap-2">
                      {Object.entries(getAvailableColors(t)).map(([colorName, colorValue]) => (
                        <Button
                          type="button"
                          key={colorName}
                          variant="ghost"
                          onClick={() => setEditIconColor(colorValue)}
                          className={`relative p-2 rounded border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                            editIconColor === colorValue
                              ? 'border-primary shadow-md ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/50'
                          }`}
                          aria-label={t('menu.clickToApply', { name: colorName })}
                          disabled={isSaving}
                        >
                          <div
                            className="w-6 h-6 rounded-full mx-auto"
                            style={{ backgroundColor: colorValue }}
                          />
                          {editIconColor === colorValue && (
                            <div className="absolute -top-1 -right-1">
                              <CheckCircle className="h-3 w-3 text-primary bg-white rounded-full" />
                            </div>
                          )}
                        </Button>
                      ))}
                      {/* Bouton couleur par défaut */}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setEditIconColor('')}
                        className={`p-2 rounded border-2 transition-all text-xs ${
                          editIconColor
                            ? 'border-border hover:bg-accent'
                            : 'border-primary bg-primary/10'
                        }`}
                        aria-label={t('menu.defaultColor')}
                      >
                        <div className="w-6 h-6 rounded-full mx-auto bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-gray-600">DEF</span>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Sélecteur d'icônes par catégorie */}
                  <div>
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-3">
                      {Object.entries(getIconsByCategory(t)).map(([categoryName, icons]) => (
                        <div key={categoryName}>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2 border-b pb-1">
                            {categoryName}
                          </h4>
                          <div className="grid grid-cols-8 gap-1">
                            {icons?.map((iconName) => {
                              const IconComponent = getIconComponent(iconName)
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  onClick={() => setEditIcon(iconName)}
                                  className={`p-2 rounded border transition-colors hover:bg-accent ${
                                    editIcon === iconName
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border'
                                  }`}
                                  title={iconName}
                                >
                                  <IconComponent className="h-4 w-4" />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Aperçu amélioré */}
              <div
                className={`p-4 rounded-lg transition-all duration-300 ${
                  isSaving
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                    : 'bg-gradient-to-r from-muted/30 to-muted/60 border border-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const IconComponent = editIcon
                      ? getIconComponent(editIcon)
                      : editingItem.customIcon
                        ? getIconComponent(editingItem.customIcon)
                        : getTypeIcon(editingItem.type)
                    const previewIconStyle = editIconColor
                      ? { color: editIconColor }
                      : editingItem.customIconColor
                        ? { color: editingItem.customIconColor }
                        : {}
                    return (
                      <IconComponent
                        className="h-5 w-5 transition-all duration-300"
                        style={previewIconStyle}
                      />
                    )
                  })()}
                  <span className="font-medium transition-all duration-300">
                    {editTitle?.trim() || editingItem.title}
                  </span>
                  <Badge
                    className={`text-xs ${getTypeBadgeColor(editingItem.type)} text-white transition-all duration-300`}
                  >
                    {getTypeLabel(editingItem.type, t)}
                  </Badge>
                  {isSaving && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Sauvegarde...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Panneau d'information */}
          {showInfo && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Guide d'édition</h4>
                  <ul className="space-y-1 text-blue-800 list-disc list-inside">
                    <li key="icon">
                      <strong>Icône :</strong> Cliquez sur l'icône pour ouvrir les sélecteurs
                    </li>
                    <li key="colors">
                      <strong>Couleurs :</strong> 16 couleurs disponibles + couleur par défaut
                    </li>
                    <li key="icons">
                      <strong>Icônes :</strong> 38 icônes organisées par catégorie
                    </li>
                    <li key="shortcuts">
                      <strong>Raccourcis :</strong> Ctrl+S (sauver), Ctrl+R (reset), Escape (fermer)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 pt-3 border-t bg-muted/20">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetItemEdit}
                disabled={isSaving}
                className="transition-all duration-200"
                title="Annuler les modifications"
              >
                <Reset className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowInfo(!showInfo)}
                className="transition-all duration-200"
                title="Informations sur l'édition"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => !isSaving && setShowEditModal(false)}
                disabled={isSaving}
                className="transition-all duration-200 min-w-[100px]"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={saveItemEdit}
                disabled={isSaving}
                className={`transition-all duration-300 min-w-[140px] ${
                  isSaving ? 'bg-green-600 hover:bg-green-700 shadow-lg' : 'hover:shadow-md'
                }`}
              >
                {isSaving ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Sauvegarde...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Check className="h-4 w-4 mr-2" />
                    <span>Sauvegarder</span>
                  </div>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
