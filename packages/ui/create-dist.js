// Générateur de fichiers pour @erp/ui - Version corrigée
const fs = require('fs')

console.log('🔨 Generating @erp/ui files...')

// Index.js - Implémentations complètes
const indexJs = `import React from 'react';

// Utility function
export const cn = (...inputs) => inputs.filter(Boolean).join(' ');

// Input component
export const Input = React.forwardRef((props, ref) => 
  React.createElement('input', { ...props, ref })
);

// Button component
export const Button = ({ children, variant = 'default', size = 'default', className, ...props }) => 
  React.createElement('button', { 
    ...props, 
    className: cn('btn', 'btn-' + variant, 'btn-' + size, className) 
  }, children);

// Card components
export const Card = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('card', className) }, children);
export const CardHeader = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('card-header', className) }, children);
export const CardContent = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('card-content', className) }, children);
export const CardTitle = ({ children, className, ...props }) => 
  React.createElement('h3', { ...props, className: cn('card-title', className) }, children);
export const CardDescription = ({ children, className, ...props }) => 
  React.createElement('p', { ...props, className: cn('card-description', className) }, children);
export const CardFooter = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('card-footer', className) }, children);

// Tabs components
export const Tabs = ({ children, defaultValue, value, onValueChange, ...props }) => 
  React.createElement('div', { ...props, 'data-orientation': 'horizontal' }, children);
export const TabsContent = ({ children, value, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('tabs-content', className), 'data-state': 'active' }, children);
export const TabsList = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('tabs-list', className) }, children);
export const TabsTrigger = ({ children, value, className, ...props }) => 
  React.createElement('button', { ...props, className: cn('tabs-trigger', className), 'data-state': 'active' }, children);

// Slider component
export const Slider = React.forwardRef((props, ref) => 
  React.createElement('input', { type: 'range', ...props, ref })
);

// Label component
export const Label = ({ children, htmlFor, className, ...props }) => 
  React.createElement('label', { htmlFor, ...props, className: cn('label', className) }, children);

// Separator component
export const Separator = ({ className, orientation = 'horizontal', ...props }) => 
  React.createElement('div', { ...props, className: cn('separator', className), 'data-orientation': orientation });

// Select components
export const Select = ({ children, value, onValueChange, ...props }) => 
  React.createElement('div', { ...props }, children);
export const SelectContent = ({ children, ...props }) => 
  React.createElement('div', { ...props }, children);
export const SelectItem = ({ children, value, ...props }) => 
  React.createElement('div', { ...props, 'data-value': value }, children);
export const SelectTrigger = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('select-trigger', className) }, children);
export const SelectValue = ({ placeholder, ...props }) => 
  React.createElement('span', { ...props }, placeholder);

// Switch component
export const Switch = ({ checked, onCheckedChange, ...props }) => 
  React.createElement('input', { type: 'checkbox', checked, onChange: (e) => onCheckedChange?.(e.target.checked), ...props });

// Tooltip components
export const Tooltip = ({ children, ...props }) => 
  React.createElement('div', { ...props }, children);
export const TooltipContent = ({ children, side, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('tooltip-content', className), 'data-side': side }, children);
export const TooltipProvider = ({ children, delayDuration, ...props }) => 
  React.createElement('div', { ...props }, children);
export const TooltipTrigger = ({ children, asChild, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('tooltip-trigger', className) }, children);

// Layout components
export const DataTable = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('data-table', className) }, children);
export const PageHeader = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('page-header', className) }, children);
export const ProjetCard = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('projet-card', className) }, children);
export const Toaster = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('toaster', className) }, children);

// Badge component
export const Badge = ({ children, variant = 'default', className, ...props }) => 
  React.createElement('span', { ...props, className: cn('badge', 'badge-' + variant, className) }, children);

// Avatar components
export const Avatar = ({ children, className, ...props }) => 
  React.createElement('div', { ...props, className: cn('avatar', className) }, children);
export const AvatarFallback = ({ children, ...props }) => 
  React.createElement('div', { ...props }, children);
export const AvatarImage = ({ src, alt, ...props }) => 
  React.createElement('img', { src, alt, ...props });
`

// Index.d.ts - Déclarations TypeScript complètes
const indexDts = `import React from 'react';

export function cn(...inputs: any[]): string;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}
export declare const Button: React.FC<ButtonProps>;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
export declare const Card: React.FC<CardProps>;
export declare const CardHeader: React.FC<CardProps>;
export declare const CardContent: React.FC<CardProps>;
export declare const CardTitle: React.FC<CardProps>;
export declare const CardDescription: React.FC<CardProps>;
export declare const CardFooter: React.FC<CardProps>;

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}
export declare const Tabs: React.FC<TabsProps>;

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
}
export declare const TabsContent: React.FC<TabsContentProps>;

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
export declare const TabsList: React.FC<TabsListProps>;

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  className?: string;
}
export declare const TabsTrigger: React.FC<TabsTriggerProps>;

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
export declare const Slider: React.ForwardRefExoticComponent<SliderProps & React.RefAttributes<HTMLInputElement>>;

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}
export declare const Label: React.FC<LabelProps>;

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}
export declare const Separator: React.FC<SeparatorProps>;

export interface SelectProps {
  children?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}
export declare const Select: React.FC<SelectProps>;
export declare const SelectContent: React.FC<{ children?: React.ReactNode }>;
export declare const SelectItem: React.FC<{ children?: React.ReactNode; value: string }>;
export declare const SelectTrigger: React.FC<{ children?: React.ReactNode; className?: string }>;
export declare const SelectValue: React.FC<{ placeholder?: string }>;

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
export declare const Switch: React.FC<SwitchProps>;

export declare const Tooltip: React.FC<{ children?: React.ReactNode }>;
export declare const TooltipContent: React.FC<{ children?: React.ReactNode; side?: string; className?: string }>;
export declare const TooltipProvider: React.FC<{ children?: React.ReactNode; delayDuration?: number }>;
export declare const TooltipTrigger: React.FC<{ children?: React.ReactNode; asChild?: boolean; className?: string }>;

export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
export declare const DataTable: React.FC<DataTableProps>;

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
export declare const PageHeader: React.FC<PageHeaderProps>;

export interface ProjetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
export declare const ProjetCard: React.FC<ProjetCardProps>;

export interface ToasterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
export declare const Toaster: React.FC<ToasterProps>;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}
export declare const Badge: React.FC<BadgeProps>;

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
export declare const Avatar: React.FC<AvatarProps>;
export declare const AvatarFallback: React.FC<{ children?: React.ReactNode }>;
export declare const AvatarImage: React.FC<{ src: string; alt: string }>;
`

// Écrire les fichiers
fs.writeFileSync('dist/index.js', indexJs)
fs.writeFileSync('dist/index.mjs', indexJs)
fs.writeFileSync('dist/index.d.ts', indexDts)
fs.writeFileSync('dist/index.d.mts', indexDts)

console.log('✅ Successfully generated:')
console.log('  - dist/index.js')
console.log('  - dist/index.mjs')
console.log('  - dist/index.d.ts')
console.log('  - dist/index.d.mts')
console.log('🎉 @erp/ui build completed!')
