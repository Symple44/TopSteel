# Status Tokens - Intégration complète

## Résumé de l'intégration

Les 13 statuts métier TopSteel ont été intégrés avec succès dans le système de design. Ils sont maintenant disponibles de 3 façons différentes.

## Fichiers modifiés/créés

### 1. Définitions TypeScript
**Fichier:** `packages/ui/src/tokens/status.ts`
- ✅ 13 statuts définis avec leurs couleurs HSL
- ✅ Tokens TypeScript exportés (projectStatus, quoteStatus, etc.)
- ✅ Type-safety avec StatusKey

### 2. Variables CSS globales
**Fichier:** `apps/web/src/styles/globals.css`

#### Dans `:root` (lignes ~210-245)
```css
/* 13 variables de couleurs HSL */
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

/* 13 variables foreground (texte sur fond coloré) */
--status-en-cours-foreground: 0 0% 100%;
/* ... (toutes les 13 foregrounds) */
```

#### Dans `@theme` (lignes ~82-95)
```css
/* 13 couleurs Tailwind */
--color-status-en-cours: hsl(var(--status-en-cours));
--color-status-termine: hsl(var(--status-termine));
--color-status-annule: hsl(var(--status-annule));
/* ... (toutes les 13 couleurs) */
```

### 3. Documentation et démos
- ✅ `STATUS-USAGE.md` - Guide complet d'utilisation
- ✅ `status-demo.tsx` - Composant de démonstration
- ✅ `STATUS-INTEGRATION.md` - Ce fichier

## Vérification de l'intégration

### Comptage des variables
```bash
# Variables HSL + foreground dans :root
grep -E "^\s+--status-" apps/web/src/styles/globals.css | wc -l
# Résultat attendu: 26 (13 colors + 13 foregrounds)

# Variables Tailwind dans @theme
grep -E "^\s+--color-status-" apps/web/src/styles/globals.css | wc -l
# Résultat attendu: 13
```

## Utilisation immédiate

### Classes Tailwind disponibles

Pour chaque statut, vous pouvez maintenant utiliser :

```tsx
// Backgrounds
className="bg-status-en-cours"
className="bg-status-termine"
className="bg-status-planifie"

// Textes
className="text-status-en-production"
className="text-status-stock-faible"

// Bordures
className="border-status-en-attente"

// Avec opacité
className="bg-status-en-cours/10"
className="border-status-termine/30"
```

### Variables CSS disponibles

```css
/* Dans votre CSS personnalisé */
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

### Tokens TypeScript

```typescript
import { statusByKey, type StatusKey } from '@topsteel/ui/tokens/status';

const status = statusByKey['EN_COURS'];
console.log(status.hsl); // "217 91% 60%"
console.log(status.bg);  // "bg-blue-500"
```

## Mapping des noms

| TypeScript (code) | CSS (classes) | Catégorie |
|-------------------|---------------|-----------|
| EN_COURS | status-en-cours | Projets |
| TERMINE | status-termine | Projets |
| ANNULE | status-annule | Projets |
| BROUILLON | status-brouillon | Projets |
| EN_ATTENTE | status-en-attente | Devis |
| ACCEPTE | status-accepte | Devis |
| REFUSE | status-refuse | Devis |
| PLANIFIE | status-planifie | Production |
| EN_PRODUCTION | status-en-production | Production |
| CONTROLE_QUALITE | status-controle-qualite | Production |
| EN_STOCK | status-en-stock | Stock |
| RUPTURE | status-rupture | Stock |
| STOCK_FAIBLE | status-stock-faible | Stock |

## Prochaines étapes

### 1. Tester dans un composant
Créez une page de test pour vérifier que les classes Tailwind fonctionnent :

```tsx
// apps/web/src/app/(dashboard)/test-status/page.tsx
import { StatusTokensDemo } from '@topsteel/ui/tokens/status-demo';

export default function TestStatusPage() {
  return <StatusTokensDemo />;
}
```

### 2. Remplacer les couleurs existantes
Recherchez dans le code les endroits où les statuts sont utilisés avec des couleurs en dur :

```bash
# Rechercher les anciennes utilisations
grep -r "bg-blue-500" apps/web/src --include="*.tsx"
grep -r "bg-green-500" apps/web/src --include="*.tsx"
```

### 3. Créer des composants réutilisables
Créez des composants standard pour les badges de statut :

```tsx
// packages/ui/src/components/status/StatusBadge.tsx
import { statusByKey, type StatusKey } from '../../tokens/status';

export function StatusBadge({ status }: { status: StatusKey }) {
  const cssName = status.toLowerCase().replace(/_/g, '-');

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      bg-status-${cssName} text-white
    `}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
```

## Tests recommandés

1. **Test visuel**
   - Accédez à la page de démo
   - Vérifiez que toutes les couleurs s'affichent correctement
   - Testez en mode clair et sombre

2. **Test de build**
   ```bash
   cd apps/web
   pnpm build
   ```
   Vérifiez qu'il n'y a pas d'erreurs Tailwind

3. **Test TypeScript**
   ```bash
   pnpm tsc --noEmit
   ```
   Vérifiez la compilation TypeScript

## Support

Pour toute question sur l'utilisation des status tokens :
1. Consultez `STATUS-USAGE.md` pour les exemples
2. Regardez `status-demo.tsx` pour les composants
3. Vérifiez `status.ts` pour les définitions TypeScript

## Changelog

**2025-11-30**
- ✅ Ajout des 13 statuts métier dans `status.ts`
- ✅ Intégration dans `globals.css` (variables :root)
- ✅ Ajout des couleurs Tailwind dans @theme
- ✅ Création de la documentation complète
- ✅ Création du composant de démonstration

---

**Status de l'intégration: ✅ COMPLET**

Tous les statuts sont maintenant disponibles via :
- ✅ Classes Tailwind (bg-status-*, text-status-*, border-status-*)
- ✅ Variables CSS (--status-*, --status-*-foreground)
- ✅ Tokens TypeScript (statusByKey, projectStatus, etc.)
