// Type-safe wrappers for @erp/ui components to resolve React 19 + Next.js 15 compatibility issues
'use client'

import type { ComponentType, ReactNode } from 'react'
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

// Type assertion helper to safely cast components
function createSafeWrapper<P extends BaseUIProps>(Component: ComponentType<unknown>): ComponentType<P> {
  return Component as ComponentType<P>
}

// Type-safe wrapper components
export const Badge = createSafeWrapper<BaseUIProps>(UIBadge)
export const Button = createSafeWrapper<BaseUIProps>(UIButton)
export const Card = createSafeWrapper<BaseUIProps>(UICard)
export const CardContent = createSafeWrapper<BaseUIProps>(UICardContent)
export const CardHeader = createSafeWrapper<BaseUIProps>(UICardHeader)
export const CardTitle = createSafeWrapper<BaseUIProps>(UICardTitle)
export const Tabs = createSafeWrapper<BaseUIProps>(UITabs)
export const TabsContent = createSafeWrapper<BaseUIProps>(UITabsContent)
export const TabsList = createSafeWrapper<BaseUIProps>(UITabsList)
export const TabsTrigger = createSafeWrapper<BaseUIProps>(UITabsTrigger)
export const Input = createSafeWrapper<BaseUIProps>(UIInput)
export const Select = createSafeWrapper<BaseUIProps>(UISelect)
export const SelectContent = createSafeWrapper<BaseUIProps>(UISelectContent)
export const SelectItem = createSafeWrapper<BaseUIProps>(UISelectItem)
export const SelectTrigger = createSafeWrapper<BaseUIProps>(UISelectTrigger)
export const SelectValue = createSafeWrapper<BaseUIProps>(UISelectValue)

// Re-export other components that don't have typing issues
export {
  type ColumnConfig,
  DataTable,
} from '@erp/ui'
