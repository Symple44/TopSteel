import * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'ghost' | 'outline'
  padding?: 'none' | 'sm' | 'default' | 'lg'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'default', children, style, onClick, onMouseEnter, onMouseLeave, onFocus, onBlur, id, role }, ref) => {
    const baseClasses = 'rounded-lg border bg-card text-card-foreground shadow'
    
    const variantClasses = {
      default: 'border-border',
      elevated: 'border-transparent shadow-lg',
      ghost: 'border-transparent shadow-none',
      outline: 'border-border shadow-none',
    }
    
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    }
    
    const finalClassName = [
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      className
    ].filter(Boolean).join(' ')
    
    return (
      <div
        ref={ref}
        className={finalClassName}
        style={style}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        id={id}
        role={role}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, onClick, onMouseEnter, onMouseLeave, onFocus, onBlur, id, role }, ref) => {
    const baseClassName = 'flex flex-col space-y-1.5 px-6 py-6'
    const finalClassName = [baseClassName, className].filter(Boolean).join(' ')
    
    return (
      <div 
        ref={ref} 
        className={finalClassName}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        id={id}
        role={role}
      >
        {children}
      </div>
    )
  }
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, onClick, onMouseEnter, onMouseLeave, onFocus, onBlur, id, role }, ref) => {
    const baseClassName = 'text-2xl font-semibold leading-none tracking-tight'
    const finalClassName = [baseClassName, className].filter(Boolean).join(' ')
    
    return (
      <h3
        ref={ref}
        className={finalClassName}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        id={id}
        role={role}
      >
        {children}
      </h3>
    )
  }
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, onClick, onMouseEnter, onMouseLeave, onFocus, onBlur, id, role }, ref) => {
  const baseClassName = 'text-sm text-muted-foreground'
  const finalClassName = [baseClassName, className].filter(Boolean).join(' ')
  
  return (
    <p 
      ref={ref} 
      className={finalClassName}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      id={id}
      role={role}
    >
      {children}
    </p>
  )
})
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, onClick, onMouseEnter, onMouseLeave, onFocus, onBlur, id, role }, ref) => {
    const baseClassName = 'px-6 pb-6'
    const finalClassName = [baseClassName, className].filter(Boolean).join(' ')
    
    return (
      <div 
        ref={ref} 
        className={finalClassName}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        id={id}
        role={role}
      >
        {children}
      </div>
    )
  }
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, onClick, onMouseEnter, onMouseLeave, onFocus, onBlur, id, role }, ref) => {
    const baseClassName = 'flex items-center px-6 pb-6'
    const finalClassName = [baseClassName, className].filter(Boolean).join(' ')
    
    return (
      <div 
        ref={ref} 
        className={finalClassName}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        id={id}
        role={role}
      >
        {children}
      </div>
    )
  }
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
