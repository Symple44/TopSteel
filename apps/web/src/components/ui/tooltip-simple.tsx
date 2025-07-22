'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  delay?: number
}

export function TooltipSimple({ 
  children, 
  content, 
  side = 'top',
  className,
  delay = 500
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const tooltipClasses = cn(
    'absolute z-50 px-2 py-1 text-xs text-white bg-black rounded shadow-lg',
    'pointer-events-none transition-opacity duration-200',
    {
      'bottom-full left-1/2 transform -translate-x-1/2 mb-1': side === 'top',
      'top-full left-1/2 transform -translate-x-1/2 mt-1': side === 'bottom',
      'right-full top-1/2 transform -translate-y-1/2 mr-1': side === 'left',
      'left-full top-1/2 transform -translate-y-1/2 ml-1': side === 'right',
    },
    isVisible ? 'opacity-100' : 'opacity-0',
    className
  )

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {isVisible && (
        <div className={tooltipClasses}>
          {content}
        </div>
      )}
    </div>
  )
}

export default TooltipSimple