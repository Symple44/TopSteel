// Global type declaration for @erp/ui
// This ensures TypeScript recognizes all components that exist at runtime

declare module '@erp/ui' {
  import type { ComponentType } from 'react'

  // All components are typed as FC<any> since they work at runtime
  export const Badge: ComponentType<any>
  export const Button: ComponentType<any>
  export const Card: ComponentType<any>
  export const CardContent: ComponentType<any>
  export const CardDescription: ComponentType<any>
  export const CardHeader: ComponentType<any>
  export const CardTitle: ComponentType<any>
  export const CardFooter: ComponentType<any>
  export const Input: ComponentType<any>
  export const Label: ComponentType<any>
  export const Textarea: ComponentType<any>
  export const Select: ComponentType<any>
  export const SelectContent: ComponentType<any>
  export const SelectItem: ComponentType<any>
  export const SelectTrigger: ComponentType<any>
  export const SelectValue: ComponentType<any>
  export const Separator: ComponentType<any>
  export const Table: ComponentType<any>
  export const TableBody: ComponentType<any>
  export const TableCell: ComponentType<any>
  export const TableHead: ComponentType<any>
  export const TableHeader: ComponentType<any>
  export const TableRow: ComponentType<any>
  export const Tabs: ComponentType<any>
  export const TabsContent: ComponentType<any>
  export const TabsList: ComponentType<any>
  export const TabsTrigger: ComponentType<any>
  export const Dialog: ComponentType<any>
  export const DialogContent: ComponentType<any>
  export const DialogHeader: ComponentType<any>
  export const DialogTitle: ComponentType<any>
  export const DialogDescription: ComponentType<any>
  export const DialogFooter: ComponentType<any>
  export const DialogTrigger: ComponentType<any>
  export const Alert: ComponentType<any>
  export const AlertDescription: ComponentType<any>
  export const AlertTitle: ComponentType<any>
  export const Avatar: ComponentType<any>
  export const AvatarImage: ComponentType<any>
  export const AvatarFallback: ComponentType<any>
  export const Progress: ComponentType<any>
  export const Checkbox: ComponentType<any>
  export const RadioGroup: ComponentType<any>
  export const RadioGroupItem: ComponentType<any>
  export const Switch: ComponentType<any>
  export const Tooltip: ComponentType<any>
  export const TooltipContent: ComponentType<any>
  export const TooltipProvider: ComponentType<any>
  export const TooltipTrigger: ComponentType<any>
  export const Toaster: ComponentType<any>
  export const DropdownMenu: ComponentType<any>
  export const DropdownMenuContent: ComponentType<any>
  export const DropdownMenuItem: ComponentType<any>
  export const DropdownMenuTrigger: ComponentType<any>
  export const DropdownMenuSeparator: ComponentType<any>
  export const DataTable: ComponentType<any>
  export const ErrorAlert: ComponentType<any>
  export const PageHeader: ComponentType<any>
  export const ProjetCard: ComponentType<any>
  export const ThemeSwitcher: ComponentType<any>
  export const ScrollArea: ComponentType<any>
  export const ScrollBar: ComponentType<any>

  // Utility function
  export function cn(...args: any[]): string

  // Variants
  export const badgeVariants: any
  export const buttonVariants: any
  export const alertVariants: any
}
