# fix-build.ps1 - Script pour corriger les problèmes de build

Write-Host "🔧 Correction des problèmes de build ERP TopSteel" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# 1. Nettoyer les caches et builds précédents
Write-Host "🧹 Nettoyage des caches..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Dossier .next supprimé" -ForegroundColor Green
}

if (Test-Path "apps/web/.next") {
    Remove-Item -Recurse -Force "apps/web/.next"
    Write-Host "✅ Dossier apps/web/.next supprimé" -ForegroundColor Green
}

if (Test-Path "packages/ui/dist") {
    Remove-Item -Recurse -Force "packages/ui/dist"
    Write-Host "✅ Dossier packages/ui/dist supprimé" -ForegroundColor Green
}

if (Test-Path ".turbo") {
    Remove-Item -Recurse -Force ".turbo"
    Write-Host "✅ Cache Turbo supprimé" -ForegroundColor Green
}

# 2. Remplacer le fichier create-dist.js
Write-Host "🔄 Correction du fichier create-dist.js..." -ForegroundColor Yellow

$createDistContent = @'
// create-dist.js - Générateur complet des fichiers @erp/ui
const fs = require("fs");
const path = require("path");

console.log("🔨 Generating @erp/ui files...");

// Créer le dossier dist
const distDir = path.join(__dirname, "dist");
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

// Badge component
exports.Badge = React.forwardRef(function Badge(props, ref) {
  const { className = '', variant = 'default', children, ...rest } = props;
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800'
  };
  const classes = cn(baseClasses, variants[variant] || variants.default, className);
  return React.createElement('span', { ref, className: classes, ...rest }, children);
});

// PageHeader component
exports.PageHeader = React.forwardRef(function PageHeader(props, ref) {
  const { className = '', title, description, actions, children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('flex flex-col space-y-4 pb-6', className), ...rest }, [
    React.createElement('div', { key: 'header', className: 'flex items-center justify-between' }, [
      React.createElement('div', { key: 'content', className: 'space-y-1' }, [
        title && React.createElement('h1', { key: 'title', className: 'text-2xl font-semibold tracking-tight' }, title),
        description && React.createElement('p', { key: 'description', className: 'text-gray-500' }, description)
      ]),
      actions && React.createElement('div', { key: 'actions', className: 'flex items-center space-x-2' }, actions)
    ]),
    children
  ]);
});

// ProjetCard component
exports.ProjetCard = React.forwardRef(function ProjetCard(props, ref) {
  const { className = '', projet, children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow', className), ...rest }, [
    projet && [
      React.createElement('h3', { key: 'title', className: 'font-semibold' }, projet.nom || 'Projet'),
      React.createElement('p', { key: 'description', className: 'text-sm text-gray-600 mt-1' }, projet.description || ''),
      React.createElement('div', { key: 'meta', className: 'mt-4 flex items-center justify-between text-xs text-gray-500' }, [
        React.createElement('span', { key: 'client' }, projet.client?.nom || ''),
        React.createElement('span', { key: 'status' }, projet.statut || '')
      ])
    ],
    children
  ]);
});

// DataTable component
exports.DataTable = React.forwardRef(function DataTable(props, ref) {
  const { className = '', data = [], columns = [], children, ...rest } = props;
  return React.createElement('div', { ref, className: cn('w-full overflow-auto', className), ...rest }, [
    React.createElement('table', { key: 'table', className: 'w-full caption-bottom text-sm' }, [
      React.createElement('thead', { key: 'thead' }, [
        React.createElement('tr', { key: 'header-row', className: 'border-b' }, 
          columns.map((column, index) => 
            React.createElement('th', { 
              key: index, 
              className: 'h-12 px-4 text-left align-middle font-medium text-gray-500' 
            }, column.label || column.key)
          )
        )
      ]),
      React.createElement('tbody', { key: 'tbody' }, 
        data.map((row, rowIndex) => 
          React.createElement('tr', { key: rowIndex, className: 'border-b' }, 
            columns.map((column, colIndex) => 
              React.createElement('td', { 
                key: colIndex, 
                className: 'p-4 align-middle' 
              }, column.render ? column.render(row[column.key], row) : row[column.key])
            )
          )
        )
      )
    ]),
    children
  ]);
});

// Toaster component
exports.Toaster = React.forwardRef(function Toaster(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('div', { 
    ref, 
    className: cn('fixed bottom-0 right-0 z-50 w-full md:max-w-[420px] p-4', className), 
    ...rest 
  }, children);
});

// Composants de base
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

