// Composant table - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const tableStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("table-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
tableStub.displayName = "tableStub"

// Exports temporaires - à remplacer par les vrais composants
export const table = tableStub
