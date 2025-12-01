// packages/ui/src/components/primitives/input/index.ts
// Exports centralisés pour les composants Input

// Composants
export { Input } from './Input'
export { NumberInput } from './NumberInput'
export { SearchInput } from './SearchInput'
export { PasswordInput } from './PasswordInput'

// Types
export type {
  InputBaseProps,
  NumberInputProps,
  SearchInputProps,
  PasswordInputProps,
} from './types'

// Utilitaires (optionnel, si besoin externe)
export {
  formatDisplayValue,
  getVisualState,
  getAutoVariant,
  getAutoSize,
  isCheckableType,
  parseNumericProps,
  createSyntheticEvent,
} from './utils'

/**
 * DEPRECATED: CheckboxInput et RadioInput
 *
 * Ces composants sont dépréciés. Utilisez à la place:
 * - Pour checkbox: <Checkbox /> depuis primitives/checkbox
 * - Pour radio: <RadioGroup /> depuis primitives/radio-group
 *
 * Ces composants utilisent les primitives Radix UI appropriées
 * et offrent une meilleure accessibilité et UX.
 */

// Réexports pour rétrocompatibilité (DEPRECATED)
// Ces composants sont maintenus temporairement pour éviter les breaking changes
// mais doivent être migrés vers Checkbox et RadioGroup
export { CheckboxInput, RadioInput } from './deprecated'
