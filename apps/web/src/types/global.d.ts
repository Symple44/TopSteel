// Types globaux TopSteel ERP
import type { ReactNode } from 'react'

// Override global pour tous les composants Select
declare global {
  namespace JSX {
    interface IntrinsicElements {
      SelectTrigger: {
        children?: ReactNode
        className?: string
        disabled?: boolean
        asChild?: boolean
      }
    }
  }
}




