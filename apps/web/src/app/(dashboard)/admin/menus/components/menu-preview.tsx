'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Folder, 
  Play, 
  ExternalLink, 
  BarChart3, 
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  icon?: string
  orderIndex: number
  isVisible: boolean
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  children: MenuItem[]
}

interface MenuPreviewProps {
  menuItems: MenuItem[]
  level?: number
}

export function MenuPreview({ menuItems, level = 0 }: MenuPreviewProps) {
  // Vérifier que menuItems est un tableau valide
  if (!Array.isArray(menuItems)) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>Aucun élément de menu à afficher</p>
      </div>
    )
  }

  const sortedItems = [...menuItems].sort((a, b) => a.orderIndex - b.orderIndex)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'M': return <Folder className="h-4 w-4" />
      case 'P': return <Play className="h-4 w-4" />
      case 'L': return <ExternalLink className="h-4 w-4" />
      case 'D': return <BarChart3 className="h-4 w-4" />
      default: return <Play className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'M': return <Badge variant="secondary" className="text-xs">Dossier</Badge>
      case 'P': return <Badge variant="default" className="text-xs">Programme</Badge>
      case 'L': return <Badge variant="outline" className="text-xs">Lien</Badge>
      case 'D': return <Badge variant="destructive" className="text-xs">Vue Data</Badge>
      default: return null
    }
  }

  const getItemUrl = (item: MenuItem) => {
    switch (item.type) {
      case 'P': return item.programId
      case 'L': return item.externalUrl
      case 'D': return item.queryBuilderId ? `/query-builder/${item.queryBuilderId}/view` : undefined
      default: return undefined
    }
  }

  if (sortedItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucun élément de menu configuré</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sortedItems.map((item) => (
        <Card key={item.id} className={cn(
          "transition-all",
          !item.isVisible && "opacity-50 border-dashed"
        )}>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* En-tête de l'item */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex items-center gap-2"
                    style={{ marginLeft: `${level * 20}px` }}
                  >
                    {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    {getTypeIcon(item.type)}
                    <span className="font-medium">{item.title}</span>
                  </div>
                  {getTypeBadge(item.type)}
                  {!item.isVisible && (
                    <Badge variant="outline" className="text-xs">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Masqué
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Ordre: {item.orderIndex}</span>
                </div>
              </div>

              {/* Détails de l'item */}
              <div className="text-sm text-muted-foreground pl-6">
                {item.type === 'P' && item.programId && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Programme:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{item.programId}</code>
                  </div>
                )}
                {item.type === 'L' && item.externalUrl && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">URL:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{item.externalUrl}</code>
                  </div>
                )}
                {item.type === 'D' && item.queryBuilderId && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Query Builder ID:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{item.queryBuilderId}</code>
                  </div>
                )}
                {item.type === 'M' && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Conteneur</span>
                    <span>({item.children.length} élément(s))</span>
                  </div>
                )}
              </div>

              {/* Enfants */}
              {item.children && item.children.length > 0 && (
                <div className="border-l-2 border-muted pl-4 ml-6">
                  <MenuPreview menuItems={item.children} level={level + 1} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}