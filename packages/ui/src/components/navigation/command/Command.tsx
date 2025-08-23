'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils'

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  filter?: (value: string, search: string) => number
  shouldFilter?: boolean
}

interface CommandContextValue {
  value: string
  onValueChange: (value: string) => void
  search: string
  onSearchChange: (search: string) => void
  filter: (value: string, search: string) => number
  shouldFilter: boolean
}

const CommandContext = React.createContext<CommandContextValue | undefined>(undefined)

const useCommandContext = () => {
  const context = React.useContext(CommandContext)
  if (!context) {
    throw new Error('Command components must be used within a Command')
  }
  return context
}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ className, value, onValueChange, filter, shouldFilter = true, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState('')
    const [search, setSearch] = React.useState('')
    
    const actualValue = value ?? internalValue
    const actualOnValueChange = onValueChange ?? setInternalValue
    
    const defaultFilter = React.useCallback((value: string, search: string) => {
      if (!search) return 1
      return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
    }, [])
    
    const contextValue: CommandContextValue = {
      value: actualValue,
      onValueChange: actualOnValueChange,
      search,
      onSearchChange: setSearch,
      filter: filter ?? defaultFilter,
      shouldFilter
    }

    return (
      <CommandContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
            className
          )}
          {...props}
        />
      </CommandContext.Provider>
    )
  }
)

interface CommandInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, ...props }, ref) => {
    const { search, onSearchChange } = useCommandContext()
    
    return (
      <input
        ref={ref}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)

interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandEmpty = React.forwardRef<HTMLDivElement, CommandEmptyProps>(
  ({ className, ...props }, ref) => {
    const { search, shouldFilter } = useCommandContext()
    
    if (!shouldFilter || !search) return null
    
    return (
      <div
        ref={ref}
        className={cn('py-6 text-center text-sm text-muted-foreground', className)}
        {...props}
      />
    )
  }
)

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: React.ReactNode
}

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, heading, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('overflow-hidden p-1 text-foreground', className)} {...props}>
        {heading && (
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {heading}
          </div>
        )}
        {children}
      </div>
    )
  }
)

interface CommandItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  value?: string
  onSelect?: (value: string) => void
  disabled?: boolean
}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ className, value, onSelect, disabled, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, search, filter, shouldFilter } = useCommandContext()
    
    const itemValue = value ?? (typeof children === 'string' ? children : '')
    const isSelected = selectedValue === itemValue
    
    const shouldShow = !shouldFilter || filter(itemValue, search) > 0
    
    if (!shouldShow) return null
    
    const handleClick = () => {
      if (disabled) return
      onValueChange(itemValue)
      onSelect?.(itemValue)
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50',
          className
        )}
        data-selected={isSelected}
        data-disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)

interface CommandSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandSeparator = React.forwardRef<HTMLDivElement, CommandSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('-mx-1 h-px bg-border', className)}
        {...props}
      />
    )
  }
)

Command.displayName = 'Command'
CommandInput.displayName = 'CommandInput'
CommandList.displayName = 'CommandList'
CommandEmpty.displayName = 'CommandEmpty'
CommandGroup.displayName = 'CommandGroup'
CommandItem.displayName = 'CommandItem'
CommandSeparator.displayName = 'CommandSeparator'

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
}