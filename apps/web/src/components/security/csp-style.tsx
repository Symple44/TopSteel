'use client'

import { type CSSProperties, type ReactNode, useMemo } from 'react'
import { getCSPNonce, useCSPNonce } from '../../lib/security/csp-nonce'

interface CSPStyleProps {
  children: ReactNode
  styles: CSSProperties
  className?: string
  element?: keyof JSX.IntrinsicElements
  id?: string
}

/**
 * CSP-compliant component that converts inline styles to a nonce-protected style element
 * This component helps eliminate the need for 'unsafe-inline' in style-src CSP directive
 */
export function CSPStyle({
  children,
  styles,
  className,
  element: Element = 'div',
  id,
}: CSPStyleProps) {
  const nonce = useCSPNonce()

  const { uniqueId, cssText } = useMemo(() => {
    // Generate a unique ID for this component instance
    const uniqueId = id || `csp-style-${Math.random().toString(36).substring(2, 11)}`

    // Convert React CSSProperties to CSS text
    const cssText = Object.entries(styles)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case
        const cssProperty = key?.replace(/[A-Z]/g, (match) => `-${match?.toLowerCase()}`)
        return `${cssProperty}: ${value};`
      })
      .join(' ')

    return { uniqueId, cssText }
  }, [styles, id])

  return (
    <>
      {/* Nonce-protected style element */}
      <style
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `#${uniqueId} { ${cssText} }`,
        }}
      />
      {/* Target element with the generated ID */}
      <Element id={uniqueId} className={className}>
        {children}
      </Element>
    </>
  )
}

/**
 * Hook to generate CSP-compliant style elements
 * Returns a function that creates nonce-protected style elements
 */
export function useCSPStyles() {
  const nonce = useCSPNonce()

  return useMemo(
    () => ({
      createStyle: (styles: CSSProperties, selector: string = '') => {
        const uniqueId = `csp-${Math.random().toString(36).substring(2, 11)}`
        const cssText = Object.entries(styles)
          .map(([key, value]) => {
            const cssProperty = key?.replace(/[A-Z]/g, (match) => `-${match?.toLowerCase()}`)
            return `${cssProperty}: ${value};`
          })
          .join(' ')

        const selectorText = selector || `#${uniqueId}`

        return {
          id: uniqueId,
          styleElement: (
            <style
              key={uniqueId}
              nonce={nonce}
              dangerouslySetInnerHTML={{
                __html: `${selectorText} { ${cssText} }`,
              }}
            />
          ),
        }
      },
      nonce,
    }),
    [nonce]
  )
}

/**
 * Server-side version that works with Next.js Server Components
 */
export function CSPStyleServer({
  children,
  styles,
  className,
  element: Element = 'div',
  id,
}: CSPStyleProps) {
  const nonce = getCSPNonce()

  const { uniqueId, cssText } = useMemo(() => {
    const uniqueId = id || `csp-style-${Math.random().toString(36).substring(2, 11)}`
    const cssText = Object.entries(styles)
      .map(([key, value]) => {
        const cssProperty = key?.replace(/[A-Z]/g, (match) => `-${match?.toLowerCase()}`)
        return `${cssProperty}: ${value};`
      })
      .join(' ')

    return { uniqueId, cssText }
  }, [styles, id])

  return (
    <>
      <style
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `#${uniqueId} { ${cssText} }`,
        }}
      />
      <Element id={uniqueId} className={className}>
        {children}
      </Element>
    </>
  )
}
