# Input Components

Composants Input modulaires et maintenables pour le TopSteel ERP.

## Structure du Module

```
input/
├── Input.tsx           - Input de base avec validation et icônes
├── NumberInput.tsx     - Input numérique avec min/max/step/precision
├── SearchInput.tsx     - Input de recherche avec icône et clear
├── PasswordInput.tsx   - Input mot de passe avec toggle visibilité
├── deprecated.tsx      - Composants dépréciés (CheckboxInput, RadioInput)
├── types.ts            - Types et interfaces partagés
├── utils.ts            - Fonctions utilitaires
├── index.ts            - Point d'entrée et exports
└── __tests__/          - Tests unitaires
```

## Installation

Les composants Input sont disponibles via le package `@erp/ui`:

```bash
pnpm add @erp/ui
```

## Utilisation

### Input de base

```tsx
import { Input } from '@erp/ui'

function MyForm() {
  const [value, setValue] = useState('')

  return (
    <Input
      type="text"
      placeholder="Entrez votre nom"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      error={error}
      success={isValid}
    />
  )
}
```

### Props disponibles

```typescript
interface InputBaseProps {
  // États de validation
  error?: boolean | string
  success?: boolean
  warning?: boolean

  // Icônes
  startIcon?: ReactNode
  endIcon?: ReactNode

  // Features
  loading?: boolean
  clearable?: boolean
  onClear?: () => void

  // Support number/string
  value?: string | number
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}
```

---

## NumberInput

Input numérique avec validation automatique.

### Exemple

```tsx
import { NumberInput } from '@erp/ui'

function PriceInput() {
  const [price, setPrice] = useState(0)

  return (
    <NumberInput
      min={0}
      max={10000}
      step={0.01}
      precision={2}
      allowNegative={false}
      value={price}
      onChange={(e) => setPrice(parseFloat(e.target.value))}
      startIcon={<span>€</span>}
    />
  )
}
```

### Props spécifiques

```typescript
interface NumberInputProps extends InputBaseProps {
  min?: number            // Valeur minimale
  max?: number            // Valeur maximale
  step?: number           // Incrément (défaut: 1)
  precision?: number      // Nombre de décimales (défaut: 2)
  allowNegative?: boolean // Autoriser les négatifs (défaut: false)
}
```

---

## SearchInput

Input de recherche avec icône et clear automatique.

### Exemple

```tsx
import { SearchInput } from '@erp/ui'

function UserSearch() {
  const [query, setQuery] = useState('')

  const handleSearch = (value: string) => {
    console.log('Recherche:', value)
    // Appeler l'API de recherche
  }

  return (
    <SearchInput
      placeholder="Rechercher un utilisateur..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onSearch={handleSearch}
      clearable={true}
    />
  )
}
```

### Props spécifiques

```typescript
interface SearchInputProps extends InputBaseProps {
  onSearch?: (value: string) => void  // Callback sur Enter ou clear
  // clearable est true par défaut
}
```

### Comportement

- Déclenche `onSearch` sur la touche **Enter**
- Déclenche `onSearch('')` quand on clique sur le bouton **clear**
- Affiche une icône de recherche à gauche
- Bouton clear visible uniquement si la valeur n'est pas vide

---

## PasswordInput

Input mot de passe avec toggle de visibilité.

### Exemple

```tsx
import { PasswordInput } from '@erp/ui'

function LoginForm() {
  const [password, setPassword] = useState('')

  return (
    <PasswordInput
      placeholder="Mot de passe"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      error={passwordError}
      showToggle={true}
    />
  )
}
```

### Props spécifiques

```typescript
interface PasswordInputProps extends InputBaseProps {
  showToggle?: boolean  // Afficher le bouton toggle (défaut: true)
}
```

### Comportement

- Type switch entre `password` et `text` au clic sur le toggle
- Icône **eye** pour afficher le mot de passe
- Icône **eye-off** pour masquer le mot de passe
- Labels accessibles pour les lecteurs d'écran

---

## États de Validation

Tous les composants supportent 3 états de validation:

### Error

```tsx
<Input
  error="Ce champ est requis"
  // ou
  error={true}
/>
```

### Success

```tsx
<Input
  success={true}
/>
```

### Warning

```tsx
<Input
  warning={true}
/>
```

Les états sont exclusifs (error > success > warning).

---

## Icônes

Ajoutez des icônes au début ou à la fin:

```tsx
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline'

<Input
  startIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
  placeholder="Rechercher..."
/>

<Input
  endIcon={<UserIcon className="w-4 h-4" />}
  placeholder="Nom d'utilisateur"
/>
```

---

## Loading State

