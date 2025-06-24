// Composant toast - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const toastStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("toast-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
toastStub.displayName = "toastStub"

// Exports temporaires - à remplacer par les vrais composants
export const toast = toastStub
