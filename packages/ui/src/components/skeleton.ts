// Composant skeleton - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const skeletonStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("skeleton-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
skeletonStub.displayName = "skeletonStub"

// Exports temporaires - à remplacer par les vrais composants
export const skeleton = skeletonStub
