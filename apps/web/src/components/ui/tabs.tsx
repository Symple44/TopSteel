'use client'

import { cn } from '@/lib/utils'
import * as React from 'react'

interface TabsContextValue {
  value?: string
  onValueChange?: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({})

interface TabsProps {
  children?: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

interface TabsContentProps {
  children?: React.ReactNode
  value: string
  className?: string
}

interface TabsListProps {
  children?: React.ReactNode
  className?: string
}

interface TabsTriggerProps {
  children?: React.ReactNode
  value: string
  className?: string
  disabled?: boolean
}

export const Tabs: React.FC<TabsProps> = ({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
  ...props
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '')

  const currentValue = value !== undefined ? value : internalValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [value, onValueChange]
  )

  const contextValue = React.useMemo(
    () => ({
      value: currentValue,
      onValueChange: handleValueChange,
    }),
    [currentValue, handleValueChange]
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export const TabsContent: React.FC<TabsContentProps> = ({
  children,
  value,
  className,
  ...props
}) => {
  const { value: selectedValue } = React.useContext(TabsContext)

  if (selectedValue !== value) {
    return null
  }

  return (
    <div
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const TabsList: React.FC<TabsListProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  children,
  value,
  className,
  disabled = false,
  ...props
}) => {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext)
  const isSelected = selectedValue === value

  const handleClick = () => {
    if (!disabled && onValueChange) {
      onValueChange(value)
    }
  }

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isSelected
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}




