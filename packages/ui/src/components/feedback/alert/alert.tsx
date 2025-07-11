import * as React from "react"
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning" | "success"
}
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = "", variant = "default", ...props }, ref) => (
    <div ref={ref} role="alert" className={`relative w-full rounded-lg border p-4 ${className}`} {...props} />
  )
)
Alert.displayName = "Alert"
export const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`text-sm ${className}`} {...props} />
  )
)
AlertDescription.displayName = "AlertDescription"
export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h5 ref={ref} className={`mb-1 font-medium leading-none tracking-tight ${className}`} {...props} />
  )
)
AlertTitle.displayName = "AlertTitle"
