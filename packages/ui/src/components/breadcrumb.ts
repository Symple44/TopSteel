// Composant breadcrumb - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const breadcrumbStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("breadcrumb-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
breadcrumbStub.displayName = "breadcrumbStub"

// Exports temporaires - à remplacer par les vrais composants
export const breadcrumb = breadcrumbStub
