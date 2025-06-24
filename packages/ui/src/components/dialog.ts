// Composant dialog - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const dialogStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("dialog-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
dialogStub.displayName = "dialogStub"

// Exports temporaires - à remplacer par les vrais composants
export const dialog = dialogStub
