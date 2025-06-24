// Composant container - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const containerStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("container-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
containerStub.displayName = "containerStub"

// Exports temporaires - à remplacer par les vrais composants
export const container = containerStub
