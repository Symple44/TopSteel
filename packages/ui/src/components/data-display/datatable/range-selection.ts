export interface CellPosition {
  row: number
  column: string
}

export interface CellRange {
  start: CellPosition
  end: CellPosition
}

export interface RangeSelection {
  ranges: CellRange[]
  activeRange: CellRange | null
  isSelecting: boolean
}

export class RangeSelectionManager {
  private selection: RangeSelection = {
    ranges: [],
    activeRange: null,
    isSelecting: false,
  }

  private listeners: Array<(selection: RangeSelection) => void> = []

  /**
   * Commencer une nouvelle sélection
   */
  startSelection(position: CellPosition, multiSelect: boolean = false) {
    if (!multiSelect) {
      this.selection.ranges = []
    }

    this.selection.activeRange = {
      start: position,
      end: position,
    }
    this.selection.isSelecting = true
    this.notifyListeners()
  }

  /**
   * Étendre la sélection active
   */
  extendSelection(position: CellPosition) {
    if (!this.selection.activeRange || !this.selection.isSelecting) {
      return
    }

    this.selection.activeRange.end = position
    this.notifyListeners()
  }

  /**
   * Terminer la sélection en cours
   */
  endSelection() {
    if (this.selection.activeRange && this.selection.isSelecting) {
      // Ajouter la plage active aux sélections
      this.selection.ranges.push({ ...this.selection.activeRange })
      this.selection.isSelecting = false
      this.notifyListeners()
    }
  }

  /**
   * Effacer toutes les sélections
   */
  clearSelection() {
    this.selection = {
      ranges: [],
      activeRange: null,
      isSelecting: false,
    }
    this.notifyListeners()
  }

  /**
   * Vérifier si une cellule est sélectionnée
   */
  isCellSelected(row: number, column: string, columnOrder?: string[]): boolean {
    return this.getAllSelectedCells(columnOrder).some(
      (cell) => cell.row === row && cell.column === column
    )
  }

  /**
   * Vérifier si une cellule fait partie de la sélection active
   */
  isCellInActiveRange(row: number, column: string, columnOrder?: string[]): boolean {
    if (!this.selection.activeRange) return false

    return this.isCellInRange(row, column, this.selection.activeRange, columnOrder)
  }

  /**
   * Vérifier si une cellule est dans une plage donnée
   */
  private isCellInRange(
    row: number,
    column: string,
    range: CellRange,
    columnOrder?: string[]
  ): boolean {
    const { start, end } = range

    // Calculer les bornes de la plage pour les lignes
    const minRow = Math.min(start.row, end.row)
    const maxRow = Math.max(start.row, end.row)

    // Vérifier si la ligne est dans la plage
    if (row < minRow || row > maxRow) return false

    // Si columnOrder est fourni, utiliser l'ordre des colonnes
    if (columnOrder) {
      const startColIndex = columnOrder.indexOf(start.column)
      const endColIndex = columnOrder.indexOf(end.column)
      const currentColIndex = columnOrder.indexOf(column)

      if (startColIndex === -1 || endColIndex === -1 || currentColIndex === -1) {
        return start.column === column || end.column === column
      }

      const minCol = Math.min(startColIndex, endColIndex)
      const maxCol = Math.max(startColIndex, endColIndex)

      return currentColIndex >= minCol && currentColIndex <= maxCol
    }

    // Fallback: vérifier seulement la colonne exacte
    return start.column === column || end.column === column
  }

  /**
   * Obtenir toutes les cellules sélectionnées
   */
  getAllSelectedCells(columnOrder?: string[]): CellPosition[] {
    const cells: CellPosition[] = []

    // Ajouter les cellules des plages finalisées
    this.selection.ranges.forEach((range) => {
      cells.push(...this.getCellsInRange(range, columnOrder))
    })

    // Ajouter les cellules de la plage active
    if (this.selection.activeRange && this.selection.isSelecting) {
      cells.push(...this.getCellsInRange(this.selection.activeRange, columnOrder))
    }

    return cells
  }

  /**
   * Obtenir les cellules dans une plage
   */
  private getCellsInRange(range: CellRange, columnOrder?: string[]): CellPosition[] {
    const cells: CellPosition[] = []
    const { start, end } = range

    const minRow = Math.min(start.row, end.row)
    const maxRow = Math.max(start.row, end.row)

    if (columnOrder) {
      const startColIndex = columnOrder.indexOf(start.column)
      const endColIndex = columnOrder.indexOf(end.column)

      if (startColIndex !== -1 && endColIndex !== -1) {
        const minCol = Math.min(startColIndex, endColIndex)
        const maxCol = Math.max(startColIndex, endColIndex)

        for (let row = minRow; row <= maxRow; row++) {
          for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
            cells.push({
              row,
              column: columnOrder[colIndex],
            })
          }
        }
      }
    } else {
      // Fallback: seulement les cellules de début et fin
      cells.push(start, end)
    }

