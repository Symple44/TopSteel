// Composant alert - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const alertStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("alert-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
alertStub.displayName = "alertStub"

// Exports temporaires - à remplacer par les vrais composants
export const alert = alertStub
