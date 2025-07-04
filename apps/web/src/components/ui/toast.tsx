import { cn } from "@/lib/utils"
import React from "react"

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className = "", children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, { 
        ...props, 
        ref: (children as any).ref || ref,
        className: cn((children as any).props?.className, className)
      })
    }
    
    return (
      <div className={className} ref={ref} {...props}>
        {children}
      </div>
    )
  }
)

Toast.displayName = "Toast"

// Export des sous-composants courants si nécessaire
export const ToastContent = Toast
export const ToastTrigger = Toast  
export const ToastItem = Toast
export const ToastValue = Toast
export const ToastHeader = Toast
export const ToastTitle = Toast
export const ToastDescription = Toast
export const ToastFooter = Toast
export const ToastSeparator = Toast
export const ToastList = Toast

