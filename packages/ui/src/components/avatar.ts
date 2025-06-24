// Composant avatar - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const avatarStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("avatar-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
avatarStub.displayName = "avatarStub"

// Exports temporaires - à remplacer par les vrais composants
export const avatar = avatarStub
