'use client'

import * as React from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  checked?: boolean | 'indeterminate'
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    const isChecked = checked === true
    const isIndeterminate = checked === 'indeterminate'
    const isActive = isChecked || isIndeterminate

    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked === 'indeterminate' ? 'mixed' : checked}
        disabled={disabled}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 cursor-pointer',
          isActive
            ? 'bg-primary border-primary text-white shadow-sm' 
            : 'border-input bg-background hover:bg-accent hover:border-accent-foreground/50',
          className
        )}
        onClick={() => onCheckedChange?.(!isChecked)}
        ref={ref}
        {...props}
      >
        <div className="flex items-center justify-center h-full w-full">
          {isChecked && (
            <Check className="h-3 w-3 text-white drop-shadow-sm" strokeWidth={3} />
          )}
          {isIndeterminate && (
            <Minus className="h-3 w-3 text-white drop-shadow-sm" strokeWidth={3} />
          )}
        </div>
      </button>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }