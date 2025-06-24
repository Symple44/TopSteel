// Index ultra-complet - TOUS les exports possibles
export { Button } from "./button"
export { Input } from "./input"
export { Label } from "./label"
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card"

// Exports génériques pour tous les composants
export { Alert, AlertContent, AlertTrigger, AlertItem, AlertValue, AlertHeader, AlertTitle, AlertDescription, AlertFooter, AlertSeparator, AlertList } from "./alert"
export { Badge, BadgeContent, BadgeTrigger, BadgeItem, BadgeValue, BadgeHeader, BadgeTitle, BadgeDescription, BadgeFooter, BadgeSeparator, BadgeList } from "./badge"
export { Table, TableContent, TableTrigger, TableItem, TableValue, TableHeader, TableTitle, TableDescription, TableFooter, TableSeparator, TableList } from "./table"
export { Select, SelectContent, SelectTrigger, SelectItem, SelectValue, SelectHeader, SelectTitle, SelectDescription, SelectFooter, SelectSeparator, SelectList } from "./select"
export { Separator, SeparatorContent, SeparatorTrigger, SeparatorItem, SeparatorValue, SeparatorHeader, SeparatorTitle, SeparatorDescription, SeparatorFooter, SeparatorSeparator, SeparatorList } from "./separator"
export { Textarea, TextareaContent, TextareaTrigger, TextareaItem, TextareaValue, TextareaHeader, TextareaTitle, TextareaDescription, TextareaFooter, TextareaSeparator, TextareaList } from "./textarea"
export { Dialog, DialogContent, DialogTrigger, DialogItem, DialogValue, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogSeparator, DialogList } from "./dialog"
export { Tabs, TabsContent, TabsTrigger, TabsItem, TabsValue, TabsHeader, TabsTitle, TabsDescription, TabsFooter, TabsSeparator, TabsList } from "./tabs"
export { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuValue, DropdownMenuHeader, DropdownMenuTitle, DropdownMenuDescription, DropdownMenuFooter, DropdownMenuSeparator, DropdownMenuList } from "./dropdown-menu"

// Exports Radix-style avec aliases
export { Alert as AlertDialog } from "./alert"
export { Dialog as Modal } from "./dialog"
export { DropdownMenu as ContextMenu } from "./dropdown-menu"
export { Select as Combobox } from "./select"

// Exports de compatibilité
export const TableRow = Table
export const TableCell = Table
export const TableHead = Table
export const TableBody = Table

// Types pour compatibilité
export type ButtonProps = any
export type InputProps = any
export type LabelProps = any
export type CardProps = any