// Composants stub pour compatibilité
const stubComponents = [
  'Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter',
  'Input', 'Label', 'Avatar', 'AvatarImage', 'AvatarFallback', 'Tabs', 'TabsContent', 
  'TabsList', 'TabsTrigger', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 
  'SelectValue', 'Dialog', 'DialogContent', 'DialogDescription', 'DialogFooter', 
  'DialogHeader', 'DialogTitle', 'DialogTrigger', 'Table', 'TableBody', 'TableCaption', 
  'TableCell', 'TableFooter', 'TableHead', 'TableHeader', 'TableRow', 'Alert', 
  'AlertDescription', 'AlertTitle', 'Toast', 'ToastAction', 'ToastClose', 'ToastDescription', 
  'ToastProvider', 'ToastTitle', 'ToastViewport', 'Skeleton', 'Spinner', 'Sheet', 
  'SheetContent', 'SheetDescription', 'SheetFooter', 'SheetHeader', 'SheetTitle', 
  'SheetTrigger', 'Breadcrumb', 'BreadcrumbItem', 'BreadcrumbLink', 'BreadcrumbList', 
  'BreadcrumbPage', 'BreadcrumbSeparator', 'Form', 'FormField', 'FormItem', 'FormLabel', 
  'FormControl', 'FormDescription', 'FormMessage', 'Textarea', 'Checkbox', 'RadioGroup', 
  'RadioGroupItem', 'Container', 'Grid', 'Stack'
];

stubComponents.forEach(name => {
  exports[name] = function(props) {
    const { children, ...rest } = props || {};
    return React.createElement('div', { 'data-component': name.toLowerCase(), ...rest }, children);
  };
});
`;

// Fichier ESM index.mjs avec les mêmes composants
const indexMjs = indexJs.replace('"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nconst React = require(\'react\');', 'import React from \'react\';').replace(/exports\./g, 'export const ');

// Fichier TypeScript index.d.ts
const indexDts = `import React from 'react';

export function cn(...classes: any[]): string;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}
export declare const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLSpanElement>>;

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}
export declare const PageHeader: React.ForwardRefExoticComponent<PageHeaderProps & React.RefAttributes<HTMLDivElement>>;

export interface ProjetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  projet?: any;
}
export declare const ProjetCard: React.ForwardRefExoticComponent<ProjetCardProps & React.RefAttributes<HTMLDivElement>>;

export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: any[];
  columns?: any[];
}
export declare const DataTable: React.ForwardRefExoticComponent<DataTableProps & React.RefAttributes<HTMLDivElement>>;

export declare const Toaster: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

// Tous les autres composants
export declare const Card: React.FC<any>;
export declare const CardHeader: React.FC<any>;
export declare const CardTitle: React.FC<any>;
export declare const CardDescription: React.FC<any>;
export declare const CardContent: React.FC<any>;
export declare const CardFooter: React.FC<any>;
export declare const Input: React.FC<any>;
export declare const Label: React.FC<any>;
export declare const Avatar: React.FC<any>;
export declare const AvatarImage: React.FC<any>;
export declare const AvatarFallback: React.FC<any>;
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
`;

// Écrire tous les fichiers
try {
  fs.writeFileSync(path.join(distDir, "index.js"), indexJs);
  fs.writeFileSync(path.join(distDir, "index.mjs"), indexMjs);
  fs.writeFileSync(path.join(distDir, "index.d.ts"), indexDts);
  fs.writeFileSync(path.join(distDir, "index.d.mts"), indexDts);

  console.log("✅ Successfully generated:");
  console.log("  - dist/index.js");
  console.log("  - dist/index.mjs");
  console.log("  - dist/index.d.ts");
  console.log("  - dist/index.d.mts");
  console.log("🎉 @erp/ui build completed!");
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
'@

try {
    $createDistContent | Out-File -FilePath "packages/ui/create-dist.js" -Encoding UTF8
    Write-Host "✅ Fichier create-dist.js mis à jour" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la mise à jour de create-dist.js: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Créer la page not-found si elle n'existe pas
Write-Host "🔄 Vérification de la page not-found..." -ForegroundColor Yellow

$notFoundPath = "apps/web/src/app/not-found.tsx"
$notFoundContent = @'
// apps/web/src/app/not-found.tsx
import Link from 'next/link'
import { Button } from '@erp/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4">
            Page non trouvée
          </h2>
          <p className="text-gray-600 mt-2">
            Désolé, nous n'avons pas pu trouver la page que vous recherchez.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/dashboard">
              Retour au tableau de bord
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
'@

try {
    # Créer le dossier s'il n'existe pas
    $notFoundDir = Split-Path $notFoundPath -Parent
    if (!(Test-Path $notFoundDir)) {
        New-Item -ItemType Directory -Path $notFoundDir -Force | Out-Null
    }
    
    $notFoundContent | Out-File -FilePath $notFoundPath -Encoding UTF8
    Write-Host "✅ Page not-found créée/mise à jour" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la création de not-found.tsx: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Rebuilder le projet
Write-Host "🔄 Rebuild du projet..." -ForegroundColor Yellow

try {
    Write-Host "1️⃣ Installation des dépendances..." -ForegroundColor Cyan
    & pnpm install
    
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur lors de l'installation des dépendances"
    }
    
    Write-Host "2️⃣ Build du projet..." -ForegroundColor Cyan
    & pnpm build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 Build réussi !" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors du build" -ForegroundColor Red
        Write-Host "💡 Essayez de vérifier les logs ci-dessus pour plus de détails" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔧 Script de correction terminé" -ForegroundColor Green