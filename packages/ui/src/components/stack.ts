// Composant stack - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const stackStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("stack-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
stackStub.displayName = "stackStub"

// Exports temporaires - à remplacer par les vrais composants
export const stack = stackStub
