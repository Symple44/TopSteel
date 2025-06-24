import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string
  size?: string
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "", size = "", asChild, children, ...props }, ref) => {
    const baseClass = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50"
    const variantClass = variant === "outline" ? "border border-gray-300 bg-white hover:bg-gray-50" : "bg-blue-600 text-white hover:bg-blue-700"
    const sizeClass = size === "sm" ? "h-9 px-3" : size === "lg" ? "h-11 px-8" : "h-10 px-4 py-2"
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, {
        className: `${baseClass} ${variantClass} ${sizeClass} ${className}`,
        ref,
        ...props
      })
    }
    
    return (
      <button
        className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"
