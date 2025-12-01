# Status Tokens - TopSteel Design System

## Vue d'ensemble

Système complet de gestion des 13 statuts métier TopSteel avec 3 niveaux d'intégration :
- **Tokens TypeScript** pour la logique métier
- **Variables CSS** pour le styling personnalisé
- **Classes Tailwind** pour l'utilisation rapide

## Structure des fichiers

```
packages/ui/src/
├── tokens/
│   ├── status.ts                  # Définitions TypeScript des 13 statuts
│   ├── status-css.ts              # Générateur de variables CSS
│   ├── status-demo.tsx            # Composant de démonstration des tokens
│   ├── STATUS-USAGE.md            # Guide d'utilisation complet
│   ├── STATUS-INTEGRATION.md      # Documentation d'intégration
│   └── STATUS-README.md           # Ce fichier
│
└── components/status/
    ├── StatusBadge.tsx            # Composant Badge réutilisable
    ├── StatusBadge.stories.tsx   # Exemples et démos
    └── index.ts                   # Exports

apps/web/src/styles/
└── globals.css                    # Variables CSS intégrées
```

## Les 13 statuts

### 🔵 Projets (4 statuts)
| Statut | Couleur | HSL | Usage |
|--------|---------|-----|-------|
| EN_COURS | Bleu | `217 91% 60%` | Projet actif en développement |
| TERMINE | Vert | `142 76% 36%` | Projet complété et livré |
| ANNULE | Rouge | `0 84% 60%` | Projet annulé ou abandonné |
| BROUILLON | Gris | `220 9% 46%` | Projet en phase de conception |

### 📝 Devis (3 statuts)
| Statut | Couleur | HSL | Usage |
|--------|---------|-----|-------|
| EN_ATTENTE | Jaune | `45 93% 47%` | Devis envoyé, en attente de réponse |
| ACCEPTE | Vert | `142 76% 36%` | Devis accepté par le client |
| REFUSE | Rouge | `0 84% 60%` | Devis refusé par le client |

### ⚙️ Production (3 statuts)
| Statut | Couleur | HSL | Usage |
|--------|---------|-----|-------|
| PLANIFIE | Indigo | `231 48% 48%` | Production planifiée mais non démarrée |
| EN_PRODUCTION | Orange | `25 95% 53%` | En cours de fabrication |
| CONTROLE_QUALITE | Violet | `271 91% 65%` | En contrôle qualité avant livraison |

### 📦 Stock (3 statuts)
| Statut | Couleur | HSL | Usage |
|--------|---------|-----|-------|
| EN_STOCK | Emerald | `160 84% 39%` | Quantité suffisante en stock |
| RUPTURE | Rouge | `0 84% 60%` | Stock épuisé, rupture |
| STOCK_FAIBLE | Amber | `38 92% 50%` | Stock faible, réapprovisionnement nécessaire |

## Démarrage rapide

### 1. Utilisation avec classes Tailwind (recommandé)

```tsx
import React from 'react';

export function MyComponent() {
  return (
    <div>
      {/* Badge simple */}
      <span className="bg-status-en-cours text-white px-3 py-1 rounded-full">
        En cours
      </span>

      {/* Background subtil */}
      <div className="bg-status-termine/10 border border-status-termine/30 p-4">
        Projet terminé
      </div>

      {/* Texte coloré */}
      <p className="text-status-en-production">
        Production en cours
      </p>
    </div>
  );
}
```

### 2. Utilisation avec composants réutilisables

```tsx
import { StatusBadge, StatusIndicator } from '@topsteel/ui/components/status';

export function ProjectCard() {
  return (
    <div className="p-4 border rounded">
      <div className="flex items-center gap-2">
        <StatusIndicator status="EN_COURS" animated />
        <h3>Projet Alpha</h3>
      </div>

      <StatusBadge
        status="EN_COURS"
        variant="subtle"
        size="sm"
      />
    </div>
  );
}
```

### 3. Utilisation avec tokens TypeScript

```tsx
import { statusByKey, type StatusKey } from '@topsteel/ui/tokens/status';

export function ProjectStatus({ status }: { status: StatusKey }) {
  const config = statusByKey[status];

  return (
    <div
      className={`${config.bg} ${config.text} p-4 rounded`}
      style={{
        backgroundColor: `hsl(${config.hsl} / 0.1)`
      }}
    >
      {status}
    </div>
  );
}
```

## Composants disponibles

### StatusBadge

Badge principal pour afficher les statuts.

```tsx
<StatusBadge
  status="EN_COURS"          // Requis: clé du statut
  variant="solid"            // 'solid' | 'outline' | 'subtle'
  size="md"                  // 'sm' | 'md' | 'lg'
  label="Personnalisé"       // Optionnel: texte custom
  className="extra-classes"  // Optionnel: classes CSS additionnelles
/>
```

**Variantes:**
- `solid`: Fond coloré avec texte blanc (défaut)
- `outline`: Bordure colorée, fond transparent
- `subtle`: Fond coloré léger avec texte coloré

### StatusBadgeWithDot

Badge avec indicateur animé.

```tsx
<StatusBadgeWithDot
  status="EN_PRODUCTION"
  animated={true}            // Active l'animation pulse
  variant="subtle"
  size="sm"
/>
```

