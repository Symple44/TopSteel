// Override pour @erp/ui - TopSteel ERP
declare module '@erp/ui' {
  import type { ReactNode, MouseEvent, ChangeEvent } from 'react'

  // Select components avec support className complet
  export interface SelectTriggerProps {
    children?: ReactNode
    className?: string
    disabled?: boolean
    asChild?: boolean
    id?: string
  }

  export interface SelectProps {
    children?: ReactNode
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    disabled?: boolean
    name?: string
  }

  export const Select: React.ComponentType<SelectProps>
  export const SelectContent: React.ComponentType<{ children?: ReactNode; className?: string }>
  export const SelectItem: React.ComponentType<{
    children?: ReactNode
    value: string
    className?: string
  }>
  export const SelectTrigger: React.ComponentType<SelectTriggerProps>
  export const SelectValue: React.ComponentType<{ placeholder?: string; className?: string }>

  // Button avec toutes les variantes
  export interface ButtonProps {
    children?: ReactNode
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    asChild?: boolean
    className?: string
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    onClick?: (_e: MouseEvent<HTMLButtonElement>) => void
  }

  export const Button: React.ComponentType<ButtonProps>

  // Table components complets
  export const Table: React.ComponentType<{ children?: ReactNode; className?: string }>
  export const TableBody: React.ComponentType<{ children?: ReactNode; className?: string }>
  export const TableCell: React.ComponentType<{
    children?: ReactNode
    className?: string
    colSpan?: number
  }>
  export const TableHead: React.ComponentType<{ children?: ReactNode; className?: string }>
  export const TableHeader: React.ComponentType<{ children?: ReactNode; className?: string }>
  export const TableRow: React.ComponentType<{ children?: ReactNode; className?: string }>
  export const TableCaption: React.ComponentType<{ children?: ReactNode; className?: string }>

  // Dropdown Menu
  export const DropdownMenu: React.ComponentType<{ children?: ReactNode }>
  export const DropdownMenuContent: React.ComponentType<{
    children?: ReactNode
    className?: string
  align?: "start" | "end" | "center"; side?: "top" | "right" | "bottom" | "left"; }>
  export const DropdownMenuItem: React.ComponentType<{
    children?: ReactNode
    className?: string
    onClick?: () => void
  }>
  export const DropdownMenuLabel: React.ComponentType<{ children?: ReactNode; className?: string }>
  export const DropdownMenuSeparator: React.ComponentType<{ className?: string }>
  export const DropdownMenuTrigger: React.ComponentType<{
    children?: ReactNode
    asChild?: boolean
    className?: string
  }>

  // Switch
  export interface SwitchProps {
    id?: string
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (_checked: boolean) => void
    disabled?: boolean
    className?: string
    name?: string
  }

  export const Switch: React.ComponentType<SwitchProps>

  // Input et Label
  export interface InputProps {
    type?: string
    placeholder?: string
    value?: string
    defaultValue?: string
    onChange?: (_e: ChangeEvent<HTMLInputElement>) => void
    className?: string
    disabled?: boolean

    name?: string
    id?: string
  }

  export const Input: React.ComponentType<InputProps>

  export interface LabelProps {
    children?: ReactNode
    htmlFor?: string
    className?: string
  }

  export const Label: React.ComponentType<LabelProps>

  // Tooltip
  export const Tooltip: React.ComponentType<{ children?: ReactNode; delayDuration?: number }>
  export const TooltipContent: React.ComponentType<{
    children?: ReactNode
    side?: string
    className?: string
  }>
  export const TooltipProvider: React.ComponentType<{
    children?: ReactNode
    delayDuration?: number
  }>
  export const TooltipTrigger: React.ComponentType<{ children?: ReactNode; asChild?: boolean }>

  // Alert
  export const Alert: React.ComponentType<{ children?: ReactNode; className?: string }>
  export const AlertDescription: React.ComponentType<{ children?: ReactNode; className?: string }>
  export const AlertTitle: React.ComponentType<{ children?: ReactNode; className?: string }>
}

