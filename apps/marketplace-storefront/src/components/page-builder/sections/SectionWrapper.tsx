'use client'

import { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SectionStyles, SectionSettings } from './types'

interface SectionWrapperProps {
  children: ReactNode
  styles?: SectionStyles
  settings?: SectionSettings
  isEditing?: boolean
  onEdit?: () => void
  className?: string
}

export function SectionWrapper({
  children,
  styles = {},
  settings = {},
  isEditing = false,
  onEdit,
  className
}: SectionWrapperProps) {
  const computeStyles = (): CSSProperties => {
    const computed: CSSProperties = {}

    if (styles.backgroundColor) {
      computed.backgroundColor = styles.backgroundColor
    }

    if (styles.backgroundImage) {
      computed.backgroundImage = `url(${styles.backgroundImage})`
      computed.backgroundPosition = styles.backgroundPosition || 'center'
      computed.backgroundSize = styles.backgroundSize || 'cover'
    }

    if (styles.padding) {
      computed.paddingTop = styles.padding.top
      computed.paddingRight = styles.padding.right
      computed.paddingBottom = styles.padding.bottom
      computed.paddingLeft = styles.padding.left
    }

    if (styles.margin) {
      computed.marginTop = styles.margin.top
      computed.marginRight = styles.margin.right
      computed.marginBottom = styles.margin.bottom
      computed.marginLeft = styles.margin.left
    }

    if (styles.border) {
      computed.borderWidth = styles.border.width
      computed.borderStyle = styles.border.style
      computed.borderColor = styles.border.color
      computed.borderRadius = styles.border.radius
    }

    return computed
  }

  const containerClasses = {
    'full-width': 'w-full',
    'boxed': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'custom': ''
  }

  const containerClass = containerClasses[settings.container || 'boxed']

  return (
    <section
      id={settings.id}
      className={cn(
        'relative',
        settings.customClass,
        className,
        isEditing && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      style={computeStyles()}
    >
      {isEditing && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <button
            onClick={onEdit}
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
          >
            Éditer
          </button>
        </div>
      )}
      
      <div className={containerClass}>
        {children}
      </div>

      {styles.customCSS && (
        <style jsx>{`${styles.customCSS}`}</style>
      )}
    </section>
  )
}