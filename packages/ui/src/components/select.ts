// Composant select - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const selectStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("select-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
selectStub.displayName = "selectStub"

// Exports temporaires - à remplacer par les vrais composants
export const select = selectStub
