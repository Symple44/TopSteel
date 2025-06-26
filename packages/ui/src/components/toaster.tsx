import * as React from "react"
import { cn } from "@/lib/utils"

interface ToasterProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}

const Toaster = React.forwardRef<HTMLDivElement, ToasterProps>(
  ({ className, position = "bottom-right", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col space-y-2 p-4",
          {
            "top-4 left-4": position === "top-left",
            "top-4 right-4": position === "top-right", 
            "bottom-4 left-4": position === "bottom-left",
            "bottom-4 right-4": position === "bottom-right",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Toaster.displayName = "Toaster"

export { Toaster }
