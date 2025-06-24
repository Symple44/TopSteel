// Composant tabs - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const tabsStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("tabs-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
tabsStub.displayName = "tabsStub"

// Exports temporaires - à remplacer par les vrais composants
export const tabs = tabsStub
