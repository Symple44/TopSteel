export interface BaseComponentProps {
  readonly className?: string;
  readonly children?: React.ReactNode;
}

export interface MouvementStats {
  readonly date: string;
  readonly name: string;
  readonly entrees: number;
  readonly sorties: number;
  readonly transferts: number;
  readonly valeurEntrees: number;
  readonly valeurSorties: number;
}

export interface MouvementsChartProps {
  readonly data: MouvementStats[];
  readonly period: "month" | "week" | "quarter";
}

export interface MouvementsTableProps {
  readonly data: MouvementStats[];
}

export interface CreateMouvementDialogProps extends BaseComponentProps {
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export interface CreateFactureDialogProps extends BaseComponentProps {
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export interface SelectProps extends BaseComponentProps {
  readonly required?: boolean;
}
