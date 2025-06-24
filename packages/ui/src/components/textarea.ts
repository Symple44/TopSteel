// Composant textarea - Stub temporaire
import * as React from "react"
import { cn } from "../lib/utils"

export const textareaStub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("textarea-component", className)}
      {...props}
    >
      {children}
    </div>
  )
)
textareaStub.displayName = "textareaStub"

// Exports temporaires - à remplacer par les vrais composants
export const textarea = textareaStub
