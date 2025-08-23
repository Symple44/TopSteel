'use client'

import * as React from 'react'
import { type BadgeVariants, badgeVariants } from '../../../lib/design-system'
import { cn } from '../../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, BadgeVariants {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(badgeVariants({ variant }), className)} 
        {...props} 
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
