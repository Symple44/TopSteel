// Composant form - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const formStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("form-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
formStub.displayName = "formStub"

// Exports temporaires - à remplacer par les vrais composants
export const form = formStub
