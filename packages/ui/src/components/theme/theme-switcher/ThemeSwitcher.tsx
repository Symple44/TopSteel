import * as React from "react"
import { cn } from "../../../lib/utils"

export interface ThemeSwitcherProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

const ThemeSwitcher = React.forwardRef<HTMLButtonElement, ThemeSwitcherProps>(
  ({ variant = 'ghost', size = 'default', className, ...props }, ref) => {
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
      setMounted(true)
      // Check for saved theme preference or default to light
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      const initialTheme = savedTheme || systemTheme
      
      setTheme(initialTheme)
      document.documentElement.classList.toggle('dark', initialTheme === 'dark')
    }, [])

    const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light'
      setTheme(newTheme)
      localStorage.setItem('theme', newTheme)
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }

    const baseClasses = [
      "inline-flex items-center justify-center rounded-md text-sm font-medium",
      "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      "disabled:pointer-events-none disabled:opacity-50"
    ]

    const variantClasses = {
      default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
      outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground"
    }

    const sizeClasses = {
      default: "h-9 px-3",
      sm: "h-8 px-2",
      lg: "h-10 px-4"
    }

    // Render placeholder until mounted to avoid hydration mismatch
    if (!mounted) {
      return (
        <button
          ref={ref}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
          disabled
          {...props}
        >
          <span className="h-4 w-4">🌙</span>
        </button>
      )
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        onClick={toggleTheme}
        title={`Basculer vers le thème ${theme === 'light' ? 'sombre' : 'clair'}`}
        {...props}
      >
        {theme === 'light' ? (
          <span className="h-4 w-4">🌙</span>
        ) : (
          <span className="h-4 w-4">☀️</span>
        )}
        <span className="sr-only">
          Basculer vers le thème {theme === 'light' ? 'sombre' : 'clair'}
        </span>
      </button>
    )
  }
)

ThemeSwitcher.displayName = "ThemeSwitcher"

export { ThemeSwitcher }
