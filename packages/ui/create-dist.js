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

// Composants stub pour compatibilité
exports.Avatar = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'avatar', ...rest }, children);
};

exports.AvatarImage = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('img', { 'data-component': 'avatarimage', ...rest });
};

exports.AvatarFallback = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'avatarfallback', ...rest }, children);
};

exports.Tabs = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'tabs', ...rest }, children);
};

exports.TabsContent = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'tabscontent', ...rest }, children);
};

exports.TabsList = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'tabslist', ...rest }, children);
};

exports.TabsTrigger = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'tabstrigger', ...rest }, children);
};

exports.Select = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'select', ...rest }, children);
};

exports.SelectContent = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'selectcontent', ...rest }, children);
};

exports.SelectItem = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'selectitem', ...rest }, children);
};

exports.SelectTrigger = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'selecttrigger', ...rest }, children);
};

exports.SelectValue = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('span', { 'data-component': 'selectvalue', ...rest }, children);
};

exports.Dialog = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'dialog', ...rest }, children);
};

exports.DialogContent = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'dialogcontent', ...rest }, children);
};

exports.DialogDescription = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'dialogdescription', ...rest }, children);
};

exports.DialogFooter = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'dialogfooter', ...rest }, children);
};

exports.DialogHeader = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'dialogheader', ...rest }, children);
};

exports.DialogTitle = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('h2', { 'data-component': 'dialogtitle', ...rest }, children);
};

exports.DialogTrigger = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'dialogtrigger', ...rest }, children);
};

exports.Table = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('table', { 'data-component': 'table', ...rest }, children);
};

exports.TableBody = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('tbody', { 'data-component': 'tablebody', ...rest }, children);
};

exports.TableCaption = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('caption', { 'data-component': 'tablecaption', ...rest }, children);
};

exports.TableCell = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('td', { 'data-component': 'tablecell', ...rest }, children);
};

exports.TableFooter = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('tfoot', { 'data-component': 'tablefooter', ...rest }, children);
};

exports.TableHead = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('th', { 'data-component': 'tablehead', ...rest }, children);
};

exports.TableHeader = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('thead', { 'data-component': 'tableheader', ...rest }, children);
};

exports.TableRow = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('tr', { 'data-component': 'tablerow', ...rest }, children);
};

exports.Alert = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'alert', ...rest }, children);
};

exports.AlertDescription = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'alertdescription', ...rest }, children);
};

exports.AlertTitle = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('h3', { 'data-component': 'alerttitle', ...rest }, children);
};

exports.Toast = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'toast', ...rest }, children);
};

exports.ToastAction = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'toastaction', ...rest }, children);
};

exports.ToastClose = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'toastclose', ...rest }, children);
};

exports.ToastDescription = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'toastdescription', ...rest }, children);
};

exports.ToastProvider = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'toastprovider', ...rest }, children);
};

exports.ToastTitle = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('h3', { 'data-component': 'toasttitle', ...rest }, children);
};

exports.ToastViewport = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'toastviewport', ...rest }, children);
};

exports.Skeleton = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'skeleton', ...rest }, children);
};

exports.Spinner = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'spinner', ...rest }, children);
};

exports.Sheet = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'sheet', ...rest }, children);
};

exports.SheetContent = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'sheetcontent', ...rest }, children);
};

exports.SheetDescription = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'sheetdescription', ...rest }, children);
};

exports.SheetFooter = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'sheetfooter', ...rest }, children);
};

exports.SheetHeader = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'sheetheader', ...rest }, children);
};

exports.SheetTitle = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('h2', { 'data-component': 'sheettitle', ...rest }, children);
};

exports.SheetTrigger = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'sheettrigger', ...rest }, children);
};

exports.Breadcrumb = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('nav', { 'data-component': 'breadcrumb', ...rest }, children);
};

exports.BreadcrumbItem = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('li', { 'data-component': 'breadcrumbitem', ...rest }, children);
};

