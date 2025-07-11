import * as React from 'react'
import { cn } from '../../../lib/utils'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, actions, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between space-y-2 pb-6', className)}
        {...props}
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>

        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
    )
  }
)

PageHeader.displayName = 'PageHeader'

export { PageHeader }
