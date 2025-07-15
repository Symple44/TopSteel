import type { HTMLAttributes } from 'react'
import { type BadgeVariants, badgeVariants } from '../../../lib/design-system'
import { cn } from '../../../lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, BadgeVariants {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
