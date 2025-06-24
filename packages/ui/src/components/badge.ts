// Composant badge - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const badgeStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("badge-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
badgeStub.displayName = "badgeStub"

// Exports temporaires - à remplacer par les vrais composants
export const badge = badgeStub
