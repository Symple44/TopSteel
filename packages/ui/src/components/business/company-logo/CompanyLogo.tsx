'use client'

import { Building2 } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface CompanyInfo {
  name?: string
  logo?: string
}

export interface CompanyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  className?: string
  fallbackIcon?: boolean
  companyInfo?: CompanyInfo
  loading?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}

export function CompanyLogo({
  size = 'md',
  showName = false,
  className = '',
  fallbackIcon = true,
  companyInfo,
  loading = false,
}: CompanyLogoProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center space-x-3', className)}>
        <div className={cn(sizeClasses[size], 'bg-slate-200 rounded-lg animate-pulse')} />
        {showName && (
          <div
            className={cn('h-4 bg-slate-200 rounded w-24 animate-pulse', textSizeClasses[size])}
          />
        )}
      </div>
    )
  }

  const logoElement = companyInfo?.logo ? (
    <img
      src={companyInfo.logo}
      alt={`Logo ${companyInfo.name}`}
      className={cn(sizeClasses[size], 'object-contain rounded-lg')}
      onError={(e) => {
        // En cas d'erreur de chargement de l'image, afficher l'icône de fallback
        if (fallbackIcon) {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            const icon = document.createElement('div')
            icon.className = `${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white`
            icon.innerHTML =
              '<svg class="h-1/2 w-1/2" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9,22 9,12 15,12 15,22"></polyline></svg>'
            parent.appendChild(icon)
          }
        }
      }}
    />
  ) : fallbackIcon ? (
    <div
      className={cn(
        sizeClasses[size],
        'bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white'
      )}
    >
      <Building2 className="h-1/2 w-1/2" />
    </div>
  ) : null

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {logoElement}
      {showName && companyInfo?.name && (
        <span className={cn('font-semibold text-slate-800', textSizeClasses[size])}>
          {companyInfo.name}
        </span>
      )}
    </div>
  )
}

export default CompanyLogo
