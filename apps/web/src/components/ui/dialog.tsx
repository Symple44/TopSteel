import React from "react"

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
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

Dialog.displayName = "Dialog"

// Export des sous-composants courants si nécessaire
export const DialogContent = Dialog
export const DialogTrigger = Dialog  
export const DialogItem = Dialog
export const DialogValue = Dialog
export const DialogHeader = Dialog
export const DialogTitle = Dialog
export const DialogDescription = Dialog
export const DialogFooter = Dialog
export const DialogSeparator = Dialog
export const DialogList = Dialog