### StatusIndicator

Point coloré simple pour les indicateurs.

```tsx
<StatusIndicator
  status="EN_STOCK"
  size="md"                  // 'sm' | 'md' | 'lg'
  animated={false}           // Active l'animation pulse
/>
```

## Classes CSS disponibles

### Backgrounds
```css
bg-status-en-cours
bg-status-termine
bg-status-planifie
bg-status-en-production
/* ... tous les 13 statuts */

/* Avec opacité */
bg-status-en-cours/10
bg-status-termine/20
```

### Texte
```css
text-status-en-cours
text-status-stock-faible
/* ... */
```

### Bordures
```css
border-status-en-attente
border-status-rupture
/* ... */
```

## Variables CSS

### Dans :root
```css
/* Couleurs principales */
--status-en-cours: 217 91% 60%;
--status-termine: 142 76% 36%;
/* ... (13 variables) */

/* Foreground (texte sur fond coloré) */
--status-en-cours-foreground: 0 0% 100%;
--status-en-attente-foreground: 0 0% 0%;
/* ... (13 variables) */
```

### Utilisation en CSS
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

## Exemples d'utilisation

### Tableau avec statuts

```tsx
function ProjectTable() {
  return (
    <table>
      <tbody>
        <tr>
          <td>Projet Alpha</td>
          <td>
            <StatusBadge status="EN_COURS" size="sm" />
          </td>
        </tr>
        <tr>
          <td>Projet Beta</td>
          <td>
            <StatusBadge status="TERMINE" size="sm" />
          </td>
        </tr>
      </tbody>
    </table>
  );
}
```

### Carte avec indicateur

```tsx
function MachineCard({ machine }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{machine.name}</h3>
        <StatusIndicator status="EN_PRODUCTION" animated />
      </div>

      <StatusBadgeWithDot
        status="EN_PRODUCTION"
        variant="subtle"
        size="sm"
      />
    </div>
  );
}
```

### Timeline

```tsx
function Timeline() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <StatusIndicator status="TERMINE" size="md" />
        <div>
          <p className="font-medium">Projet approuvé</p>
          <StatusBadge status="TERMINE" variant="subtle" size="sm" />
        </div>
      </div>

      <div className="flex items-start gap-3">
        <StatusIndicator status="EN_PRODUCTION" size="md" animated />
        <div>
          <p className="font-medium">Production en cours</p>
          <StatusBadge status="EN_PRODUCTION" variant="subtle" size="sm" />
        </div>
      </div>
    </div>
  );
}
```

## Tests et démos

### Visualiser les composants
```tsx
import { StatusBadgeDemo } from '@topsteel/ui/components/status/StatusBadge.stories';

// Dans votre page de test
export default function TestPage() {
  return <StatusBadgeDemo />;
}
```

### Visualiser les tokens
```tsx
import { StatusTokensDemo } from '@topsteel/ui/tokens/status-demo';

export default function TokensTestPage() {
  return <StatusTokensDemo />;
}
```

## Migration

### Depuis les couleurs Tailwind classiques

**Avant:**
```tsx
<span className="bg-blue-500 text-white">En cours</span>
```

**Après:**
```tsx
<StatusBadge status="EN_COURS" />
// ou
<span className="bg-status-en-cours text-white">En cours</span>
```

### Depuis des couleurs en dur

**Avant:**
```tsx
<div style={{ backgroundColor: '#3b82f6' }}>En cours</div>
```

**Après:**
```tsx
<div className="bg-status-en-cours">En cours</div>
```

## Bonnes pratiques

1. **Privilégier les composants** pour la cohérence
   ```tsx
   ✅ <StatusBadge status="EN_COURS" />
   ❌ <span className="bg-blue-500">En cours</span>
   ```

2. **Utiliser les variantes appropriées**
   ```tsx
   ✅ <StatusBadge status="EN_COURS" variant="subtle" /> // Pour backgrounds clairs
   ✅ <StatusBadge status="TERMINE" variant="solid" />   // Pour attirer l'attention
   ```

3. **Toujours utiliser les tokens TypeScript pour la logique**
   ```tsx
   ✅ const status = statusByKey[data.status];
   ❌ const color = data.status === 'EN_COURS' ? 'blue' : 'green';
   ```

4. **Respecter l'accessibilité**
   ```tsx
   ✅ <StatusBadge status="EN_ATTENTE" /> // Utilise automatiquement le bon foreground
   ❌ <span className="bg-status-en-attente text-white" /> // Mauvais contraste sur jaune
   ```

## Documentation complète

- **[STATUS-USAGE.md](./STATUS-USAGE.md)** - Guide d'utilisation détaillé
- **[STATUS-INTEGRATION.md](./STATUS-INTEGRATION.md)** - Documentation technique d'intégration
- **[status-demo.tsx](./status-demo.tsx)** - Démo des tokens
- **[StatusBadge.stories.tsx](../components/status/StatusBadge.stories.tsx)** - Démo des composants

## Support

Pour toute question :
1. Consultez les fichiers de documentation ci-dessus
2. Regardez les composants de démo
3. Testez avec les pages de test

---

**Statut de l'intégration: ✅ Production ready**

Tous les statuts sont disponibles via classes Tailwind, variables CSS et tokens TypeScript.
