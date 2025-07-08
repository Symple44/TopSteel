/**
 * 🔘 BUTTON COMPONENT - TOPSTEEL ERP UI
 * Composant bouton robuste et accessible pour ERP
 *
 * Fonctionnalités:
 * - Variantes multiples (default, destructive, outline, secondary, ghost, link)
 * - Tailles adaptatives
 * - Support des icônes et états de chargement
 * - Thème adaptatif avec mode sombre
 * - Accessibilité complète (ARIA, keyboard navigation)
 * - Animations et transitions fluides
 * - Patterns métier ERP intégrés
 */

import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

// =============================================
// VARIANTS CONFIGURATION
// =============================================

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',

        // Variantes ERP spécifiques
        success: 'bg-green-600 text-white hover:bg-green-700',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
        info: 'bg-blue-600 text-white hover:bg-blue-700',

        // Variantes métallurgie
        steel:
          'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600 shadow-lg',
        iron: 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 shadow-lg',
        aluminum:
          'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 hover:from-slate-200 hover:to-slate-300 shadow-md',

        // Variantes d'action
        submit: 'bg-green-600 text-white hover:bg-green-700 shadow-md',
        cancel: 'bg-gray-500 text-white hover:bg-gray-600',
        edit: 'bg-blue-600 text-white hover:bg-blue-700',
        delete: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-9 rounded-md px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-md px-10 text-base',
        icon: 'h-10 w-10',
      },
      shape: {
        default: 'rounded-md',
        rounded: 'rounded-lg',
        pill: 'rounded-full',
        square: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'default',
    },
  }
)

// =============================================
// TYPES ET INTERFACES
// =============================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // État et comportement
  loading?: boolean
  disabled?: boolean

  // Contenu et icônes
  children?: React.ReactNode
  icon?: React.ReactNode
  iconPosition?: 'start' | 'end'
  loadingText?: string

  // Actions ERP spécifiques
  actionType?: 'submit' | 'cancel' | 'edit' | 'delete' | 'save' | 'export' | 'import' | 'print'
  confirmAction?: boolean
  confirmMessage?: string

  // Apparence
  fullWidth?: boolean
  shadow?: boolean

  // Accessibilité
  label?: string
  description?: string

  // Navigation
  href?: string
  target?: string
  download?: boolean
}

// =============================================
// HELPERS ET CONSTANTES
// =============================================

const ACTION_ICONS = {
  submit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  cancel: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  ),
  delete: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
  save: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
      />
    </svg>
  ),
  export: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  import: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v6m0 0l3-3m-3 3L9 7m3 13a9 9 0 100-18 9 9 0 000 18z"
      />
    </svg>
  ),
  print: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
      />
    </svg>
  ),
}

const getActionVariant = (actionType?: ButtonProps['actionType']) => {
  const actionMap = {
    submit: 'submit' as const,
    save: 'submit' as const,
    cancel: 'cancel' as const,
    edit: 'edit' as const,
    delete: 'delete' as const,
    export: 'info' as const,
    import: 'info' as const,
    print: 'secondary' as const,
  }

  return actionType ? actionMap[actionType] : undefined
}

