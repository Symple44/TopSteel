import { cn } from "@/lib/utils"
import React from "react"

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _Command = React.forwardRef<HTMLDivElement, CommandProps>(
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

Command.displayName = "Command"

// Export des sous-composants courants si nécessaire
export const _CommandContent = Command
export const _CommandTrigger = Command  
export const _CommandItem = Command
export const _CommandValue = Command
export const _CommandHeader = Command
export const _CommandTitle = Command
export const _CommandDescription = Command
export const _CommandFooter = Command
export const _CommandSeparator = Command
export const _CommandList = Command


