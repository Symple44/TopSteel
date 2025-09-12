// Type-safe wrappers for @erp/ui components to resolve React 19 + Next.js 15 compatibility issues
'use client'

import type { ComponentType, ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react'
import {
  Badge as UIBadge,
  Button as UIButton,
  Card as UICard,
  CardContent as UICardContent,
  CardHeader as UICardHeader,
  CardTitle as UICardTitle,
  Input as UIInput,
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
  Tabs as UITabs,
  TabsContent as UITabsContent,
  TabsList as UITabsList,
  TabsTrigger as UITabsTrigger,
} from '@/lib/ui-exports'

// Common props interface for all UI components
interface BaseUIProps {
  children?: ReactNode
  className?: string
  [key: string]: unknown
}

// Type helper to handle different React component types
type ReactComponentLike<P = BaseUIProps> =
  | ComponentType<P>
  | ForwardRefExoticComponent<P & RefAttributes<unknown>>

// Type assertion helper to safely cast various React component types
function createSafeWrapper<P extends BaseUIProps>(
  Component: ReactComponentLike<unknown>
): ComponentType<P> {
  // Handle both regular components and ForwardRef components
  return Component as ComponentType<P>
}

// Type-safe wrapper components
export const Badge = createSafeWrapper<BaseUIProps>(UIBadge as ReactComponentLike<unknown>)
export const Button = createSafeWrapper<BaseUIProps>(UIButton as ReactComponentLike<unknown>)
export const Card = createSafeWrapper<BaseUIProps>(UICard as ReactComponentLike<unknown>)
export const CardContent = createSafeWrapper<BaseUIProps>(
  UICardContent as ReactComponentLike<unknown>
)
export const CardHeader = createSafeWrapper<BaseUIProps>(
  UICardHeader as ReactComponentLike<unknown>
)
export const CardTitle = createSafeWrapper<BaseUIProps>(UICardTitle as ReactComponentLike<unknown>)
export const Tabs = createSafeWrapper<BaseUIProps>(UITabs as ReactComponentLike<unknown>)
export const TabsContent = createSafeWrapper<BaseUIProps>(
  UITabsContent as ReactComponentLike<unknown>
)
export const TabsList = createSafeWrapper<BaseUIProps>(UITabsList as ReactComponentLike<unknown>)
export const TabsTrigger = createSafeWrapper<BaseUIProps>(
  UITabsTrigger as ReactComponentLike<unknown>
)
export const Input = createSafeWrapper<BaseUIProps>(UIInput as ReactComponentLike<unknown>)
export const Select = createSafeWrapper<BaseUIProps>(UISelect as ReactComponentLike<unknown>)
export const SelectContent = createSafeWrapper<BaseUIProps>(
  UISelectContent as ReactComponentLike<unknown>
)
export const SelectItem = createSafeWrapper<BaseUIProps>(
  UISelectItem as ReactComponentLike<unknown>
)
export const SelectTrigger = createSafeWrapper<BaseUIProps>(
  UISelectTrigger as ReactComponentLike<unknown>
)
export const SelectValue = createSafeWrapper<BaseUIProps>(
  UISelectValue as ReactComponentLike<unknown>
)

// Re-export other components that don't have typing issues
export {
  type ColumnConfig,
  DataTable,
} from '@erp/ui'
