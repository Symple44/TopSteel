"use client"

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

/**
 * Wrapper sécurisé pour ReactQueryDevtools avec types corrects
 */
export function DevToolsWrapper() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <ReactQueryDevtools 
      initialIsOpen={false}
      position="bottom"
    />
  )
}
