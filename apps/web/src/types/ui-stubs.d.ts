// Stub types for UI components - TopSteel ERP
// Temporary solution to fix TypeScript errors

declare module "@erp/ui" {
  import type * as React from "react";
  
  // Button props with asChild support
  export interface ButtonProps {
    children?: React.ReactNode;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
    className?: string;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }
  
  export const Button: React.FC<ButtonProps>;
  
  // Select components
  export interface SelectProps {
    children?: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
  }
  
  export const Select: React.FC<SelectProps>;
  export const SelectContent: React.FC<{ children?: React.ReactNode }>;
  export const SelectItem: React.FC<{ children?: React.ReactNode; value: string }>;
  export const SelectTrigger: React.FC<{ children?: React.ReactNode; className?: string }>;
  export const SelectValue: React.FC<{ placeholder?: string }>;
  
  // Dropdown Menu components
  export const DropdownMenu: React.FC<{ children?: React.ReactNode }>;
  export const DropdownMenuContent: React.FC<{ children?: React.ReactNode }>;
  export const DropdownMenuItem: React.FC<{ children?: React.ReactNode }>;
  export const DropdownMenuLabel: React.FC<{ children?: React.ReactNode }>;
  export const DropdownMenuSeparator: React.FC<{}>;
  export const DropdownMenuTrigger: React.FC<{ children?: React.ReactNode }>;
  
  // Switch component
  export interface SwitchProps {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
  }
  
  export const Switch: React.FC<SwitchProps>;
  
  // Tooltip components  
  export interface TooltipProps {
    children?: React.ReactNode;
    delayDuration?: number;
    side?: string;
  }
  
  export const Tooltip: React.FC<TooltipProps>;
  export const TooltipContent: React.FC<{ children?: React.ReactNode; side?: string }>;
  export const TooltipProvider: React.FC<{ children?: React.ReactNode; delayDuration?: number }>;
  export const TooltipTrigger: React.FC<{ children?: React.ReactNode }>;
  
  // Alert components
  export const Alert: React.FC<{ children?: React.ReactNode }>;
  export const AlertDescription: React.FC<{ children?: React.ReactNode }>;
  export const AlertTitle: React.FC<{ children?: React.ReactNode }>;
  
  // Table components
  export const Table: React.FC<{ children?: React.ReactNode }>;
  export const TableBody: React.FC<{ children?: React.ReactNode }>;
  export const TableCell: React.FC<{ children?: React.ReactNode }>;
  export const TableHead: React.FC<{ children?: React.ReactNode }>;
  export const TableHeader: React.FC<{ children?: React.ReactNode }>;
  export const TableRow: React.FC<{ children?: React.ReactNode }>;
  export const TableCaption: React.FC<{ children?: React.ReactNode }>;
  
  // Card components
  export const Card: React.FC<{ children?: React.ReactNode }>;
  export const CardContent: React.FC<{ children?: React.ReactNode }>;
  export const CardDescription: React.FC<{ children?: React.ReactNode }>;
  export const CardFooter: React.FC<{ children?: React.ReactNode }>;
  export const CardHeader: React.FC<{ children?: React.ReactNode }>;
  export const CardTitle: React.FC<{ children?: React.ReactNode }>;
  
  // Badge component
  export interface BadgeProps {
    children?: React.ReactNode;
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "primary" | "danger";
    className?: string;
  }
  
  export const Badge: React.FC<BadgeProps>;
  
  // Avatar components
  export const Avatar: React.FC<{ children?: React.ReactNode }>;
  export const AvatarFallback: React.FC<{ children?: React.ReactNode }>;
  export const AvatarImage: React.FC<{ src?: string; alt?: string }>;
}

// Types pour les composants locaux
declare module "@/components/ui/tooltip" {
  export const TooltipProvider: React.FC<{ children?: React.ReactNode; delayDuration?: number }>;
  export const Tooltip: React.FC<{ children?: React.ReactNode }>;
  export const TooltipContent: React.FC<{ children?: React.ReactNode; side?: string }>;
  export const TooltipTrigger: React.FC<{ children?: React.ReactNode }>;
}

// Types pour les pages
declare module "@/types" {
  export * from "@erp/types";
}

declare module "@/lib/utils" {
  export * from "@erp/utils";
}

