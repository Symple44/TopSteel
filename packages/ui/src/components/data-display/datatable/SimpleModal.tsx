'use client'

import { X } from 'lucide-react'
import type React from 'react'
import { useEffect } from 'react'
import { Button } from '../../primitives/button'

interface SimpleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export function SimpleModal({
  open,
  onOpenChange,
  title,
  children,
  maxWidth = 'max-w-2xl',
}: SimpleModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className={`simple-modal-container bg-background border border-border rounded-lg shadow-lg w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col relative`}
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 9999, position: 'relative' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  )
}

export default SimpleModal
