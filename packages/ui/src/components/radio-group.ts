// Composant radio-group - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const radio-groupStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("radio-group-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
radio-groupStub.displayName = "radio-groupStub"

// Exports temporaires - à remplacer par les vrais composants
export const radio-group = radio-groupStub
