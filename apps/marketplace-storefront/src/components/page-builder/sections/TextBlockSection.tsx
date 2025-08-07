'use client'

import DOMPurify from 'dompurify'
import { SectionWrapper } from './SectionWrapper'
import type { SectionProps } from './types'

export interface TextBlockContent {
  title?: string
  subtitle?: string
  content: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  columns?: 1 | 2 | 3
  showDivider?: boolean
}

export function TextBlockSection({ section, isEditing }: SectionProps<TextBlockContent>) {
  const { content, styles, settings } = section

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  }

  const columnsClasses = {
    1: 'max-w-4xl mx-auto',
    2: 'md:columns-2 gap-8',
    3: 'md:columns-3 gap-8',
  }

  return (
    <SectionWrapper
      styles={styles}
      settings={settings}
      isEditing={isEditing}
      className="py-12 md:py-16"
    >
      <div
        className={`${columnsClasses[(content.columns as keyof typeof columnsClasses) || 1]} ${alignmentClasses[(content.alignment as keyof typeof alignmentClasses) || 'left']}`}
      >
        {content.title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h2>}

        {content.subtitle && (
          <h3 className="text-xl md:text-2xl text-muted-foreground mb-6">{content.subtitle}</h3>
        )}

        {content.showDivider && <div className="w-24 h-1 bg-primary mx-auto mb-8" />}

        <div
          className="prose prose-lg max-w-none"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized with DOMPurify for XSS protection
          dangerouslySetInnerHTML={{
            __html:
              typeof window !== 'undefined'
                ? DOMPurify.sanitize(content.content, {
                    ALLOWED_TAGS: [
                      'p',
                      'br',
                      'strong',
                      'em',
                      'u',
                      'h1',
                      'h2',
                      'h3',
                      'h4',
                      'h5',
                      'h6',
                      'ul',
                      'ol',
                      'li',
                      'a',
                      'blockquote',
                      'img',
                    ],
                    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'title'],
                  })
                : content.content.replace(
                    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                    ''
                  ),
          }}
        />
      </div>
    </SectionWrapper>
  )
}
