/**
 * React 19 Compatible UI Component Wrappers
 * This file provides React 19 compatible wrappers for UI components
 */

import * as UIComponents from '@erp/ui'
import * as React from 'react'
import { forwardRef } from 'react'
import type { ReactNode } from 'react'

// Base component props that include children
interface BaseComponentProps {
  children?: ReactNode
  className?: string
}

// Badge component wrapper
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ children, variant = 'default', className, ...props }, ref) => {
    const Component = UIComponents.Badge as React.ComponentType<any>
    return React.createElement(
      Component,
      { ref, variant, className, ...props },
      children
    )
  }
)
Badge.displayName = 'Badge'

// Button component wrapper
export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    children,
    variant,
    size,
    asChild,
    loading,
    leftIcon,
    rightIcon,
    onClick,
    type,
    disabled,
    className,
    ...rest
  } = props || {}
  const Component = UIComponents.Button as React.ComponentType<any>
  return React.createElement(
    Component,
    {
      ref,
      variant,
      size,
      asChild,
      loading,
      leftIcon,
      rightIcon,
      onClick,
      type,
      disabled,
      className,
      ...rest
    },
    children
  )
})
Button.displayName = 'Button'

// Card components
export interface CardProps extends BaseComponentProps {}
export interface CardContentProps extends BaseComponentProps {}
export interface CardHeaderProps extends BaseComponentProps {}
export interface CardTitleProps extends BaseComponentProps {}
export interface CardDescriptionProps extends BaseComponentProps {}
export interface CardFooterProps extends BaseComponentProps {}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ children, ...props }, ref) => {
  const Component = UIComponents.Card as React.ComponentType<any>
  return React.createElement(Component, { ref, ...props }, children)
})
Card.displayName = 'Card'

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.CardContent as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
CardContent.displayName = 'CardContent'

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.CardHeader as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.CardTitle as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
CardTitle.displayName = 'CardTitle'

// Select components
export interface SelectProps extends BaseComponentProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

export interface SelectTriggerProps extends BaseComponentProps {}
export interface SelectContentProps extends BaseComponentProps {}
export interface SelectItemProps extends BaseComponentProps {
  value: string
}

export const Select = ({ children, ...props }: SelectProps) => {
  const Component = UIComponents.Select as React.ComponentType<any>
  return React.createElement(Component, props, children)
}
Select.displayName = 'Select'

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.SelectTrigger as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.SelectContent as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
SelectContent.displayName = 'SelectContent'

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, value, ...props }, ref) => {
    const Component = UIComponents.SelectItem as React.ComponentType<any>
    return React.createElement(Component, { ref, value, ...props }, children)
  }
)
SelectItem.displayName = 'SelectItem'

export const SelectValue = ({ ...props }) => {
  const Component = UIComponents.SelectValue as React.ComponentType<any>
  return React.createElement(Component, props)
}
SelectValue.displayName = 'SelectValue'

// Re-export DataTable and other complex components as-is
export const DataTable = UIComponents.DataTable
export type { ColumnConfig } from './ui-exports'

// PageHeader component wrapper
export interface PageHeaderProps extends BaseComponentProps {
  title: string
  description?: string
  actions?: ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className,
  ...props
}) => {
  const Component = UIComponents.PageHeader as React.ComponentType<any>
  return React.createElement(Component, {
    title,
    description,
    actions,
    className,
    ...props
  })
}
PageHeader.displayName = 'PageHeader'

// Label component wrapper
export interface LabelProps extends BaseComponentProps {
  htmlFor?: string
}

export const Label: React.FC<LabelProps> = ({ children, htmlFor, className, ...props }) => {
  const Component = UIComponents.Label as React.ComponentType<any>
  return React.createElement(Component, { htmlFor, className, ...props }, children)
}

// Dialog components
export interface DialogProps extends BaseComponentProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface DialogContentProps extends BaseComponentProps {}
export interface DialogHeaderProps extends BaseComponentProps {}
export interface DialogTitleProps extends BaseComponentProps {}
export interface DialogDescriptionProps extends BaseComponentProps {}
export interface DialogFooterProps extends BaseComponentProps {}

