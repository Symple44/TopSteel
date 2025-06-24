// Package @erp/ui - Version simplifiée pour résoudre les erreurs de build

import * as React from 'react';

// Utilitaire de base
export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

// Composant Button simple
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50';
    
    const variantClasses = {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50'
    };
    
    const sizeClasses = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-12 px-6 text-base'
    };
    
    const combinedClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button
        className={combinedClasses}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

// Composant Card simple
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-white shadow-sm', className)}
      {...props}
    />
  )
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-600', className)} {...props} />
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);

CardFooter.displayName = 'CardFooter';

// Composant Input simple
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

// Composant Label simple
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  )
);

Label.displayName = 'Label';

// Composants stub simples pour éviter les erreurs d'import
export const Badge = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800', className)} {...props}>
    {children}
  </span>
);

export const Avatar = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)} {...props}>
    {children}
  </div>
);

export const AvatarImage = ({ className = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img className={cn('aspect-square h-full w-full', className)} {...props} />
);

export const AvatarFallback = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex h-full w-full items-center justify-center rounded-full bg-gray-100', className)} {...props}>
    {children}
  </div>
);

// Exports groupés pour compatibilité
export type { ButtonProps, CardProps, InputProps, LabelProps };

// Autres exports vides pour éviter les erreurs
export const Tabs = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const TabsContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const TabsList = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const TabsTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>;

export const Select = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectItem = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>;
export const SelectValue = ({ children, ...props }: any) => <span {...props}>{children}</span>;

export const Dialog = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogDescription = ({ children, ...props }: any) => <p {...props}>{children}</p>;
export const DialogFooter = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogHeader = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogTitle = ({ children, ...props }: any) => <h2 {...props}>{children}</h2>;
export const DialogTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>;

export const Table = ({ children, ...props }: any) => <table {...props}>{children}</table>;
export const TableBody = ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>;
export const TableCaption = ({ children, ...props }: any) => <caption {...props}>{children}</caption>;
export const TableCell = ({ children, ...props }: any) => <td {...props}>{children}</td>;
export const TableFooter = ({ children, ...props }: any) => <tfoot {...props}>{children}</tfoot>;
export const TableHead = ({ children, ...props }: any) => <th {...props}>{children}</th>;
export const TableHeader = ({ children, ...props }: any) => <thead {...props}>{children}</thead>;
export const TableRow = ({ children, ...props }: any) => <tr {...props}>{children}</tr>;

// Autres composants stub
export const Alert = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const AlertDescription = ({ children, ...props }: any) => <p {...props}>{children}</p>;
export const AlertTitle = ({ children, ...props }: any) => <h4 {...props}>{children}</h4>;

export const Toast = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const ToastAction = ({ children, ...props }: any) => <button {...props}>{children}</button>;
export const ToastClose = ({ children, ...props }: any) => <button {...props}>{children}</button>;
export const ToastDescription = ({ children, ...props }: any) => <p {...props}>{children}</p>;
export const ToastProvider = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const ToastTitle = ({ children, ...props }: any) => <h4 {...props}>{children}</h4>;
export const ToastViewport = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const Skeleton = ({ className = '', ...props }: any) => (
  <div className={cn('animate-pulse rounded-md bg-gray-200', className)} {...props} />
);

export const Spinner = ({ className = '', ...props }: any) => (
  <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-gray-600', className)} {...props} />
);

export const Sheet = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SheetContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SheetDescription = ({ children, ...props }: any) => <p {...props}>{children}</p>;
export const SheetFooter = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SheetHeader = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SheetTitle = ({ children, ...props }: any) => <h2 {...props}>{children}</h2>;
export const SheetTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>;

export const Breadcrumb = ({ children, ...props }: any) => <nav {...props}>{children}</nav>;
export const BreadcrumbItem = ({ children, ...props }: any) => <span {...props}>{children}</span>;
export const BreadcrumbLink = ({ children, ...props }: any) => <a {...props}>{children}</a>;
export const BreadcrumbList = ({ children, ...props }: any) => <ol {...props}>{children}</ol>;
export const BreadcrumbPage = ({ children, ...props }: any) => <span {...props}>{children}</span>;
export const BreadcrumbSeparator = ({ children, ...props }: any) => <span {...props}>{children}</span>;

export const Form = ({ children, ...props }: any) => <form {...props}>{children}</form>;
export const FormField = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const FormItem = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const FormLabel = ({ children, ...props }: any) => <label {...props}>{children}</label>;
export const FormControl = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const FormDescription = ({ children, ...props }: any) => <p {...props}>{children}</p>;
export const FormMessage = ({ children, ...props }: any) => <p {...props}>{children}</p>;

export const Textarea = ({ className = '', ...props }: any) => (
  <textarea className={cn('flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500', className)} {...props} />
);

export const Checkbox = ({ className = '', ...props }: any) => (
  <input type="checkbox" className={cn('h-4 w-4 rounded border-gray-300', className)} {...props} />
);

export const RadioGroup = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const RadioGroupItem = ({ children, ...props }: any) => <input type="radio" {...props} />;

export const Container = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const Grid = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const Stack = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DataTable = ({ children, ...props }: any) => <div {...props}>{children}</div>;
