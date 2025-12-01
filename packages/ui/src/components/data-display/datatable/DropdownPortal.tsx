'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface DropdownPortalProps {
  children: React.ReactNode
  id?: string
}

/**
 * Simple portal helper for rendering dropdown content in the document body
 * Used internally by ColumnFilterDropdown
 */
export function DropdownPortal({ children, id = 'dropdown-portal' }: DropdownPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Créer un élément de portail s'il n'existe pas
    let portalElement = document.getElementById(id)
    if (!portalElement) {
      portalElement = document.createElement('div')
      portalElement.id = id
      portalElement.style.position = 'fixed'
      portalElement.style.top = '0'
      portalElement.style.left = '0'
      portalElement.style.width = '0'
      portalElement.style.height = '0'
      portalElement.style.pointerEvents = 'none'
      portalElement.style.zIndex = '10000'
      document.body.appendChild(portalElement)
    }

    return () => {
      setMounted(false)
    }
  }, [id])

  if (!mounted) return null

  const portalElement = document.getElementById(id)
  if (!portalElement) return null

  return createPortal(children, portalElement)
}
