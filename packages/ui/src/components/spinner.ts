// Composant spinner - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const spinnerStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("spinner-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
spinnerStub.displayName = "spinnerStub"

// Exports temporaires - à remplacer par les vrais composants
export const spinner = spinnerStub
