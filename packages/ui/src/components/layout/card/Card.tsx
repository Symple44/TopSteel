'use client'

import * as React from 'react'
import type { CardVariants } from '../../../lib/design-system'
import { cardVariants } from '../../../lib/design-system'
import {
  getInteractiveA11yProps,
  getInteractiveClassName,
} from '../../../lib/interactive-element'
import { cn } from '../../../lib/utils'

// ============================================
// TYPES
// ============================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    CardVariants {}

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

// ============================================
// CARD COMPONENT
// ============================================

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'default',
      children,
      onClick,
      role,
      ...props
    },
    ref
  ) => {
    const interactiveProps = getInteractiveA11yProps(onClick, role)
    const finalClassName = cn(
      cardVariants({ variant, padding }),
      getInteractiveClassName({
        onClick,
        baseClassName: '',
        className,
      })
    )

    return (
      <div
        ref={ref}
        className={finalClassName}
        onClick={onClick}
        {...interactiveProps}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

// ============================================
// CARD HEADER
// ============================================

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, onClick, role, ...props }, ref) => {
    const interactiveProps = getInteractiveA11yProps(onClick, role)
    const finalClassName = getInteractiveClassName({
      onClick,
      baseClassName: 'flex flex-col space-y-1.5 px-6 py-6',
      className,
    })

    return (
      <div
        ref={ref}
        className={finalClassName}
        onClick={onClick}
        {...interactiveProps}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardHeader.displayName = 'CardHeader'

// ============================================
// CARD TITLE
// ============================================

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, onClick, role, ...props }, ref) => {
    const interactiveProps = getInteractiveA11yProps(onClick, role)
    const baseClassName = 'text-2xl font-semibold leading-none tracking-tight'
    const finalClassName = [baseClassName, className].filter(Boolean).join(' ')

    return (
      <h3
        ref={ref}
        className={finalClassName}
        onClick={onClick}
        {...interactiveProps}
        {...props}
      >
        {children}
      </h3>
    )
  }
)
CardTitle.displayName = 'CardTitle'

// ============================================
// CARD DESCRIPTION
// ============================================

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, onClick, role, ...props }, ref) => {
    const interactiveProps = getInteractiveA11yProps(onClick, role)
    const baseClassName = 'text-sm text-muted-foreground'
    const finalClassName = [baseClassName, className].filter(Boolean).join(' ')

    return (
      <p
        ref={ref}
        className={finalClassName}
        onClick={onClick}
        {...interactiveProps}
        {...props}
      >
        {children}
      </p>
    )
  }
)
CardDescription.displayName = 'CardDescription'

// ============================================
// CARD CONTENT
// ============================================

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, onClick, role, ...props }, ref) => {
    const interactiveProps = getInteractiveA11yProps(onClick, role)
    const finalClassName = getInteractiveClassName({
      onClick,
      baseClassName: 'px-6 pb-6',
      className,
    })

    return (
      <div
        ref={ref}
        className={finalClassName}
        onClick={onClick}
        {...interactiveProps}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardContent.displayName = 'CardContent'

// ============================================
// CARD FOOTER
// ============================================

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, onClick, role, ...props }, ref) => {
    const interactiveProps = getInteractiveA11yProps(onClick, role)
    const finalClassName = getInteractiveClassName({
      onClick,
      baseClassName: 'flex items-center px-6 pb-6',
      className,
    })

    return (
      <div
        ref={ref}
        className={finalClassName}
        onClick={onClick}
        {...interactiveProps}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardFooter.displayName = 'CardFooter'

// ============================================
// EXPORTS
// ============================================

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
export type { CardVariants }
