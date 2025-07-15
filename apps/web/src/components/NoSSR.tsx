'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

const NoSSRWrapper = ({ children }: { children: ReactNode }) => {
  return <>{children}</>
}

export default dynamic(() => Promise.resolve(NoSSRWrapper), {
  ssr: false,
})