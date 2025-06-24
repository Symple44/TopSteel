import React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
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

Alert.displayName = "Alert"

// Export des sous-composants courants si nécessaire
export const AlertContent = Alert
export const AlertTrigger = Alert  
export const AlertItem = Alert
export const AlertValue = Alert
export const AlertHeader = Alert
export const AlertTitle = Alert
export const AlertDescription = Alert
export const AlertFooter = Alert
export const AlertSeparator = Alert
export const AlertList = Alert