export const Dialog = ({ children, ...props }: DialogProps) => {
  const Component = UIComponents.Dialog as React.ComponentType<any>
  return React.createElement(Component, props, children)
}
Dialog.displayName = 'Dialog'

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.DialogContent as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
DialogContent.displayName = 'DialogContent'

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.DialogHeader as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
DialogHeader.displayName = 'DialogHeader'

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.DialogTitle as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.DialogDescription as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
DialogDescription.displayName = 'DialogDescription'

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.DialogFooter as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
DialogFooter.displayName = 'DialogFooter'

// Input and Form components
export interface InputProps extends BaseComponentProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  id?: string
  maxLength?: number
  autoComplete?: string
  autoFocus?: boolean
  required?: boolean
  accept?: string
  disabled?: boolean
}

export const Input: React.FC<InputProps> = ({
  children,
  type,
  placeholder,
  value,
  onChange,
  id,
  className,
  maxLength,
  autoComplete,
  autoFocus,
  required,
  accept,
  disabled,
  ...props
}) => {
  const Component = UIComponents.Input as React.ComponentType<any>
  return React.createElement(Component, {
    type,
    placeholder,
    value,
    onChange,
    id,
    className,
    maxLength,
    autoComplete,
    autoFocus,
    required,
    accept,
    disabled,
    ...props
  }, children)
}

// Separator component
export const Separator = forwardRef<HTMLDivElement, BaseComponentProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.Separator as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
Separator.displayName = 'Separator'

// Alert components
export interface AlertProps extends BaseComponentProps {
  variant?: 'default' | 'destructive'
}

export interface AlertDescriptionProps extends BaseComponentProps {}
export interface AlertTitleProps extends BaseComponentProps {}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(({ children, ...props }, ref) => {
  const Component = UIComponents.Alert as React.ComponentType<any>
  return React.createElement(Component, { ref, ...props }, children)
})
Alert.displayName = 'Alert'

export const AlertDescription = forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.AlertDescription as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
AlertDescription.displayName = 'AlertDescription'

export const AlertTitle = forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.AlertTitle as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
AlertTitle.displayName = 'AlertTitle'

// Textarea component
export interface TextareaProps extends BaseComponentProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ children, ...props }, ref) => {
    const Component = UIComponents.Textarea as React.ComponentType<any>
    return React.createElement(Component, { ref, ...props }, children)
  }
)
Textarea.displayName = 'Textarea'

// Progress component
export interface ProgressProps extends BaseComponentProps {
  value?: number
  max?: number
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ children, value, max, className, ...props }, ref) => {
    const Component = UIComponents.Progress as React.ComponentType<any>
    return React.createElement(Component, { ref, value, max, className, ...props }, children)
  }
)
Progress.displayName = 'Progress'

// Tabs components
export interface TabsProps extends BaseComponentProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
  dir?: 'ltr' | 'rtl'
  activationMode?: 'automatic' | 'manual'
}

export interface TabsListProps extends BaseComponentProps {}
export interface TabsTriggerProps extends BaseComponentProps {
  value: string
  disabled?: boolean
}

export interface TabsContentProps extends BaseComponentProps {
  value: string
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>((props, ref) => {
  const { children, value, onValueChange, defaultValue, className, ...rest } = props || {}
  const Component = UIComponents.Tabs as React.ComponentType<any>
  return React.createElement(
    Component,
    {
      ref,
      value,
      onValueChange,
      defaultValue,
      className,
      ...rest
    },
    children
  )
})
Tabs.displayName = 'Tabs'

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>((props, ref) => {
  const { children, className, ...rest } = props || {}
  const Component = UIComponents.TabsList as React.ComponentType<any>
  return React.createElement(Component, { ref, className, ...rest }, children)
})
TabsList.displayName = 'TabsList'

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>((props, ref) => {
  const { children, value, className, disabled, ...rest } = props || {}
  const Component = UIComponents.TabsTrigger as React.ComponentType<any>
  return React.createElement(Component, { ref, value, disabled, className, ...rest }, children)
})
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>((props, ref) => {
  const { children, value, className, ...rest } = props || {}
  const Component = UIComponents.TabsContent as React.ComponentType<any>
  return React.createElement(Component, { ref, value, className, ...rest }, children)
})
TabsContent.displayName = 'TabsContent'

// Re-export all other components that don't need wrapping
export * from '@erp/ui'