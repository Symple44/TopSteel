'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as React from 'react'
import { cn } from '../../../lib/utils'

// Hook to get CSP nonce - will be undefined if not available
function useCSPNonce(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  // Try to get nonce from meta tag
  const metaNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')
  if (metaNonce) return metaNonce

  // Fallback: try to extract from existing script tags
  const scripts = document.querySelectorAll('script[nonce]')
  if (scripts.length > 0) {
    return scripts[0].getAttribute('nonce') || undefined
  }

  return undefined
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  // Use CSS custom properties for CSP compliance instead of inline styles
  const progressId = React.useId()
  const progressValue = Math.max(0, Math.min(100, value || 0))
  const nonce = useCSPNonce()

  return (
    <>
      <style nonce={nonce}>
        {`
          #${progressId} .progress-indicator {
            transform: translateX(-${100 - progressValue}%);
          }
        `}
      </style>
      <ProgressPrimitive.Root
        ref={ref}
        id={progressId}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
        {...props}
      >
        <ProgressPrimitive.Indicator className="progress-indicator h-full w-full flex-1 bg-primary transition-all" />
      </ProgressPrimitive.Root>
    </>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
