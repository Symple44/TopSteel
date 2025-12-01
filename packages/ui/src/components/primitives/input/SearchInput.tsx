'use client'

// packages/ui/src/components/primitives/input/SearchInput.tsx
// Composant SearchInput - Input de recherche avec icône et bouton clear

import { forwardRef, useCallback } from 'react'
import { Input } from './Input'
import type { SearchInputProps } from './types'

/**
 * Icône de recherche SVG
 */
const SearchIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
)

/**
 * Input de recherche avec icône et bouton clear
 *
 * Fonctionnalités:
 * - Icône de recherche à gauche
 * - Bouton clear à droite (optionnel via clearable)
 * - Callback onSearch déclenché sur Enter ou clear
 * - Placeholder par défaut "Rechercher..."
 *
 * @example
 * ```tsx
 * <SearchInput
 *   placeholder="Rechercher un utilisateur..."
 *   clearable={true}
 *   onSearch={(value) => console.log('Recherche:', value)}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 * ```
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      placeholder = 'Rechercher...',
      clearable = true,
      onSearch,
      onClear,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    // Handler pour la touche Enter
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearch) {
          e.preventDefault()
          const value = (e.target as HTMLInputElement).value
          onSearch(value)
        }
        onKeyDown?.(e)
      },
      [onSearch, onKeyDown]
    )

    // Handler pour le clear qui déclenche aussi onSearch
    const handleClear = useCallback(() => {
      onClear?.()
      onSearch?.('')
    }, [onClear, onSearch])

    return (
      <Input
        type="search"
        variant="search"
        placeholder={placeholder}
        clearable={clearable}
        onClear={handleClear}
        onKeyDown={handleKeyDown}
        startIcon={<SearchIcon />}
        ref={ref}
        {...props}
      />
    )
  }
)

SearchInput.displayName = 'SearchInput'
