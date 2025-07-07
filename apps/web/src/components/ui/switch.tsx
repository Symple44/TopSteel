import React from "react"

interface SwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _Switch = React.forwardRef<HTMLDivElement, SwitchProps>(
  ({ className = "", children, asChild, ...props }, ref) => {
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

Switch.displayName = "Switch"

// Export des sous-composants courants si nécessaire
export const _SwitchContent = Switch
export const _SwitchTrigger = Switch  
export const _SwitchItem = Switch
export const _SwitchValue = Switch
export const _SwitchHeader = Switch
export const _SwitchTitle = Switch
export const _SwitchDescription = Switch
export const _SwitchFooter = Switch
export const _SwitchSeparator = Switch
export const _SwitchList = Switch

