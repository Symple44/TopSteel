import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  description?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, description, breadcrumbs, actions, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-6", className)} {...props}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground">{subtitle}</p>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
        {children}
      </div>
    )
  }
)
PageHeader.displayName = "PageHeader"

export { PageHeader }
