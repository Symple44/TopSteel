# Système de Génération CSS - TopSteel Design System

## Vue d'ensemble

Ce document décrit le système de génération automatique de CSS depuis les tokens TypeScript pour éviter la duplication et maintenir une source unique de vérité.

## Architecture

### 1. Source de vérité: Tokens TypeScript

Les tokens sont définis en TypeScript avec type-safety:

```
src/
├── themes/
│   ├── light.ts           # Thème clair
│   ├── dark.ts            # Thème sombre
│   ├── types.ts           # Types TypeScript
│   ├── index.ts           # Point d'entrée
│   └── generator.ts       # Générateur CSS ✨
├── tokens/
│   ├── layout.ts          # Dimensions layout
│   └── status-css.ts      # Couleurs de statut
└── styles/
    ├── generated-theme.css # CSS généré ⚠️
    └── README.md
```

### 2. Générateur CSS

**Fichier:** `src/themes/generator.ts`

Fonctionnalités:
- Convertit les tokens TypeScript en variables CSS
- Valide la cohérence entre les thèmes
- Génère un fichier CSS optimisé

```typescript
export function generateThemeCSS(): string
export function validateTokens(): { valid: boolean; errors: string[] }
```

### 3. Script de génération

**Fichier:** `scripts/generate-css.ts`

Exécute la génération:
```bash
pnpm generate:css
```

Sortie:
```
🎨 TopSteel CSS Generator
========================
📋 Validating tokens...
✅ Tokens validated successfully
🔧 Generating CSS...
✅ CSS generated: [...]/generated-theme.css
📊 Stats:
  - Lines: 85
  - Size: 2.37 KB
✨ Done!
```

## Utilisation

### Modifier des couleurs ou tokens

1. **Modifiez les fichiers source:**
   - Pour les thèmes: `src/themes/light.ts` ou `dark.ts`
   - Pour le layout: `src/tokens/layout.ts`
   - Pour les statuts: `src/tokens/status-css.ts`

2. **Régénérez le CSS:**
   ```bash
   cd packages/ui
   pnpm generate:css
   ```

3. **Le fichier `generated-theme.css` est mis à jour automatiquement**

### Ajouter un nouveau token

**Exemple: Ajouter une couleur de highlight**

1. Modifiez `src/themes/light.ts`:
```typescript
export const lightTheme: ThemeConfig = {
  // ...
  colors: {
    // ... couleurs existantes
    highlight: '50 100% 60%',           // Nouveau token
    highlightForeground: '0 0% 100%',   // Nouveau token
  }
}
```

2. Modifiez `src/themes/dark.ts` (IMPORTANT: mêmes clés):
```typescript
export const darkTheme: ThemeConfig = {
  // ...
  colors: {
    // ... couleurs existantes
    highlight: '50 100% 50%',           // Même clé
    highlightForeground: '220 13% 98%', // Même clé
  }
}
```

3. Régénérez:
```bash
pnpm generate:css
```

4. Le CSS généré contient maintenant:
```css
:root {
  --highlight: 50 100% 60%;
  --highlight-foreground: 0 0% 100%;
}

.dark {
  --highlight: 50 100% 50%;
  --highlight-foreground: 220 13% 98%;
}
```

## Validation

Le générateur valide automatiquement:

### Vérification des clés

Les thèmes `light` et `dark` doivent avoir **exactement les mêmes clés**.

Si vous ajoutez une couleur dans `light` mais pas dans `dark`, vous obtiendrez:

```
❌ Validation failed:
  - Light and Dark themes have different color keys
```

### Conventions de nommage

Les clés sont automatiquement converties de `camelCase` en `kebab-case`:

| TypeScript (camelCase) | CSS (kebab-case) |
|------------------------|------------------|
| `cardForeground`       | `--card-foreground` |
| `mutedForeground`      | `--muted-foreground` |
| `successForeground`    | `--success-foreground` |

## Structure du CSS généré

```css
/* ============================================
 * GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from TypeScript tokens
 * Run: pnpm generate:css to regenerate
 * ============================================ */

:root {
  /* Light Theme Colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 217 91% 45%;
  /* ... autres couleurs ... */

  /* Layout Dimensions */
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 64px;
  --header-height: 56px;
  --content-max-width: 1400px;

  /* Status Colors */
  --status-en-cours: 217 91% 60%;
  --status-termine: 142 76% 36%;
  /* ... autres statuts ... */
}

.dark {
  /* Dark Theme Colors */
  --background: 220 13% 18%;
  --foreground: 220 9% 98%;
  --primary: 217 91% 60%;
  /* ... autres couleurs ... */
}
```

## Intégration dans l'application

### Dans Next.js (apps/web)

**Méthode 1: Import direct dans globals.css**

