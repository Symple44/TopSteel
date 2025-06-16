// packages/ui/src/components/layout/page-header.tsx
import React from 'react'
import { Button } from '../base/button'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '../base/breadcrumb'
import { ArrowLeft } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  backButton?: {
    label?: string
    onClick: () => void
  }
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  backButton,
  className
}: PageHeaderProps) {
  return (
    <div className={`border-b bg-background ${className}`}>
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4 flex-1">
          {backButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={backButton.onClick}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="ml-1">{backButton.label || 'Retour'}</span>
            </Button>
          )}
          
          <div className="flex-1">
            {breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        {item.href ? (
                          <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                        ) : (
                          <span>{item.label}</span>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
            
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}