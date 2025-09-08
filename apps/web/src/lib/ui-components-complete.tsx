/**
 * Complete UI Components with full React 19 compatibility
 * Direct re-export from @erp/ui with proper typing
 */

'use client'

// Additional business exports
export type { ReorderableListConfig } from '@erp/ui'
// Direct re-exports from the UI package with full type preservation
// Navigation - Dropdown Components (from main @erp/ui export)
// Business Components (from main @erp/ui export)
export {
  // Feedback Components
  Alert,
  AlertDescription,
  AlertTitle,
  // Data Display Components
  Avatar,
  AvatarFallback,
  Badge,
  // Core UI Components
  Button,
  type ButtonProps,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  // Input Components
  Checkbox,
  type ColumnConfig,
  // Utility
  cn,
  // Data Display - DataTable
  // @ts-expect-error - Temporary TypeScript fix
  DataTable,
  // Dialog Components
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  // Form Components
  Input,
  type InputProps,
  Label,
  PageHeader,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  // Common UI components
  SimpleTooltip,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  // Layout Components
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  type TextareaProps,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@erp/ui'

// Re-export commonly used icon components for convenience
export {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Edit,
  Home,
  Info,
  Menu,
  Minus,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Trash2,
  Upload,
  User,
  X,
  XCircle,
} from 'lucide-react'