```css
/* apps/web/src/styles/globals.css */
@import '@erp/ui/src/styles/generated-theme.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Méthode 2: Import dans _app.tsx ou layout.tsx**

```typescript
// apps/web/src/app/layout.tsx
import '@erp/ui/src/styles/generated-theme.css'
```

### Utilisation des variables CSS

Les variables sont disponibles partout dans l'application:

```css
/* CSS classique */
.my-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border-color: hsl(var(--border));
}
```

```typescript
// Tailwind avec les variables
<div className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
  ...
</div>
```

## Workflow de développement

### Développement local

1. Modifiez les tokens TypeScript
2. `pnpm generate:css`
3. Le CSS est régénéré
4. Le navigateur se recharge (HMR)

### Avant un commit

```bash
# Vérifier que le CSS est à jour
pnpm generate:css

# Si des changements, commit les deux fichiers
git add src/themes/light.ts src/styles/generated-theme.css
git commit -m "feat: update theme colors"
```

### CI/CD

Ajoutez dans votre pipeline:

```yaml
# .github/workflows/build.yml
- name: Generate CSS from tokens
  run: pnpm --filter @erp/ui generate:css

- name: Check for uncommitted changes
  run: |
    if [[ -n $(git status --porcelain) ]]; then
      echo "❌ CSS not up to date. Run 'pnpm generate:css'"
      exit 1
    fi
```

## Avantages du système

### 1. Source unique de vérité
- Les tokens TypeScript sont la référence
- Pas de duplication entre TS et CSS
- Modifications centralisées

### 2. Type-safety
- Autocomplete dans l'éditeur
- Détection d'erreurs à la compilation
- Refactoring sécurisé

### 3. Validation automatique
- Vérifie la cohérence des thèmes
- Détecte les clés manquantes
- Garantit la qualité

### 4. Maintenance facilitée
- Un seul endroit pour modifier les couleurs
- Génération automatique du CSS
- Documentation intégrée

## Migration depuis CSS manuel

Si vous avez du CSS manuel à migrer:

### Avant (duplication)

```typescript
// src/themes/light.ts
colors: {
  primary: '217 91% 45%',
}
```

```css
/* globals.css - DUPLICATION! */
:root {
  --primary: 217 91% 45%;
}
```

### Après (source unique)

```typescript
// src/themes/light.ts
colors: {
  primary: '217 91% 45%',
}

// Exécutez: pnpm generate:css
// Le CSS est généré automatiquement!
```

## Troubleshooting

### Erreur: "Light and Dark themes have different color keys"

**Cause:** Vous avez ajouté une couleur dans un thème mais pas dans l'autre.

**Solution:** Ajoutez la couleur manquante dans les deux thèmes.

### Le CSS n'est pas mis à jour

**Vérifiez:**
1. Avez-vous exécuté `pnpm generate:css` ?
2. Le fichier `generated-theme.css` a-t-il été modifié ?
3. L'application a-t-elle rechargé ?

### Variables CSS non trouvées

**Vérifiez:**
1. Le fichier CSS est importé dans votre application
2. La variable existe dans `generated-theme.css`
3. La syntaxe est correcte: `hsl(var(--primary))`

## Fichiers importants

| Fichier | Description | Éditable ? |
|---------|-------------|------------|
| `src/themes/light.ts` | Thème clair | ✅ Oui |
| `src/themes/dark.ts` | Thème sombre | ✅ Oui |
| `src/tokens/layout.ts` | Dimensions layout | ✅ Oui |
| `src/tokens/status-css.ts` | Couleurs statut | ✅ Oui |
| `src/themes/generator.ts` | Générateur | ✅ Oui (rarement) |
| `scripts/generate-css.ts` | Script | ✅ Oui (rarement) |
| `src/styles/generated-theme.css` | CSS généré | ❌ **NON** |

## Prochaines étapes

### Améliorations possibles

1. **Watch mode:**
   ```bash
   pnpm generate:css --watch
   ```

2. **Génération de types TypeScript:**
   ```typescript
   type ThemeColors = '--background' | '--foreground' | '--primary' | ...
   ```

3. **PostCSS plugin:**
   - Génération automatique pendant le build
   - Intégration transparente

4. **Documentation Storybook:**
   - Visualisation des tokens
   - Prévisualisation des thèmes

## Conclusion

Le système de génération CSS:
- ✅ Évite la duplication
- ✅ Maintient la cohérence
- ✅ Facilite la maintenance
- ✅ Garantit le type-safety
- ✅ Automatise les tâches répétitives

Pour toute question, consultez:
- `src/styles/README.md` - Documentation des styles
- `src/themes/types.ts` - Types TypeScript
- `DESIGN-SYSTEM.md` - Documentation générale
