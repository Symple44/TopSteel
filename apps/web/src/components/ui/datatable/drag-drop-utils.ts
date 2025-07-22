import { ColumnConfig, TableSettings } from './types'

/**
 * Utilitaires pour le drag & drop des colonnes
 */
export class DragDropUtils {
  
  /**
   * Démarre le drag d'une colonne
   */
  static startColumnDrag(
    e: React.DragEvent<HTMLElement>, 
    columnId: string, 
    columnIndex: number
  ): void {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({
      columnId,
      columnIndex,
      type: 'column'
    }))
    
    // Style visuel pour indiquer le drag
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }
  
  /**
   * Gère le dragover sur une colonne cible
   */
  static handleColumnDragOver(e: React.DragEvent<HTMLElement>): void {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Ajouter une classe CSS pour indiquer la zone de drop
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('drag-over')
    }
  }
  
  /**
   * Gère la sortie du dragover
   */
  static handleColumnDragLeave(e: React.DragEvent<HTMLElement>): void {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('drag-over')
    }
  }
  
  /**
   * Gère le drop sur une colonne cible
   */
  static handleColumnDrop<T>(
    e: React.DragEvent<HTMLElement>,
    targetColumnId: string,
    targetColumnIndex: number,
    columns: ColumnConfig<T>[],
    settings: TableSettings,
    onReorder: (newColumns: ColumnConfig<T>[], newSettings: TableSettings) => void
  ): void {
    e.preventDefault()
    
    // Nettoyer les styles visuels
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('drag-over')
    }
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'))
      
      if (dragData.type !== 'column') return
      
      const sourceColumnId = dragData.columnId
      const sourceColumnIndex = dragData.columnIndex
      
      if (sourceColumnId === targetColumnId) return
      
      // Réorganiser les colonnes
      const { newColumns, newSettings } = this.reorderColumns(
        columns,
        settings,
        sourceColumnIndex,
        targetColumnIndex
      )
      
      onReorder(newColumns, newSettings)
      
    } catch (error) {
      console.error('Erreur lors du drop:', error)
    }
  }
  
  /**
   * Termine le drag (nettoyage)
   */
  static endColumnDrag(e: React.DragEvent<HTMLElement>): void {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }
  
  /**
   * Réorganise les colonnes selon les indices source/cible
   */
  static reorderColumns<T>(
    columns: ColumnConfig<T>[],
    settings: TableSettings,
    sourceIndex: number,
    targetIndex: number
  ): { newColumns: ColumnConfig<T>[]; newSettings: TableSettings } {
    
    // Créer une copie des colonnes
    const newColumns = [...columns]
    
    // Déplacer la colonne source vers la position cible
    const [movedColumn] = newColumns.splice(sourceIndex, 1)
    newColumns.splice(targetIndex, 0, movedColumn)
    
    // Mettre à jour les ordres dans les settings
    const newSettings: TableSettings = {
      ...settings,
      columns: {
        ...settings.columns
      }
    }
    
    // Recalculer les ordres selon la nouvelle position
    newColumns.forEach((column, index) => {
      newSettings.columns[column.id] = {
        ...newSettings.columns[column.id],
        order: index
      }
    })
    
    return { newColumns, newSettings }
  }
  
  /**
   * Applique l'ordre des colonnes selon les settings
   */
  static applyColumnOrder<T>(
    columns: ColumnConfig<T>[],
    settings: TableSettings
  ): ColumnConfig<T>[] {
    return [...columns].sort((a, b) => {
      const orderA = settings.columns[a.id]?.order ?? 999
      const orderB = settings.columns[b.id]?.order ?? 999
      return orderA - orderB
    })
  }
  
  /**
   * Vérifie si une colonne peut être déplacée
   */
  static canMoveColumn<T>(column: ColumnConfig<T>): boolean {
    return !column.locked
  }
  
  /**
   * Obtient l'indicateur visuel de position de drop
   */
  static getDropIndicatorPosition(
    e: React.DragEvent<HTMLElement>,
    element: HTMLElement
  ): 'left' | 'right' {
    const rect = element.getBoundingClientRect()
    const middle = rect.left + rect.width / 2
    return e.clientX < middle ? 'left' : 'right'
  }
  
  /**
   * Crée les styles CSS pour le drag & drop
   */
  static getDragDropStyles(): string {
    return `
      .column-dragging {
        opacity: 0.5;
        cursor: move;
      }
      
      .column-draggable {
        cursor: move;
      }
      
      .column-draggable:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .drag-over {
        border-left: 3px solid #3b82f6;
        background-color: rgba(59, 130, 246, 0.1);
      }
      
      .drag-over.drop-right {
        border-left: none;
        border-right: 3px solid #3b82f6;
      }
      
      .column-locked {
        cursor: not-allowed;
        opacity: 0.6;
      }
      
      .drop-indicator {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background-color: #3b82f6;
        z-index: 10;
        pointer-events: none;
      }
      
      .drop-indicator-left {
        left: 0;
      }
      
      .drop-indicator-right {
        right: 0;
      }
    `
  }
}

// Hook pour gérer le drag & drop des colonnes
export const useDragDropColumns = <T>(
  columns: ColumnConfig<T>[],
  settings: TableSettings,
  onColumnsChange: (columns: ColumnConfig<T>[]) => void,
  onSettingsChange: (settings: TableSettings) => void
) => {
  
  const handleReorderColumns = (
    newColumns: ColumnConfig<T>[],
    newSettings: TableSettings
  ) => {
    onColumnsChange(newColumns)
    onSettingsChange(newSettings)
  }
  
  const handleColumnDragStart = (columnId: string, columnIndex: number) => 
    (e: React.DragEvent<HTMLElement>) => {
      const column = columns.find(col => col.id === columnId)
      if (column && !DragDropUtils.canMoveColumn(column)) {
        e.preventDefault()
        return
      }
      
      DragDropUtils.startColumnDrag(e, columnId, columnIndex)
    }
  
  const handleColumnDragOver = (e: React.DragEvent<HTMLElement>) => {
    DragDropUtils.handleColumnDragOver(e)
  }
  
  const handleColumnDragLeave = (e: React.DragEvent<HTMLElement>) => {
    DragDropUtils.handleColumnDragLeave(e)
  }
  
  const handleColumnDrop = (columnId: string, columnIndex: number) => 
    (e: React.DragEvent<HTMLElement>) => {
      DragDropUtils.handleColumnDrop(
        e,
        columnId,
        columnIndex,
        columns,
        settings,
        handleReorderColumns
      )
    }
  
  const handleColumnDragEnd = (e: React.DragEvent<HTMLElement>) => {
    DragDropUtils.endColumnDrag(e)
  }
  
  return {
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
    handleColumnDragEnd,
    canMoveColumn: DragDropUtils.canMoveColumn
  }
}