exports.BreadcrumbLink = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('a', { 'data-component': 'breadcrumblink', ...rest }, children);
};

exports.BreadcrumbList = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('ol', { 'data-component': 'breadcrumblist', ...rest }, children);
};

exports.BreadcrumbPage = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('span', { 'data-component': 'breadcrumbpage', ...rest }, children);
};

exports.BreadcrumbSeparator = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('span', { 'data-component': 'breadcrumbseparator', ...rest }, children);
};

exports.Form = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('form', { 'data-component': 'form', ...rest }, children);
};

exports.FormField = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'formfield', ...rest }, children);
};

exports.FormItem = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'formitem', ...rest }, children);
};

exports.FormLabel = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('label', { 'data-component': 'formlabel', ...rest }, children);
};

exports.FormControl = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'formcontrol', ...rest }, children);
};

exports.FormDescription = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'formdescription', ...rest }, children);
};

exports.FormMessage = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'formmessage', ...rest }, children);
};

exports.Textarea = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('textarea', { 'data-component': 'textarea', ...rest }, children);
};

exports.Checkbox = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('input', { type: 'checkbox', 'data-component': 'checkbox', ...rest });
};

exports.RadioGroup = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'radiogroup', ...rest }, children);
};

exports.RadioGroupItem = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('input', { type: 'radio', 'data-component': 'radiogroupitem', ...rest });
};

exports.Container = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'container', ...rest }, children);
};

exports.Grid = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'grid', ...rest }, children);
};

exports.Stack = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'stack', ...rest }, children);
};
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

// Badge component
export const Badge = React.forwardRef(function Badge(props, ref) {
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
export const PageHeader = React.forwardRef(function PageHeader(props, ref) {
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
export const ProjetCard = React.forwardRef(function ProjetCard(props, ref) {
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
export const DataTable = React.forwardRef(function DataTable(props, ref) {
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
export const Toaster = React.forwardRef(function Toaster(props, ref) {
  const { className = '', children, ...rest } = props;
  return React.createElement('div', { 
    ref, 
    className: cn('fixed bottom-0 right-0 z-50 w-full md:max-w-[420px] p-4', className), 
    ...rest 
  }, children);
});

// Composants stub pour compatibilité
export const Avatar = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'avatar', ...rest }, children);
};

export const AvatarImage = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('img', { 'data-component': 'avatarimage', ...rest });
};

export const AvatarFallback = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'avatarfallback', ...rest }, children);
};

export const Tabs = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'tabs', ...rest }, children);
};

export const TabsContent = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'tabscontent', ...rest }, children);
};

export const TabsList = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'tabslist', ...rest }, children);
};

export const TabsTrigger = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'tabstrigger', ...rest }, children);
};

export const Select = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'select', ...rest }, children);
};

export const SelectContent = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'selectcontent', ...rest }, children);
};

export const SelectItem = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'selectitem', ...rest }, children);
};

export const SelectTrigger = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'selecttrigger', ...rest }, children);
};

export const SelectValue = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('span', { 'data-component': 'selectvalue', ...rest }, children);
};

export const Dialog = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'dialog', ...rest }, children);
};

export const DialogContent = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'dialogcontent', ...rest }, children);
};

export const DialogDescription = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'dialogdescription', ...rest }, children);
};

export const DialogFooter = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'dialogfooter', ...rest }, children);
};

export const DialogHeader = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'dialogheader', ...rest }, children);
};

export const DialogTitle = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('h2', { 'data-component': 'dialogtitle', ...rest }, children);
};

export const DialogTrigger = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'dialogtrigger', ...rest }, children);
};

export const Table = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('table', { 'data-component': 'table', ...rest }, children);
};

export const TableBody = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('tbody', { 'data-component': 'tablebody', ...rest }, children);
};

export const TableCaption = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('caption', { 'data-component': 'tablecaption', ...rest }, children);
};

