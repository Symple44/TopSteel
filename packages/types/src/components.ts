export interface BaseComponentProps {
  readonly className?: string
  readonly children?: React.ReactNode
}

export interface MouvementStats {
  readonly date: string // FIX: était Date, maintenant string
  readonly name: string
  readonly entrees: number
  readonly sorties: number
  readonly transferts: number
  readonly valeurEntrees: number
  readonly valeurSorties: number
}

export interface MouvementsChartProps {
  readonly data: MouvementStats[]
  readonly period: 'month' | 'week' | 'quarter'
}

export interface MouvementsTableProps {
  readonly mouvements?: Mouvement[]
  readonly data?: MouvementStats[]
  readonly type?: string
  readonly onSearch?: (query: string) => void
  readonly onFilter?: (filters: any) => void
}

export interface Mouvement {
  readonly id: string
  readonly type: 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'AJUSTEMENT'
  readonly materiau: string
  readonly quantite: number
  readonly unite: string
  readonly prixUnitaire?: number
  readonly motif: string
  readonly reference?: string
  readonly emplacementSource?: string
  readonly emplacementDestination?: string
  readonly utilisateur: string
  readonly dateCreation: Date
  readonly notes?: string
}

export interface CreateMouvementDialogProps extends BaseComponentProps {
  readonly open?: boolean
  readonly onOpenChange?: (open: boolean) => void
}

export interface CreateFactureDialogProps extends BaseComponentProps {
  readonly open?: boolean
  readonly onOpenChange?: (open: boolean) => void
}

export interface SelectProps extends BaseComponentProps {
  readonly required?: boolean
}
