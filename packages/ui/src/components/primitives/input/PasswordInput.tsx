'use client'

// packages/ui/src/components/primitives/input/PasswordInput.tsx
// Composant PasswordInput - Input mot de passe avec toggle de visibilité

import type { ButtonHTMLAttributes } from 'react'
import { forwardRef, useState } from 'react'
import { Input } from './Input'
import type { PasswordInputProps } from './types'
import { buttonVariants } from '../../../variants'
import { cn } from '../../../lib/utils'

/**
 * Composant Button interne pour le toggle
 */
interface InternalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const InternalButton = forwardRef<HTMLButtonElement, InternalButtonProps>(
  ({ className, variant = 'ghost', size = 'icon', ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    )
  }
)

InternalButton.displayName = 'InternalButton'

/**
 * Icône Eye (afficher)
 */
const EyeIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    role="img"
    aria-label="Afficher le mot de passe"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
)

/**
 * Icône EyeOff (masquer)
 */
const EyeOffIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    role="img"
    aria-label="Masquer le mot de passe"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
    />
  </svg>
)

/**
 * Input mot de passe avec toggle de visibilité
 *
 * Fonctionnalités:
 * - Toggle show/hide password
 * - Icône eye/eye-off
 * - Type switch entre 'password' et 'text'
 * - Support de tous les états de validation
 *
 * @example
 * ```tsx
 * <PasswordInput
 *   showToggle={true}
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   error={passwordError}
 * />
 * ```
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    // Si showToggle est désactivé, on affiche juste un input password simple
    if (!showToggle) {
      return <Input type="password" variant="password" ref={ref} {...props} />
    }

    return (
      <Input
        type={showPassword ? 'text' : 'password'}
        variant="password"
        endIcon={
          <InternalButton
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </InternalButton>
        }
        ref={ref}
        {...props}
      />
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
