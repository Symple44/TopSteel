// Composant grid - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const gridStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
gridStub.displayName = "gridStub"

// Exports temporaires - à remplacer par les vrais composants
export const grid = gridStub
