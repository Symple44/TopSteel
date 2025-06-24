// Composant data-table - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const data-tableStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("data-table-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
data-tableStub.displayName = "data-tableStub"

// Exports temporaires - à remplacer par les vrais composants
export const data-table = data-tableStub
