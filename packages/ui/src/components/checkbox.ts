// Composant checkbox - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const checkboxStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("checkbox-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
checkboxStub.displayName = "checkboxStub"

// Exports temporaires - à remplacer par les vrais composants
export const checkbox = checkboxStub
