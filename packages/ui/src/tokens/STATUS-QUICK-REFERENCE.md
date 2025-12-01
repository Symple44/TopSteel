# Status Tokens - Quick Reference Card

## 🚀 Import rapide

```tsx
// Composants (recommandé)
import { StatusBadge, StatusIndicator } from '@topsteel/ui/components/status';

// Tokens TypeScript
import { statusByKey, type StatusKey } from '@topsteel/ui/tokens/status';
```

## 📋 Les 13 statuts

```typescript
// Projets
'EN_COURS'           // 🔵 Bleu
'TERMINE'            // 🟢 Vert
'ANNULE'             // 🔴 Rouge
'BROUILLON'          // ⚪ Gris

// Devis
'EN_ATTENTE'         // 🟡 Jaune
'ACCEPTE'            // 🟢 Vert
'REFUSE'             // 🔴 Rouge

// Production
'PLANIFIE'           // 🟣 Indigo
'EN_PRODUCTION'      // 🟠 Orange
'CONTROLE_QUALITE'   // 🟣 Violet

// Stock
'EN_STOCK'           // 🟢 Emerald
'RUPTURE'            // 🔴 Rouge
'STOCK_FAIBLE'       // 🟡 Amber
```

## 🎨 Utilisation rapide

### Option 1: Composant (le plus simple)
```tsx
<StatusBadge status="EN_COURS" />
<StatusBadge status="TERMINE" variant="subtle" size="sm" />
<StatusIndicator status="EN_PRODUCTION" animated />
```

### Option 2: Classes Tailwind
```tsx
<span className="bg-status-en-cours text-white px-3 py-1 rounded-full">
  En cours
</span>

<div className="bg-status-termine/10 border border-status-termine/30 p-4">
  Projet terminé
</div>
```

### Option 3: Variables CSS
```css
.custom {
  background-color: hsl(var(--status-en-cours));
  color: hsl(var(--status-en-cours-foreground));
}
```

## 🔧 Variantes de StatusBadge

```tsx
// Solid (défaut) - fond plein
<StatusBadge status="EN_COURS" variant="solid" />

// Outline - bordure uniquement
<StatusBadge status="TERMINE" variant="outline" />

// Subtle - fond léger
<StatusBadge status="EN_ATTENTE" variant="subtle" />
```

## 📏 Tailles

```tsx
<StatusBadge status="EN_COURS" size="sm" />  // Petit
<StatusBadge status="EN_COURS" size="md" />  // Moyen (défaut)
<StatusBadge status="EN_COURS" size="lg" />  // Large
```

## 💡 Exemples courants

### Badge dans un tableau
```tsx
<td>
  <StatusBadge status="EN_COURS" size="sm" />
</td>
```

### Carte avec indicateur
```tsx
<div className="p-4 border rounded">
  <div className="flex items-center gap-2">
    <StatusIndicator status="EN_PRODUCTION" animated />
    <h3>Machine A</h3>
  </div>
  <StatusBadgeWithDot status="EN_PRODUCTION" variant="subtle" />
</div>
```

### Background coloré subtil
```tsx
<div className="bg-status-en-cours/10 border border-status-en-cours/30 p-4 rounded">
  <h3 className="text-status-en-cours">En cours</h3>
  <p className="text-muted-foreground">Description...</p>
</div>
```

### Label personnalisé
```tsx
<StatusBadge
  status="EN_ATTENTE"
  label="Devis envoyé"
  variant="subtle"
/>
```

## 🎯 Pattern matching

```typescript
const getStatusBadge = (status: StatusKey) => {
  return <StatusBadge status={status} variant="subtle" size="sm" />;
};

// Usage
{projects.map(project => (
  <div key={project.id}>
    {getStatusBadge(project.status)}
  </div>
))}
```

## 🌈 Classes CSS disponibles

| Type | Pattern | Exemple |
|------|---------|---------|
| Background | `bg-status-[nom]` | `bg-status-en-cours` |
| Text | `text-status-[nom]` | `text-status-termine` |
| Border | `border-status-[nom]` | `border-status-planifie` |
| Opacity | `bg-status-[nom]/[%]` | `bg-status-en-cours/10` |

## 📝 Conversion nom → CSS

```
EN_COURS          → status-en-cours
CONTROLE_QUALITE  → status-controle-qualite
STOCK_FAIBLE      → status-stock-faible
```

**Règle:** Minuscules + underscores → tirets

## 🔑 Variables CSS complètes

```css
/* Couleurs principales (13) */
--status-en-cours: 217 91% 60%;
--status-termine: 142 76% 36%;
--status-annule: 0 84% 60%;
--status-brouillon: 220 9% 46%;
--status-en-attente: 45 93% 47%;
--status-accepte: 142 76% 36%;
--status-refuse: 0 84% 60%;
--status-planifie: 231 48% 48%;
--status-en-production: 25 95% 53%;
--status-controle-qualite: 271 91% 65%;
--status-en-stock: 160 84% 39%;
--status-rupture: 0 84% 60%;
--status-stock-faible: 38 92% 50%;

/* Foreground (texte sur fond coloré) (13) */
--status-[nom]-foreground: ...;
```

## 🛠 TypeScript Types

```typescript
import type { StatusKey } from '@topsteel/ui/tokens/status';

// Type pour les props
interface ProjectProps {
  status: StatusKey;
}

// Type guard
const isValidStatus = (status: string): status is StatusKey => {
  return status in statusByKey;
};
```

## ⚡ Raccourcis VSCode

Créez des snippets pour aller plus vite :

```json
{
  "Status Badge": {
    "prefix": "stbadge",
    "body": [
      "<StatusBadge status=\"$1\" variant=\"$2\" size=\"$3\" />"
    ]
  },
  "Status Indicator": {
    "prefix": "stind",
    "body": [
      "<StatusIndicator status=\"$1\" animated={$2} />"
    ]
  }
}
```

## 📚 Documentation complète

- **README:** [STATUS-README.md](./STATUS-README.md)
- **Usage:** [STATUS-USAGE.md](./STATUS-USAGE.md)
- **Integration:** [STATUS-INTEGRATION.md](./STATUS-INTEGRATION.md)
- **Demos:** [status-demo.tsx](./status-demo.tsx), [StatusBadge.stories.tsx](../components/status/StatusBadge.stories.tsx)

## ✅ Checklist

- [ ] Importer le composant `StatusBadge`
- [ ] Utiliser le type `StatusKey` pour les props
- [ ] Choisir la bonne variante (solid/outline/subtle)
- [ ] Ajuster la taille si nécessaire
- [ ] Ajouter `animated` si besoin d'animation
- [ ] Tester en mode clair et sombre

---

**💡 Astuce:** Toujours utiliser les composants plutôt que les classes en dur pour bénéficier des mises à jour automatiques !
