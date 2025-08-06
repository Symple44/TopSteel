'use client'

import Link from 'next/link'
import { SectionWrapper } from './SectionWrapper'
import type { SectionProps } from './types'

export interface CTAContent {
  title: string
  description?: string
  buttons: Array<{
    text: string
    url: string
    variant?: 'primary' | 'secondary' | 'outline'
    size?: 'sm' | 'md' | 'lg'
  }>
  layout?: 'centered' | 'split' | 'inline'
  backgroundType?: 'solid' | 'gradient' | 'image'
  backgroundColor?: string
  gradientFrom?: string
  gradientTo?: string
  backgroundImage?: string
}

export function CTASection({ section, isEditing }: SectionProps<CTAContent>) {
  const { content, styles, settings } = section

  const getBackgroundStyle = () => {
    if (content.backgroundType === 'gradient') {
      return {
        background: `linear-gradient(135deg, ${content.gradientFrom || '#3b82f6'} 0%, ${content.gradientTo || '#8b5cf6'} 100%)`,
      }
    } else if (content.backgroundType === 'image' && content.backgroundImage) {
      return {
        backgroundImage: `url(${content.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    return {
      backgroundColor: content.backgroundColor || '#3b82f6',
    }
  }

  const buttonSizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <SectionWrapper
      styles={{ ...styles, ...getBackgroundStyle() }}
      settings={settings}
      isEditing={isEditing}
      className="py-16 md:py-20"
    >
      <div
        className={`
        ${content.layout === 'split' ? 'flex flex-col md:flex-row justify-between items-center gap-8' : ''}
        ${content.layout === 'centered' ? 'text-center max-w-3xl mx-auto' : ''}
        ${content.layout === 'inline' ? 'flex flex-wrap items-center gap-6' : ''}
      `}
      >
        <div className={content.layout === 'split' ? 'flex-1' : ''}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{content.title}</h2>
          {content.description && <p className="text-lg text-white/90">{content.description}</p>}
        </div>

        <div
          className={`flex flex-wrap gap-4 ${content.layout === 'centered' ? 'justify-center mt-8' : ''}`}
        >
          {content.buttons.map((button, index: number) => (
            <Link
              key={`cta-button-${button.text}-${index}`}
              href={button.url}
              className={`
                ${buttonSizes[(button.size as keyof typeof buttonSizes) || 'md']}
                rounded-md font-semibold transition-colors
                ${button.variant === 'primary' ? 'bg-white text-primary hover:bg-gray-100' : ''}
                ${button.variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}
                ${button.variant === 'outline' ? 'border-2 border-white text-white hover:bg-white hover:text-primary' : ''}
              `}
            >
              {button.text}
            </Link>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
