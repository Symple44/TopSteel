'use client'

import Image from 'next/image'
import Link from 'next/link'
import { SectionWrapper } from './SectionWrapper'
import type { SectionProps } from './types'

export interface HeroContent {
  title: string
  subtitle?: string
  description?: string
  backgroundImage?: string
  overlayOpacity?: number
  alignment?: 'left' | 'center' | 'right'
  buttons?: Array<{
    text: string
    url: string
    variant?: 'primary' | 'secondary' | 'outline'
    target?: '_self' | '_blank'
  }>
  height?: 'small' | 'medium' | 'large' | 'full'
}

export function HeroSection({ section, isEditing }: SectionProps<HeroContent>) {
  const { content, styles, settings } = section

  const heightClasses = {
    small: 'min-h-[300px] md:min-h-[400px]',
    medium: 'min-h-[400px] md:min-h-[500px]',
    large: 'min-h-[500px] md:min-h-[600px]',
    full: 'min-h-screen',
  }

  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }

  return (
    <SectionWrapper
      styles={styles}
      settings={settings}
      isEditing={isEditing}
      className={heightClasses[(content.height as keyof typeof heightClasses) || 'medium']}
    >
      <div className="relative h-full flex items-center">
        {content.backgroundImage && (
          <>
            <Image
              src={content.backgroundImage}
              alt=""
              fill
              className="object-cover absolute inset-0"
              priority
            />
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: content.overlayOpacity || 0.5 }}
            />
          </>
        )}

        <div
          className={`relative z-10 w-full flex flex-col ${alignmentClasses[(content.alignment as keyof typeof alignmentClasses) || 'center']}`}
        >
          {content.title && (
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {content.title}
            </h1>
          )}

          {content.subtitle && (
            <h2 className="text-2xl md:text-3xl font-semibold text-white/90 mb-4">
              {content.subtitle}
            </h2>
          )}

          {content.description && (
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl">{content.description}</p>
          )}

          {content.buttons && content.buttons.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {content.buttons.map((button, index: number) => (
                <Link
                  key={`hero-button-${button.text}-${index}`}
                  href={button.url}
                  target={button.target}
                  className={`
                    px-6 py-3 rounded-md font-semibold transition-colors
                    ${button.variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                    ${button.variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}
                    ${button.variant === 'outline' ? 'border-2 border-white text-white hover:bg-white hover:text-black' : ''}
                  `}
                >
                  {button.text}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  )
}
