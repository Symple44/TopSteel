// create-dist.js - Générateur direct des fichiers @erp/ui
const fs = require('fs');
const path = require('path');

console.log('🔨 Generating @erp/ui files...');

// Créer le dossier dist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Fichier CommonJS index.js
const indexJs = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require('react');

function cn() {
  return Array.from(arguments).filter(Boolean).join(' ');
}
exports.cn = cn;

exports.Button = React.forwardRef(function Button(props, ref) {
  const { className = '', variant = 'default', size = 'default', children, ...rest } = props;
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50'
  };
  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs', 
    lg: 'h-12 px-6 text-base'
  };
  const classes = cn(baseClasses, variants[variant] || variants.default, sizes[size] || sizes.default, className);
  return React.createElement('button', { className: classes, ref, ...rest }, children);
});

exports.Card = React.forwardRef(function Card(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('rounded-lg border bg-white shadow-sm', className), ...rest }, children);
});

exports.CardHeader = React.forwardRef(function CardHeader(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('flex flex-col space-y-1.5 p-6', className), ...rest }, children);
});

exports.CardTitle = React.forwardRef(function CardTitle(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('h3', { ref, className: cn('text-2xl font-semibold leading-none tracking-tight', className), ...rest }, children);
});

exports.CardDescription = React.forwardRef(function CardDescription(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('p', { ref, className: cn('text-sm text-gray-600', className), ...rest }, children);
});

exports.CardContent = React.forwardRef(function CardContent(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('p-6 pt-0', className), ...rest }, children);
});

exports.CardFooter = React.forwardRef(function CardFooter(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('flex items-center p-6 pt-0', className), ...rest }, children);
});

exports.Input = React.forwardRef(function Input(props, ref) {
  const { className = '', type = 'text', ...rest } = props;
  return React.createElement('input', { 
    type, 
    ref, 
    className: cn('flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50', className), 
    ...rest 
  });
});

exports.Label = React.forwardRef(function Label(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('label', { ref, className: cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className), ...rest }, children);
});

// Composants stub
const stubs = ['Badge', 'Avatar', 'AvatarImage', 'AvatarFallback', 'Tabs', 'TabsContent', 'TabsList', 'TabsTrigger', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue', 'Dialog', 'DialogContent', 'DialogDescription', 'DialogFooter', 'DialogHeader', 'DialogTitle', 'DialogTrigger', 'Table', 'TableBody', 'TableCaption', 'TableCell', 'TableFooter', 'TableHead', 'TableHeader', 'TableRow', 'Alert', 'AlertDescription', 'AlertTitle', 'Toast', 'ToastAction', 'ToastClose', 'ToastDescription', 'ToastProvider', 'ToastTitle', 'ToastViewport', 'Skeleton', 'Spinner', 'Sheet', 'SheetContent', 'SheetDescription', 'SheetFooter', 'SheetHeader', 'SheetTitle', 'SheetTrigger', 'Breadcrumb', 'BreadcrumbItem', 'BreadcrumbLink', 'BreadcrumbList', 'BreadcrumbPage', 'BreadcrumbSeparator', 'Form', 'FormField', 'FormItem', 'FormLabel', 'FormControl', 'FormDescription', 'FormMessage', 'Textarea', 'Checkbox', 'RadioGroup', 'RadioGroupItem', 'Container', 'Grid', 'Stack', 'DataTable'];

stubs.forEach(name => {
  exports[name] = function(props) {
    const { children, ...rest } = props || {};
    return React.createElement('div', { 'data-component': name.toLowerCase(), ...rest }, children);
  };
});
`;

// Fichier ESM index.mjs
const indexMjs = `import React from 'react';

export function cn() {
  return Array.from(arguments).filter(Boolean).join(' ');
}

export const Button = React.forwardRef(function Button(props, ref) {
  const { className = '', variant = 'default', size = 'default', children, ...rest } = props;
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50'
  };
  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs', 
    lg: 'h-12 px-6 text-base'
  };
  const classes = cn(baseClasses, variants[variant] || variants.default, sizes[size] || sizes.default, className);
  return React.createElement('button', { className: classes, ref, ...rest }, children);
});

export const Card = React.forwardRef(function Card(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('rounded-lg border bg-white shadow-sm', className), ...rest }, children);
});

export const CardHeader = React.forwardRef(function CardHeader(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('flex flex-col space-y-1.5 p-6', className), ...rest }, children);
});

export const CardTitle = React.forwardRef(function CardTitle(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('h3', { ref, className: cn('text-2xl font-semibold leading-none tracking-tight', className), ...rest }, children);
});

export const CardDescription = React.forwardRef(function CardDescription(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('p', { ref, className: cn('text-sm text-gray-600', className), ...rest }, children);
});

export const CardContent = React.forwardRef(function CardContent(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('p-6 pt-0', className), ...rest }, children);
});

export const CardFooter = React.forwardRef(function CardFooter(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('flex items-center p-6 pt-0', className), ...rest }, children);
});

export const Input = React.forwardRef(function Input(props, ref) {
  const { className = '', type = 'text', ...rest } = props;
  return React.createElement('input', { 
    type, 
    ref, 
    className: cn('flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50', className), 
    ...rest 
  });
});

export const Label = React.forwardRef(function Label(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('label', { ref, className: cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className), ...rest }, children);
});

