# Changelog - Système de Génération CSS

## [2.1.0] - 2025-11-30

### Added ✨

#### Système de génération automatique CSS

**Nouveaux fichiers:**
- `src/themes/generator.ts` - Générateur CSS depuis tokens TypeScript
- `scripts/generate-css.ts` - Script de génération
- `src/styles/generated-theme.css` - CSS généré (auto)
- `src/styles/README.md` - Documentation des styles
- `CSS-GENERATION-SYSTEM.md` - Documentation complète du système

**Nouveau script npm:**
```json
"generate:css": "tsx scripts/generate-css.ts"
```

**Nouvelle dépendance:**
- `tsx@^4.20.5` (devDependencies)

### Features

#### 1. Génération automatique
- Convertit les tokens TypeScript en variables CSS
- Évite la duplication entre TS et CSS
- Source unique de vérité

#### 2. Validation
- Vérifie que `light` et `dark` ont les mêmes clés
- Détecte les incohérences
- Rapport d'erreurs détaillé

#### 3. Conversion automatique
- `camelCase` → `kebab-case`
- Exemples:
  - `cardForeground` → `--card-foreground`
  - `mutedForeground` → `--muted-foreground`
  - `successForeground` → `--success-foreground`

#### 4. Structure organisée
```
:root {
  /* Light Theme Colors */
  --background: 0 0% 100%;
  --primary: 217 91% 45%;

  /* Layout Dimensions */
  --sidebar-width: 260px;

  /* Status Colors */
  --status-en-cours: 217 91% 60%;
}

.dark {
  /* Dark Theme Colors */
  --background: 220 13% 18%;
  --primary: 217 91% 60%;
}
```

### Benefits 🎯

1. **Type-safety**
   - Autocomplete dans TypeScript
   - Détection d'erreurs à la compilation

2. **Maintenance facilitée**
   - Un seul endroit pour modifier les couleurs
   - Pas de duplication

3. **Validation automatique**
   - Cohérence garantie entre thèmes
   - Erreurs détectées tôt

4. **Documentation intégrée**
   - Commentaires dans le CSS généré
   - Avertissement contre l'édition manuelle

### Usage

```bash
# Générer le CSS depuis les tokens
pnpm generate:css

# Sortie
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

### Integration

**Dans votre application:**

```typescript
// Option 1: Import direct
import '@erp/ui/src/styles/generated-theme.css'

// Option 2: Dans globals.css
@import '@erp/ui/src/styles/generated-theme.css';
```

### Workflow

1. Modifier les tokens dans `src/themes/light.ts` ou `dark.ts`
2. Exécuter `pnpm generate:css`
3. Le CSS est régénéré automatiquement
4. Commit les deux fichiers (token + CSS généré)

### Examples

**Ajouter une nouvelle couleur:**

```typescript
// src/themes/light.ts
export const lightTheme: ThemeConfig = {
  colors: {
    // Couleurs existantes...
    highlight: '50 100% 60%',
    highlightForeground: '0 0% 100%',
  }
}

// src/themes/dark.ts
export const darkTheme: ThemeConfig = {
  colors: {
    // Couleurs existantes...
    highlight: '50 100% 50%',
    highlightForeground: '220 13% 98%',
  }
}
```

```bash
pnpm generate:css
```

**Résultat dans le CSS généré:**
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

### Migration

**Avant (duplication):**
```typescript
// TypeScript
colors: { primary: '217 91% 45%' }

// CSS (manuel)
:root { --primary: 217 91% 45%; }
```

**Après (source unique):**
```typescript
// TypeScript (source unique)
colors: { primary: '217 91% 45%' }

// CSS (généré automatiquement)
// pnpm generate:css
```

### Breaking Changes

Aucun - Le système est additif et compatible avec l'existant.

### Next Steps

Améliorations futures possibles:
1. Watch mode pour régénération automatique
2. Génération de types TypeScript pour les variables CSS
3. PostCSS plugin pour intégration transparente
4. Visualisation Storybook des tokens

### Documentation

- `CSS-GENERATION-SYSTEM.md` - Guide complet
- `src/styles/README.md` - Documentation des styles
- `src/themes/generator.ts` - Code documenté
- `scripts/generate-css.ts` - Script documenté

### Stats

- **Fichiers créés:** 5
- **Lignes de code:** ~250
- **Tokens générés:** 34 couleurs + 4 dimensions + 13 statuts = 51 variables CSS
- **Taille CSS généré:** 2.37 KB
- **Temps de génération:** < 1 seconde

### Author

TopSteel Engineering Team

### References

- Design System: `DESIGN-SYSTEM.md`
- Status Tokens: `CHANGELOG-STATUS-TOKENS.md`
- Themes: `src/themes/`
- Tokens: `src/tokens/`
