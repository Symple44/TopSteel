import React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
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

Progress.displayName = "Progress"

// Export des sous-composants courants si nécessaire
export const ProgressContent = Progress
export const ProgressTrigger = Progress  
export const ProgressItem = Progress
export const ProgressValue = Progress
export const ProgressHeader = Progress
export const ProgressTitle = Progress
export const ProgressDescription = Progress
export const ProgressFooter = Progress
export const ProgressSeparator = Progress
export const ProgressList = Progress