export const TableCell = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('td', { 'data-component': 'tablecell', ...rest }, children);
};

export const TableFooter = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('tfoot', { 'data-component': 'tablefooter', ...rest }, children);
};

export const TableHead = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('th', { 'data-component': 'tablehead', ...rest }, children);
};

export const TableHeader = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('thead', { 'data-component': 'tableheader', ...rest }, children);
};

export const TableRow = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('tr', { 'data-component': 'tablerow', ...rest }, children);
};

export const Alert = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'alert', ...rest }, children);
};

export const AlertDescription = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'alertdescription', ...rest }, children);
};

export const AlertTitle = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('h3', { 'data-component': 'alerttitle', ...rest }, children);
};

export const Toast = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'toast', ...rest }, children);
};

export const ToastAction = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'toastaction', ...rest }, children);
};

export const ToastClose = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'toastclose', ...rest }, children);
};

export const ToastDescription = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'toastdescription', ...rest }, children);
};

export const ToastProvider = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'toastprovider', ...rest }, children);
};

export const ToastTitle = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('h3', { 'data-component': 'toasttitle', ...rest }, children);
};

export const ToastViewport = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'toastviewport', ...rest }, children);
};

export const Skeleton = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'skeleton', ...rest }, children);
};

export const Spinner = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'spinner', ...rest }, children);
};

export const Sheet = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'sheet', ...rest }, children);
};

export const SheetContent = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'sheetcontent', ...rest }, children);
};

export const SheetDescription = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'sheetdescription', ...rest }, children);
};

export const SheetFooter = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'sheetfooter', ...rest }, children);
};

export const SheetHeader = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'sheetheader', ...rest }, children);
};

export const SheetTitle = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('h2', { 'data-component': 'sheettitle', ...rest }, children);
};

export const SheetTrigger = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('button', { 'data-component': 'sheettrigger', ...rest }, children);
};

export const Breadcrumb = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('nav', { 'data-component': 'breadcrumb', ...rest }, children);
};

export const BreadcrumbItem = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('li', { 'data-component': 'breadcrumbitem', ...rest }, children);
};

export const BreadcrumbLink = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('a', { 'data-component': 'breadcrumblink', ...rest }, children);
};

export const BreadcrumbList = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('ol', { 'data-component': 'breadcrumblist', ...rest }, children);
};

export const BreadcrumbPage = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('span', { 'data-component': 'breadcrumbpage', ...rest }, children);
};

export const BreadcrumbSeparator = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('span', { 'data-component': 'breadcrumbseparator', ...rest }, children);
};

export const Form = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('form', { 'data-component': 'form', ...rest }, children);
};

export const FormField = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'formfield', ...rest }, children);
};

export const FormItem = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'formitem', ...rest }, children);
};

export const FormLabel = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('label', { 'data-component': 'formlabel', ...rest }, children);
};

export const FormControl = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'formcontrol', ...rest }, children);
};

export const FormDescription = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'formdescription', ...rest }, children);
};

export const FormMessage = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('p', { 'data-component': 'formmessage', ...rest }, children);
};

export const Textarea = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('textarea', { 'data-component': 'textarea', ...rest }, children);
};

export const Checkbox = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('input', { type: 'checkbox', 'data-component': 'checkbox', ...rest });
};

export const RadioGroup = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'radiogroup', ...rest }, children);
};

export const RadioGroupItem = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('input', { type: 'radio', 'data-component': 'radiogroupitem', ...rest });
};

export const Container = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'container', ...rest }, children);
};

export const Grid = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'grid', ...rest }, children);
};

export const Stack = function(props) {
  const { children, ...rest } = props || {};
  return React.createElement('div', { 'data-component': 'stack', ...rest }, children);
};
`;

// Fichier TypeScript index.d.ts
const indexDts = `import React from 'react';

export function cn(...classes: any[]): string;

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

// Composants spécialisés TopSteel
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

// Autres composants
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