Affichez un spinner pendant le chargement:

```tsx
<Input
  loading={isLoading}
  placeholder="Chargement..."
  disabled={isLoading}
/>
```

---

## Clearable

Ajoutez un bouton pour effacer la valeur:

```tsx
<Input
  clearable={true}
  onClear={() => {
    console.log('Input cleared!')
    setValue('')
  }}
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

Le bouton clear:
- Apparaît uniquement si `value` n'est pas vide
- Déclenche `onClear` et `onChange` avec une valeur vide
- Est caché si `loading={true}`

---

## Composants Dépréciés

### CheckboxInput (DEPRECATED)

```tsx
// ❌ DEPRECATED
import { CheckboxInput } from '@erp/ui'
<CheckboxInput />

// ✅ Utiliser à la place
import { Checkbox } from '@erp/ui'
<Checkbox />
```

### RadioInput (DEPRECATED)

```tsx
// ❌ DEPRECATED
import { RadioInput } from '@erp/ui'
<RadioInput />

// ✅ Utiliser à la place
import { RadioGroup, RadioGroupItem } from '@erp/ui'
<RadioGroup>
  <RadioGroupItem value="option1" />
  <RadioGroupItem value="option2" />
</RadioGroup>
```

**Raison**: Les primitives Radix UI offrent une meilleure accessibilité et UX.

---

## Accessibilité

Tous les composants respectent les standards WCAG:

### Labels ARIA

```tsx
<Input
  aria-label="Nom d'utilisateur"
  aria-describedby="username-help"
/>
<span id="username-help">Entrez votre nom d'utilisateur</span>
```

### Required/Disabled

```tsx
<Input
  required
  aria-required="true"
/>

<Input
  disabled
  aria-disabled="true"
/>
```

### États d'erreur

```tsx
<Input
  error="Ce champ est requis"
  aria-invalid="true"
  aria-errormessage="error-message"
/>
<span id="error-message" role="alert">Ce champ est requis</span>
```

---

## Variantes CSS

Les composants utilisent `class-variance-authority` pour les variantes:

```typescript
inputVariants({
  variant: 'default' | 'search' | 'password' | 'checkbox' | 'radio' | 'textarea',
  size: 'default' | 'sm' | 'lg' | 'xl',
  state: 'default' | 'error' | 'success' | 'warning'
})
```

---

## Types Exportés

```typescript
import type {
  InputBaseProps,
  NumberInputProps,
  SearchInputProps,
  PasswordInputProps
} from '@erp/ui'
```

---

## Utilitaires Exportés

```typescript
import {
  formatDisplayValue,      // Conversion number → string
  getVisualState,          // Détermine l'état visuel
  getAutoVariant,          // Détermine la variante CSS
  getAutoSize,             // Détermine la taille
  isCheckableType,         // Vérifie si checkbox ou radio
  parseNumericProps,       // Parse min/max/step
  createSyntheticEvent,    // Crée un événement synthétique
} from '@erp/ui'
```

Ces utilitaires sont principalement pour un usage interne, mais peuvent être utiles pour créer des composants custom.

---

## Tests

Les tests sont dans `__tests__/Input.test.tsx`:

```bash
# Lancer les tests
pnpm test input

# Avec coverage
pnpm test:coverage input
```

---

## Migration depuis l'ancien Input

### Avant (monolithique)

```tsx
import { Input, NumberInput, SearchInput, PasswordInput } from '@erp/ui'
```

### Après (modulaire)

```tsx
// Même imports - Aucun changement nécessaire!
import { Input, NumberInput, SearchInput, PasswordInput } from '@erp/ui'
```

La rétrocompatibilité est totale. Les seuls changements sont internes.

---

## Contribution

Pour contribuer au module Input:

1. Créer une branche depuis `main`
2. Modifier les fichiers dans `input/`
3. Mettre à jour les tests dans `__tests__/`
4. Vérifier TypeScript: `pnpm tsc --noEmit`
5. Lancer les tests: `pnpm test`
6. Créer une PR

### Guidelines

- Un fichier = une responsabilité
- Documenter avec JSDoc
- Ajouter des tests pour chaque feature
- Préserver la rétrocompatibilité
- Utiliser les types de `types.ts`
- Utiliser les utilitaires de `utils.ts`

---

## Ressources

- [Documentation Design System](../../../DESIGN-SYSTEM.md)
- [Rapport de Refactoring](./REFACTORING-REPORT.md)
- [Tests](./\_\_tests\_\_/Input.test.tsx)
- [Types](./types.ts)
- [Utilitaires](./utils.ts)

---

**Dernière mise à jour**: 30 novembre 2025
