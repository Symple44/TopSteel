import React from "react"

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
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

Tabs.displayName = "Tabs"

// Export des sous-composants courants si nécessaire
export const TabsContent = Tabs
export const TabsTrigger = Tabs  
export const TabsItem = Tabs
export const TabsValue = Tabs
export const TabsHeader = Tabs
export const TabsTitle = Tabs
export const TabsDescription = Tabs
export const TabsFooter = Tabs
export const TabsSeparator = Tabs
export const TabsList = Tabs
