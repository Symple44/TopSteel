# Styles Générés - TopSteel Design System

Ce dossier contient les fichiers CSS générés automatiquement depuis les tokens TypeScript.

## Fichiers

- **generated-theme.css** - Variables CSS pour les thèmes et tokens (généré automatiquement)

## Utilisation

### Génération du CSS

Pour régénérer le fichier CSS depuis les tokens TypeScript:

```bash
pnpm generate:css
```

### Import dans votre application

```typescript
// Dans votre application Next.js ou React
import '@erp/ui/src/styles/generated-theme.css'
```

Ou via Tailwind CSS (globals.css):

```css
@import '@erp/ui/src/styles/generated-theme.css';
```

## Architecture

Le CSS est généré depuis:

1. **Thèmes** (`src/themes/`)
   - `light.ts` - Thème clair
   - `dark.ts` - Thème sombre

2. **Tokens** (`src/tokens/`)
   - `layout.ts` - Dimensions du layout
   - `status-css.ts` - Couleurs de statut

3. **Générateur** (`src/themes/generator.ts`)
   - Convertit les tokens TypeScript en variables CSS
   - Valide la cohérence entre thèmes

## Avantages

- **Source unique de vérité**: Les tokens TypeScript
- **Type-safe**: Autocomplete dans TypeScript
- **Pas de duplication**: Le CSS est généré automatiquement
- **Validation**: Vérifie que light et dark ont les mêmes clés

## Maintenance

**NE PAS ÉDITER MANUELLEMENT** le fichier `generated-theme.css`.

Pour modifier les couleurs ou tokens:
1. Modifiez les fichiers dans `src/themes/` ou `src/tokens/`
2. Exécutez `pnpm generate:css`
3. Le fichier CSS sera régénéré automatiquement

## Structure du fichier généré

```css
:root {
  /* Light Theme Colors */
  --background: 0 0% 100%;
  --primary: 217 91% 45%;
  ...

  /* Layout Dimensions */
  --sidebar-width: 260px;
  ...

  /* Status Colors */
  --status-en-cours: 217 91% 60%;
  ...
}

.dark {
  /* Dark Theme Colors */
  --background: 220 13% 18%;
  --primary: 217 91% 60%;
  ...
}
```

## Intégration CI/CD

Ajoutez le script dans votre pipeline:

```yaml
- name: Generate CSS
  run: pnpm --filter @erp/ui generate:css
```