const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <svg className={cn('animate-spin', sizeClasses[size])} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      loading = false,
      disabled = false,
      children,
      icon,
      iconPosition = 'start',
      loadingText,
      actionType,
      confirmAction = false,
      confirmMessage = 'Êtes-vous sûr de vouloir effectuer cette action ?',
      fullWidth = false,
      shadow = false,
      label,
      description,
      href,
      target,
      download,
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // État de confirmation
    const [isConfirming, setIsConfirming] = React.useState(false)

    // Déterminer la variante en fonction de l'actionType
    const finalVariant = variant || getActionVariant(actionType) || 'default'

    // Déterminer l'icône
    const finalIcon = icon || (actionType && ACTION_ICONS[actionType])

    // État final disabled
    const isDisabled = disabled || loading

    // Classes calculées
    const buttonClasses = cn(
      buttonVariants({ variant: finalVariant, size, shape }),
      {
        'w-full': fullWidth,
        'shadow-md': shadow,
        'cursor-not-allowed': isDisabled,
        'animate-pulse': loading,
        'ring-2 ring-destructive ring-offset-2': isConfirming && actionType === 'delete',
      },
      className
    )

    // Handler de click avec confirmation
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled) return

        if (confirmAction && !isConfirming) {
          e.preventDefault()
          if (window.confirm(confirmMessage)) {
            setIsConfirming(true)
            onClick?.(e)
            // Reset confirming state after action
            setTimeout(() => setIsConfirming(false), 100)
          }

          return
        }

        onClick?.(e)
      },
      [isDisabled, confirmAction, isConfirming, confirmMessage, onClick]
    )

    // Contenu du bouton
    const content = (
      <>
        {/* Icône de début ou spinner de chargement */}
        {finalIcon && iconPosition === 'start' && !loading && (
          <span className={cn('flex-shrink-0', children ? 'mr-2' : '')}>{finalIcon}</span>
        )}

        {loading && (
          <span className={cn('flex-shrink-0', children || loadingText ? 'mr-2' : '')}>
            <LoadingSpinner
              size={size === 'sm' ? 'sm' : size === 'lg' || size === 'xl' ? 'lg' : 'md'}
            />
          </span>
        )}

        {/* Texte principal */}
        {(children || loadingText) && (
          <span className="truncate">{loading && loadingText ? loadingText : children}</span>
        )}

        {/* Icône de fin */}
        {finalIcon && iconPosition === 'end' && !loading && (
          <span className={cn('flex-shrink-0', children ? 'ml-2' : '')}>{finalIcon}</span>
        )}
      </>
    )

    // Props d'accessibilité
    const accessibilityProps = {
      'aria-label': label || (actionType ? actionType : undefined),
      'aria-describedby': description ? `${props.id || 'button'}-description` : undefined,
      'aria-disabled': isDisabled,
      'aria-busy': loading,
      title: description || label,
    }

    // Si c'est un lien
    if (href) {
      return (
        <a
          ref={ref as any}
          href={href}
          target={target}
          download={download}
          className={buttonClasses}
          onClick={isDisabled ? (e) => e.preventDefault() : undefined}
          {...accessibilityProps}
          {...(props as any)}
        >
          {content}
        </a>
      )
    }

    return (
      <>
        <button
          ref={ref}
          type={type}
          className={buttonClasses}
          disabled={isDisabled}
          onClick={handleClick}
          {...accessibilityProps}
          {...props}
        >
          {content}
        </button>

        {/* Description en tooltip ou aide */}
        {description && (
          <div id={`${props.id || 'button'}-description`} className="sr-only">
            {description}
          </div>
        )}
      </>
    )
  }
)

Button.displayName = 'Button'

// =============================================
// COMPOSANTS SPÉCIALISÉS
// =============================================

/**
 * Bouton d'action ERP avec icône et style prédéfinis
 */
export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'actionType'> & { actionType: NonNullable<ButtonProps['actionType']> }
>(({ actionType, confirmAction, ...props }, ref) => {
  const shouldConfirm = confirmAction || actionType === 'delete'

  return <Button ref={ref} actionType={actionType} confirmAction={shouldConfirm} {...props} />
})

ActionButton.displayName = 'ActionButton'

/**
 * Bouton de formulaire avec gestion automatique des types
 */
export const FormButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { formAction?: 'submit' | 'reset' | 'cancel' }
>(({ formAction = 'submit', _type, variant, ...props }, ref) => {
  const buttonType =
    formAction === 'submit' ? 'submit' : formAction === 'reset' ? 'reset' : 'button'
  const buttonVariant =
    variant ||
    (formAction === 'submit' ? 'default' : formAction === 'cancel' ? 'outline' : 'secondary')

  return <Button ref={ref} type={buttonType} variant={buttonVariant} {...props} />
})

FormButton.displayName = 'FormButton'

/**
 * Bouton icône seul
 */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'children' | 'size'> & {
    icon: React.ReactNode
    size?: 'sm' | 'md' | 'lg'
    label: string
  }
>(({ icon, label, size = 'md', ...props }, ref) => {
  return (
    <Button
      ref={ref}
      size="icon"
      label={label}
      className={cn(size === 'sm' && 'h-8 w-8', size === 'lg' && 'h-12 w-12')}
      {...props}
    >
      {icon}
    </Button>
  )
})

IconButton.displayName = 'IconButton'

// =============================================
// EXPORTS
// =============================================

export { Button, buttonVariants }