    return cells
  }

  /**
   * Sélectionner une plage rectangle
   */
  selectRange(start: CellPosition, end: CellPosition, multiSelect: boolean = false) {
    if (!multiSelect) {
      this.selection.ranges = []
    }

    this.selection.ranges.push({ start, end })
    this.selection.activeRange = null
    this.selection.isSelecting = false
    this.notifyListeners()
  }

  /**
   * Sélectionner toute une ligne
   */
  selectRow(row: number, columns: string[], multiSelect: boolean = false) {
    if (columns.length === 0) return

    this.selectRange(
      { row, column: columns[0] },
      { row, column: columns[columns.length - 1] },
      multiSelect
    )
  }

  /**
   * Sélectionner toute une colonne
   */
  selectColumn(column: string, rows: number[], multiSelect: boolean = false) {
    if (rows.length === 0) return

    this.selectRange({ row: rows[0], column }, { row: rows[rows.length - 1], column }, multiSelect)
  }

  /**
   * Obtenir la sélection actuelle
   */
  getSelection(): RangeSelection {
    return { ...this.selection }
  }

  /**
   * S'abonner aux changements de sélection
   */
  subscribe(listener: (selection: RangeSelection) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notifier les listeners
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener(this.selection)
    })
  }

  /**
   * Copier les données sélectionnées au format Excel
   */
  async copyToClipboard<T>(
    data: T[],
    columns: Array<{
      id: string
      key: keyof T | string
      getValue?: (row: T) => string | number | boolean | null | undefined
    }>
  ) {
    const columnOrder = columns.map((c) => c.id)
    const selectedCells = this.getAllSelectedCells(columnOrder)
    if (selectedCells.length === 0) return

    // Organiser les cellules en grille
    const cellsByRow = selectedCells.reduce(
      (acc, cell) => {
        if (!acc[cell.row]) acc[cell.row] = {}
        acc[cell.row][cell.column] = cell
        return acc
      },
      {} as Record<number, Record<string, CellPosition>>
    )

    const rows = Object.keys(cellsByRow)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b)
    const allColumns = Array.from(new Set(selectedCells.map((c) => c.column)))
    allColumns.sort((a, b) => columnOrder.indexOf(a) - columnOrder.indexOf(b))

    // Générer le texte TSV (Tab-Separated Values) pour Excel
    const tsvData = rows
      .map((rowIndex) => {
        return allColumns
          .map((columnId) => {
            const column = columns.find((c) => c.id === columnId)
            if (!column || !data[rowIndex]) return ''

            const value = column.getValue
              ? column.getValue(data[rowIndex])
              : (data[rowIndex] as Record<string, string | number | boolean | null | undefined>)[
                  column.key as string
                ]

            return String(value ?? '')
          })
          .join('\t')
      })
      .join('\n')

    // Copier dans le presse-papiers
    try {
      await navigator.clipboard.writeText(tsvData)
    } catch (_error) {}
  }

  /**
   * Remplir vers le bas (Fill Down - Ctrl+D)
   */
  fillDown<T>(
    data: T[],
    columns: Array<{ id: string; key: keyof T | string }>,
    onCellChange: (
      rowIndex: number,
      columnId: string,
      value: string | number | boolean | null | undefined
    ) => void
  ) {
    const selectedCells = this.getAllSelectedCells(columns.map((c) => c.id))
    if (selectedCells.length === 0) return

    // Grouper par colonne pour traiter chaque colonne séparément
    const cellsByColumn = selectedCells.reduce(
      (acc, cell) => {
        if (!acc[cell.column]) acc[cell.column] = []
        acc[cell.column].push(cell.row)
        return acc
      },
      {} as Record<string, number[]>
    )

    Object.entries(cellsByColumn).forEach(([columnId, rows]) => {
      rows.sort((a, b) => a - b) // Trier les lignes par ordre croissant

      if (rows.length > 1) {
        // Prendre la valeur de la première cellule
        const sourceRow = rows[0]
        const column = columns.find((c) => c.id === columnId)
        if (!column || !data[sourceRow]) return

        const sourceValue = (
          data[sourceRow] as Record<string, string | number | boolean | null | undefined>
        )[column.key as string]

        // Remplir toutes les autres cellules avec cette valeur
        for (let i = 1; i < rows.length; i++) {
          const targetRow = rows[i]
          if (data[targetRow]) {
            onCellChange(targetRow, columnId, sourceValue)
          }
        }
      }
    })
  }

  /**
   * Remplir vers la droite (Fill Right - Ctrl+R)
   */
  fillRight<T>(
    data: T[],
    columns: Array<{ id: string; key: keyof T | string }>,
    onCellChange: (
      rowIndex: number,
      columnId: string,
      value: string | number | boolean | null | undefined
    ) => void
  ) {
    const selectedCells = this.getAllSelectedCells(columns.map((c) => c.id))
    if (selectedCells.length === 0) return

    // Grouper par ligne pour traiter chaque ligne séparément
    const cellsByRow = selectedCells.reduce(
      (acc, cell) => {
        if (!acc[cell.row]) acc[cell.row] = []
        acc[cell.row].push(cell.column)
        return acc
      },
      {} as Record<number, string[]>
    )

    Object.entries(cellsByRow).forEach(([rowStr, columnIds]) => {
      const row = parseInt(rowStr, 10)
      if (!data[row]) return

      // Trier les colonnes selon leur ordre dans le tableau
      const columnOrder = columns.map((c) => c.id)
      columnIds.sort((a, b) => columnOrder.indexOf(a) - columnOrder.indexOf(b))

      if (columnIds.length > 1) {
        // Prendre la valeur de la première colonne
        const sourceColumnId = columnIds[0]
        const sourceColumn = columns.find((c) => c.id === sourceColumnId)
        if (!sourceColumn) return

        const sourceValue = (
          data[row] as Record<string, string | number | boolean | null | undefined>
        )[sourceColumn.key as string]

        // Remplir toutes les autres colonnes avec cette valeur
        for (let i = 1; i < columnIds.length; i++) {
          const targetColumnId = columnIds[i]
          onCellChange(row, targetColumnId, sourceValue)
        }
      }
    })
  }
}