// Composants stub
const stubs = ['Badge', 'Avatar', 'AvatarImage', 'AvatarFallback', 'Tabs', 'TabsContent', 'TabsList', 'TabsTrigger', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue', 'Dialog', 'DialogContent', 'DialogDescription', 'DialogFooter', 'DialogHeader', 'DialogTitle', 'DialogTrigger', 'Table', 'TableBody', 'TableCaption', 'TableCell', 'TableFooter', 'TableHead', 'TableHeader', 'TableRow', 'Alert', 'AlertDescription', 'AlertTitle', 'Toast', 'ToastAction', 'ToastClose', 'ToastDescription', 'ToastProvider', 'ToastTitle', 'ToastViewport', 'Skeleton', 'Spinner', 'Sheet', 'SheetContent', 'SheetDescription', 'SheetFooter', 'SheetHeader', 'SheetTitle', 'SheetTrigger', 'Breadcrumb', 'BreadcrumbItem', 'BreadcrumbLink', 'BreadcrumbList', 'BreadcrumbPage', 'BreadcrumbSeparator', 'Form', 'FormField', 'FormItem', 'FormLabel', 'FormControl', 'FormDescription', 'FormMessage', 'Textarea', 'Checkbox', 'RadioGroup', 'RadioGroupItem', 'Container', 'Grid', 'Stack', 'DataTable'];

stubs.forEach(name => {
  const comp = function(props) {
    const { children, ...rest } = props || {};
    return React.createElement('div', { 'data-component': name.toLowerCase(), ...rest }, children);
  };
  // Export dynamique pour ESM
  eval('export const ' + name + ' = comp');
});
`;

// Fichier TypeScript definitions
const indexDts = `import * as React from 'react';

export declare function cn(...classes: string[]): string;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
export declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
export declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
export declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
export declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
export declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
export declare const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>;

export declare const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement>>;
export declare const Avatar: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export declare const AvatarImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>>;
export declare const AvatarFallback: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export declare const Tabs: React.FC<any>;
export declare const TabsContent: React.FC<any>;
export declare const TabsList: React.FC<any>;
export declare const TabsTrigger: React.FC<any>;
export declare const Select: React.FC<any>;
export declare const SelectContent: React.FC<any>;
export declare const SelectItem: React.FC<any>;
export declare const SelectTrigger: React.FC<any>;
export declare const SelectValue: React.FC<any>;
export declare const Dialog: React.FC<any>;
export declare const DialogContent: React.FC<any>;
export declare const DialogDescription: React.FC<any>;
export declare const DialogFooter: React.FC<any>;
export declare const DialogHeader: React.FC<any>;
export declare const DialogTitle: React.FC<any>;
export declare const DialogTrigger: React.FC<any>;
export declare const Table: React.FC<any>;
export declare const TableBody: React.FC<any>;
export declare const TableCaption: React.FC<any>;
export declare const TableCell: React.FC<any>;
export declare const TableFooter: React.FC<any>;
export declare const TableHead: React.FC<any>;
export declare const TableHeader: React.FC<any>;
export declare const TableRow: React.FC<any>;
export declare const Alert: React.FC<any>;
export declare const AlertDescription: React.FC<any>;
export declare const AlertTitle: React.FC<any>;
export declare const Toast: React.FC<any>;
export declare const ToastAction: React.FC<any>;
export declare const ToastClose: React.FC<any>;
export declare const ToastDescription: React.FC<any>;
export declare const ToastProvider: React.FC<any>;
export declare const ToastTitle: React.FC<any>;
export declare const ToastViewport: React.FC<any>;
export declare const Skeleton: React.FC<any>;
export declare const Spinner: React.FC<any>;
export declare const Sheet: React.FC<any>;
export declare const SheetContent: React.FC<any>;
export declare const SheetDescription: React.FC<any>;
export declare const SheetFooter: React.FC<any>;
export declare const SheetHeader: React.FC<any>;
export declare const SheetTitle: React.FC<any>;
export declare const SheetTrigger: React.FC<any>;
export declare const Breadcrumb: React.FC<any>;
export declare const BreadcrumbItem: React.FC<any>;
export declare const BreadcrumbLink: React.FC<any>;
export declare const BreadcrumbList: React.FC<any>;
export declare const BreadcrumbPage: React.FC<any>;
export declare const BreadcrumbSeparator: React.FC<any>;
export declare const Form: React.FC<any>;
export declare const FormField: React.FC<any>;
export declare const FormItem: React.FC<any>;
export declare const FormLabel: React.FC<any>;
export declare const FormControl: React.FC<any>;
export declare const FormDescription: React.FC<any>;
export declare const FormMessage: React.FC<any>;
export declare const Textarea: React.FC<any>;
export declare const Checkbox: React.FC<any>;
export declare const RadioGroup: React.FC<any>;
export declare const RadioGroupItem: React.FC<any>;
export declare const Container: React.FC<any>;
export declare const Grid: React.FC<any>;
export declare const Stack: React.FC<any>;
export declare const DataTable: React.FC<any>;
`;

// Écrire tous les fichiers
try {
  fs.writeFileSync(path.join(distDir, 'index.js'), indexJs);
  fs.writeFileSync(path.join(distDir, 'index.mjs'), indexMjs);
  fs.writeFileSync(path.join(distDir, 'index.d.ts'), indexDts);
  fs.writeFileSync(path.join(distDir, 'index.d.mts'), indexDts);
  
  console.log('✅ Successfully generated:');
  console.log('  - dist/index.js');
  console.log('  - dist/index.mjs');
  console.log('  - dist/index.d.ts');
  console.log('  - dist/index.d.mts');
  console.log('🎉 @erp/ui build completed!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
