// Global type declaration for @erp/ui
// This ensures TypeScript recognizes all components that exist at runtime

declare module '@erp/ui' {
  import type { ComponentType } from 'react'

  // All components are typed as ComponentType<unknown> since they work at runtime
  export const Badge: ComponentType<unknown>
  export const Button: ComponentType<unknown>
  export const Card: ComponentType<unknown>
  export const CardContent: ComponentType<unknown>
  export const CardDescription: ComponentType<unknown>
  export const CardHeader: ComponentType<unknown>
  export const CardTitle: ComponentType<unknown>
  export const CardFooter: ComponentType<unknown>
  export const Input: ComponentType<unknown>
  export const Label: ComponentType<unknown>
  export const Textarea: ComponentType<unknown>
  export const Select: ComponentType<unknown>
  export const SelectContent: ComponentType<unknown>
  export const SelectItem: ComponentType<unknown>
  export const SelectTrigger: ComponentType<unknown>
  export const SelectValue: ComponentType<unknown>
  export const Separator: ComponentType<unknown>
  export const Table: ComponentType<unknown>
  export const TableBody: ComponentType<unknown>
  export const TableCell: ComponentType<unknown>
  export const TableHead: ComponentType<unknown>
  export const TableHeader: ComponentType<unknown>
  export const TableRow: ComponentType<unknown>
  export const Tabs: ComponentType<unknown>
  export const TabsContent: ComponentType<unknown>
  export const TabsList: ComponentType<unknown>
  export const TabsTrigger: ComponentType<unknown>
  export const Dialog: ComponentType<unknown>
  export const DialogContent: ComponentType<unknown>
  export const DialogHeader: ComponentType<unknown>
  export const DialogTitle: ComponentType<unknown>
  export const DialogDescription: ComponentType<unknown>
  export const DialogFooter: ComponentType<unknown>
  export const DialogTrigger: ComponentType<unknown>
  export const Alert: ComponentType<unknown>
  export const AlertDescription: ComponentType<unknown>
  export const AlertTitle: ComponentType<unknown>
  export const Avatar: ComponentType<unknown>
  export const AvatarImage: ComponentType<unknown>
  export const AvatarFallback: ComponentType<unknown>
  export const Progress: ComponentType<unknown>
  export const Checkbox: ComponentType<unknown>
  export const RadioGroup: ComponentType<unknown>
  export const RadioGroupItem: ComponentType<unknown>
  export const Switch: ComponentType<unknown>
  export const Tooltip: ComponentType<unknown>
  export const TooltipContent: ComponentType<unknown>
  export const TooltipProvider: ComponentType<unknown>
  export const TooltipTrigger: ComponentType<unknown>
  export const Toaster: ComponentType<unknown>
  export const DropdownMenu: ComponentType<unknown>
  export const DropdownMenuContent: ComponentType<unknown>
  export const DropdownMenuItem: ComponentType<unknown>
  export const DropdownMenuTrigger: ComponentType<unknown>
  export const DropdownMenuSeparator: ComponentType<unknown>
  export const DataTable: ComponentType<unknown>
  export const ErrorAlert: ComponentType<unknown>
  export const PageHeader: ComponentType<unknown>
  export const ProjetCard: ComponentType<unknown>
  export const ThemeSwitcher: ComponentType<unknown>
  export const ScrollArea: ComponentType<unknown>
  export const ScrollBar: ComponentType<unknown>

  // Utility function
  export function cn(...args: unknown[]): string

  // Variants
  export const badgeVariants: unknown
  export const buttonVariants: unknown
  export const alertVariants: unknown
}
