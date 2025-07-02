// packages/ui/src/types/common.ts
export type ComponentVariant = 
  | 'default' 
  | 'destructive' 
  | 'outline' 
  | 'secondary' 
  | 'ghost' 
  | 'link';

export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

export interface BaseComponentProps {
  className?: string;
  variant?: ComponentVariant;
  size?: ComponentSize;
  disabled?: boolean;
}

export interface WithChildren {
  children?: React.ReactNode;
}

export interface WithForwardRef<T = HTMLElement> {
  ref?: React.Ref<T>;
}
