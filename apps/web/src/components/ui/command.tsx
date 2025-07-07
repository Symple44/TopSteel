import { cn } from "@/lib/utils"
import React from "react"

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Command = React.forwardRef<HTMLDivElement, CommandProps>(
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
export const CommandContent = Command
export const CommandTrigger = Command  
export const CommandItem = Command
export const CommandValue = Command
export const CommandHeader = Command
export const CommandTitle = Command
export const CommandDescription = Command
export const CommandFooter = Command
export const CommandSeparator = Command
export const CommandList = Command

