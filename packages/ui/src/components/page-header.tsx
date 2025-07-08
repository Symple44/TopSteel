// packages/ui/src/components/page-header.tsx
import * as React from 'react'
import { cn } from '../lib/utils'

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('border-b bg-background px-6 py-4', className)} {...props}>
        {children}
      </div>
    )
  }
)

PageHeader.displayName = 'PageHeader'

export { PageHeader }
