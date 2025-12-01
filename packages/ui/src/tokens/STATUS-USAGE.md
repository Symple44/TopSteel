# Status Tokens - Guide d'utilisation

## Vue d'ensemble

Le système de tokens de statuts TopSteel fournit 13 statuts métier standardisés avec leurs couleurs associées, utilisables de 3 façons différentes :

1. **Classes Tailwind CSS** (recommandé)
2. **Variables CSS**
3. **Tokens TypeScript**

## Les 13 statuts métier

### Projets (4 statuts)
- `EN_COURS` - Bleu (217 91% 60%)
- `TERMINE` - Vert (142 76% 36%)
- `ANNULE` - Rouge (0 84% 60%)
- `BROUILLON` - Gris (220 9% 46%)

### Devis (3 statuts)
- `EN_ATTENTE` - Jaune (45 93% 47%)
- `ACCEPTE` - Vert (142 76% 36%)
- `REFUSE` - Rouge (0 84% 60%)

### Production (3 statuts)
- `PLANIFIE` - Indigo (231 48% 48%)
- `EN_PRODUCTION` - Orange (25 95% 53%)
- `CONTROLE_QUALITE` - Violet (271 91% 65%)

### Stock (3 statuts)
- `EN_STOCK` - Emerald (160 84% 39%)
- `RUPTURE` - Rouge (0 84% 60%)
- `STOCK_FAIBLE` - Amber (38 92% 50%)

## Utilisation

### 1. Classes Tailwind (Recommandé)

Les classes Tailwind sont générées automatiquement via la configuration dans `@theme` :

```tsx
// Background
<div className="bg-status-en-cours">En cours</div>
<div className="bg-status-termine">Terminé</div>
<div className="bg-status-planifie">Planifié</div>

// Text color
<span className="text-status-en-production">En production</span>
<span className="text-status-stock-faible">Stock faible</span>

// Border
<div className="border-status-en-attente">En attente</div>
```

### 2. Variables CSS

Les variables CSS sont disponibles dans `:root` et utilisent le format HSL :

```css
/* Variables principales */
--status-en-cours: 217 91% 60%;
--status-termine: 142 76% 36%;
--status-en-production: 25 95% 53%;

/* Variables foreground (texte sur fond coloré) */
--status-en-cours-foreground: 0 0% 100%;
--status-en-attente-foreground: 0 0% 0%;
```

Utilisation dans du CSS :

```css
.custom-badge {
  background-color: hsl(var(--status-en-cours));
  color: hsl(var(--status-en-cours-foreground));
}

/* Avec opacité */
.custom-alert {
  background-color: hsl(var(--status-en-attente) / 0.1);
  border: 1px solid hsl(var(--status-en-attente) / 0.3);
}
```

### 3. Tokens TypeScript

Pour la logique métier et les composants dynamiques :

```typescript
import { statusByKey, projectStatus, type StatusKey } from '@topsteel/ui/tokens/status';

// Accès par clé
const status = statusByKey['EN_COURS'];
console.log(status.bg);        // 'bg-blue-500'
console.log(status.text);      // 'text-blue-700'
console.log(status.hsl);       // '217 91% 60%'

// Accès par catégorie
const projectStatuses = projectStatus;
const enCours = projectStatuses.EN_COURS;

// Type-safe
const statusKey: StatusKey = 'EN_PRODUCTION';
const currentStatus = statusByKey[statusKey];
```

## Exemples de composants

### Badge de statut

```tsx
import { statusByKey, type StatusKey } from '@topsteel/ui/tokens/status';

interface StatusBadgeProps {
  status: StatusKey;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = statusByKey[status];

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${statusConfig.bg} ${statusConfig.text}
      `}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

// Utilisation
<StatusBadge status="EN_COURS" />
<StatusBadge status="TERMINE" />
```

### Carte de statut avec Tailwind

```tsx
export function StatusCard({ status }: { status: StatusKey }) {
  return (
    <div className="bg-status-en-cours/10 border border-status-en-cours/30 rounded-lg p-4">
      <h3 className="text-status-en-cours font-semibold">Projet en cours</h3>
      <p className="text-muted-foreground">Description du projet...</p>
    </div>
  );
}
```

### Indicateur de statut animé

```tsx
export function StatusIndicator({ status }: { status: StatusKey }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          w-2 h-2 rounded-full
          bg-status-${status.toLowerCase().replace('_', '-')}
          animate-pulse
        `}
      />
      <span className={`text-status-${status.toLowerCase().replace('_', '-')}`}>
        {status}
      </span>
    </div>
  );
}
```

## Classes CSS disponibles

Pour chaque statut, les classes suivantes sont disponibles :

- `bg-status-[nom]` - Fond
- `text-status-[nom]` - Texte
- `border-status-[nom]` - Bordure
- `bg-status-[nom]/[opacity]` - Fond avec opacité (ex: `bg-status-en-cours/10`)

## Noms des statuts en CSS

Les underscores sont remplacés par des tirets dans les classes CSS :

| TypeScript | CSS |
|------------|-----|
| EN_COURS | status-en-cours |
| CONTROLE_QUALITE | status-controle-qualite |
| STOCK_FAIBLE | status-stock-faible |

## Bonnes pratiques

1. **Privilégier les classes Tailwind** pour une meilleure maintenabilité
2. **Utiliser les tokens TypeScript** pour la logique métier
3. **Éviter les couleurs en dur** - toujours utiliser les tokens
4. **Ajouter des opacités** pour les backgrounds subtils (`bg-status-en-cours/10`)
5. **Respecter les foreground colors** pour l'accessibilité

## Accessibilité

Les couleurs foreground sont définies pour garantir un contraste suffisant :

- Backgrounds clairs (jaune, amber) → Texte noir (`0 0% 0%`)
- Backgrounds foncés → Texte blanc (`0 0% 100%`)

Exemple :
```tsx
<div className="bg-status-en-attente text-status-en-attente-foreground">
  Texte lisible sur fond jaune
</div>
```

## Fichiers impliqués

1. **`packages/ui/src/tokens/status.ts`** - Définitions TypeScript
2. **`apps/web/src/styles/globals.css`** - Variables CSS et configuration Tailwind
3. **`packages/ui/src/tokens/status-css.ts`** - Générateur de variables CSS (si besoin)

## Migration depuis les anciennes couleurs

Avant :
```tsx
<Badge className="bg-blue-500">En cours</Badge>
```

Après :
```tsx
<Badge className="bg-status-en-cours">En cours</Badge>
```

Avantages :
- Sémantique métier claire
- Changement global possible
- Type-safety avec TypeScript
- Cohérence dans toute l'application
