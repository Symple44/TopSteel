// Composant sheet - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const sheetStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("sheet-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
sheetStub.displayName = "sheetStub"

// Exports temporaires - à remplacer par les vrais composants
export const sheet = sheetStub
