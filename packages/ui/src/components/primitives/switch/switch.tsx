import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Input } from '../input'

const switchVariants = cva(
  'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        default: 'h-6 w-11',
        lg: 'h-8 w-14',
      },
      variant: {
        default: 'bg-input data-[state=checked]:bg-primary',
        success: 'bg-input data-[state=checked]:bg-green-500',
        warning: 'bg-input data-[state=checked]:bg-amber-500',
        destructive: 'bg-input data-[state=checked]:bg-destructive',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

const thumbVariants = cva(
  'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out',
  {
    variants: {
      size: {
        sm: 'h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0',
        default: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        lg: 'h-7 w-7 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export interface SwitchProps extends VariantProps<typeof switchVariants> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
  name?: string
  value?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    { className, size, variant, checked, defaultChecked, onCheckedChange, disabled, ...props },
    ref
  ) => {
    return (
      <label
        className={cn(
          'relative inline-flex cursor-pointer items-center',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <Input
          type="checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="sr-only peer"
          ref={ref}
          {...props}
        />

        <div
          className={cn(switchVariants({ size, variant }), className)}
          data-state={checked ? 'checked' : 'unchecked'}
        >
          <div
            className={cn(thumbVariants({ size }))}
            data-state={checked ? 'checked' : 'unchecked'}
          />
        </div>
      </label>
    )
  }
)

Switch.displayName = 'Switch'

// === CUSTOM SWITCH OPTIMISÉ (Compatible avec votre code existant) ===
export function CustomSwitch({
  checked,
  onChange,
  className = '',
  ...props
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) {
  return <Switch checked={checked} onCheckedChange={onChange} className={className} {...props} />
}

export { Switch, switchVariants }
