'use client'

import { Badge } from '@erp/ui'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@erp/ui/primitives'
import { Download, Edit, MoreVertical, Play, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { MenuConfiguration } from '@/types/menu'

interface MenuConfigurationListProps {
  configurations: MenuConfiguration[]
  selectedConfig: MenuConfiguration | null
  onSelect: (config: MenuConfiguration) => void
  onActivate: (configId: string) => void
  onDelete: (configId: string) => void
  onExport: (configId: string) => void
  onEdit: (config: MenuConfiguration) => void
}

export function MenuConfigurationList({
  configurations,
  selectedConfig,
  onSelect,
  onActivate,
  onDelete,
  onExport,
  onEdit,
}: MenuConfigurationListProps) {
  return (
    <div className="space-y-2">
      {configurations && configurations.length > 0 ? (
        configurations?.map((config) => (
          <button
            key={config.id}
            type="button"
            className={cn(
              'p-3 rounded-lg border cursor-pointer transition-colors',
              selectedConfig?.id === config.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:bg-muted/50'
            )}
            onClick={() => onSelect(config)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e?.preventDefault()
                onSelect(config)
              }
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{config.name}</h4>
                  {config.isActive && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                  {config.isSystem && (
                    <Badge variant="secondary" className="text-xs">
                      Système
                    </Badge>
                  )}
                </div>
                {config.description && (
                  <p className="text-xs text-muted-foreground truncate">{config.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Modifié le{' '}
                  {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e?.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!config.isActive && (
                    <DropdownMenuItem onClick={() => onActivate(config.id)}>
                      <Play className="h-4 w-4 mr-2" />
                      Activer
                    </DropdownMenuItem>
                  )}
                  {!config.isSystem && (
                    <DropdownMenuItem onClick={() => onEdit(config)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onExport(config.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </DropdownMenuItem>
                  {!config.isSystem && !config.isActive && (
                    <DropdownMenuItem
                      onClick={() => onDelete(config.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </button>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucune configuration disponible</p>
        </div>
      )}
    </div>
  )
}
