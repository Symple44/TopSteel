import React from 'react'

interface SwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Switch = React.forwardRef<HTMLDivElement, SwitchProps>(
  ({ className = '', children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, { ...props, ref })
    }

    return (
      <div className={className} ref={ref} {...props}>
        {children}
      </div>
    )
  }
)

Switch.displayName = 'Switch'

// Export des sous-composants courants si nécessaire
export const SwitchContent = Switch
export const SwitchTrigger = Switch
export const SwitchItem = Switch
export const SwitchValue = Switch
export const SwitchHeader = Switch
export const SwitchTitle = Switch
export const SwitchDescription = Switch
export const SwitchFooter = Switch
export const SwitchSeparator = Switch
export const SwitchList = Switch
