# Guide Rapide - Génération CSS

Guide pratique pour utiliser le système de génération CSS du TopSteel Design System.

## Installation

Le système est déjà configuré. Aucune installation supplémentaire nécessaire.

## Utilisation Quotidienne

### Générer le CSS

```bash
cd packages/ui
pnpm generate:css
```

**Sortie:**
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

### Tester le système

```bash
pnpm test:css
```

**Sortie:**
```
🧪 Testing CSS Generation System
...
🎉 All tests passed!
```

## Modifier des Couleurs

### 1. Thème Clair

**Fichier:** `src/themes/light.ts`

```typescript
export const lightTheme: ThemeConfig = {
  name: 'light',
  colors: {
    primary: '217 91% 45%',        // 👈 Modifier ici
    background: '0 0% 100%',
    // ...
  }
}
```

### 2. Thème Sombre

**Fichier:** `src/themes/dark.ts`

```typescript
export const darkTheme: ThemeConfig = {
  name: 'dark',
  colors: {
    primary: '217 91% 60%',        // 👈 Modifier ici
    background: '220 13% 18%',
    // ...
  }
}
```

### 3. Régénérer

```bash
pnpm generate:css
```

C'est tout! Le CSS est mis à jour automatiquement.

## Ajouter une Nouvelle Couleur

### Étape 1: Light Theme

```typescript
// src/themes/light.ts
colors: {
  // ... couleurs existantes
  highlight: '50 100% 60%',
  highlightForeground: '0 0% 100%',
}
```

### Étape 2: Dark Theme (IMPORTANT!)

```typescript
// src/themes/dark.ts
colors: {
  // ... couleurs existantes
  highlight: '50 100% 50%',           // 👈 Même nom de clé
  highlightForeground: '220 13% 98%', // 👈 Même nom de clé
}
```

### Étape 3: Générer

```bash
pnpm generate:css
```

### Étape 4: Utiliser

```typescript
// Dans votre composant
<div className="bg-[hsl(var(--highlight))]">
  Texte en surbrillance
</div>
```

## Modifier le Layout

**Fichier:** `src/tokens/layout.ts`

```typescript
export const layoutTokens = {
  sidebar: {
    width: '260px',              // 👈 Modifier ici
    collapsedWidth: '64px',
  },
  header: {
    height: '56px',              // 👈 Modifier ici
  },
  // ...
}
```

Puis:
```bash
pnpm generate:css
```

## Erreurs Courantes

### Erreur: Clés différentes

```
❌ Validation failed:
  - Light and Dark themes have different color keys
```

**Cause:** Vous avez ajouté une couleur dans un thème mais pas dans l'autre.

**Solution:** Ajoutez la couleur manquante.

### CSS non mis à jour

**Vérifiez:**
1. Avez-vous exécuté `pnpm generate:css` ?
2. Êtes-vous dans le bon dossier (`packages/ui`) ?

## Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `pnpm generate:css` | Génère le CSS depuis les tokens |
| `pnpm test:css` | Teste le système de génération |

## Fichiers

### À Modifier

- ✅ `src/themes/light.ts` - Thème clair
- ✅ `src/themes/dark.ts` - Thème sombre
- ✅ `src/tokens/layout.ts` - Dimensions

### À NE PAS Modifier

- ❌ `src/styles/generated-theme.css` - Généré automatiquement

## Format des Couleurs

Les couleurs utilisent le format HSL sans `hsl()`:

```typescript
// ✅ Correct
'217 91% 45%'

// ❌ Incorrect
'hsl(217, 91%, 45%)'
'#1976D2'
```

## Utilisation dans l'Application

### Import

```typescript
// Dans layout.tsx ou _app.tsx
import '@erp/ui/src/styles/generated-theme.css'
```

### Utilisation

```css
/* CSS classique */
.mon-composant {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

```typescript
// Tailwind
<div className="bg-[hsl(var(--background))]">
  ...
</div>
```

## Workflow Recommandé

```bash
# 1. Modifier les tokens
vim src/themes/light.ts

# 2. Générer le CSS
pnpm generate:css

# 3. Tester
pnpm test:css

# 4. Vérifier visuellement dans le navigateur

# 5. Commit
git add src/themes/light.ts src/styles/generated-theme.css
git commit -m "feat: update primary color"
```

## Variables CSS Générées

Le fichier généré contient 67 variables CSS:

- 25 couleurs pour le thème clair (`:root`)
- 25 couleurs pour le thème sombre (`.dark`)
- 4 dimensions de layout
- 13 couleurs de statut

**Exemple:**

```css
:root {
  /* Couleurs */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 217 91% 45%;

  /* Layout */
  --sidebar-width: 260px;
  --header-height: 56px;

  /* Statuts */
  --status-en-cours: 217 91% 60%;
  --status-termine: 142 76% 36%;
}

.dark {
  --background: 220 13% 18%;
  --foreground: 220 9% 98%;
  --primary: 217 91% 60%;
}
```

## Support

Pour plus de détails, consultez:

- **Guide complet:** `CSS-GENERATION-SYSTEM.md`
- **Documentation styles:** `src/styles/README.md`
- **Changelog:** `CHANGELOG-CSS-GENERATION.md`

## Aide Rapide

```bash
# Générer le CSS
pnpm generate:css

# Tester
pnpm test:css

# Voir les fichiers
ls src/themes/     # Thèmes
ls src/tokens/     # Tokens
ls src/styles/     # CSS généré
```

---

**Note:** Ne modifiez JAMAIS manuellement le fichier `generated-theme.css`. Il sera écrasé lors de la prochaine génération.
