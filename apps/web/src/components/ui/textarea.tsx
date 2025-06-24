import React from "react"

interface TextareaProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Textarea = React.forwardRef<HTMLDivElement, TextareaProps>(
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

Textarea.displayName = "Textarea"

// Export des sous-composants courants si nécessaire
export const TextareaContent = Textarea
export const TextareaTrigger = Textarea  
export const TextareaItem = Textarea
export const TextareaValue = Textarea
export const TextareaHeader = Textarea
export const TextareaTitle = Textarea
export const TextareaDescription = Textarea
export const TextareaFooter = Textarea
export const TextareaSeparator = Textarea
export const TextareaList = Textarea
