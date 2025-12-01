# Status Tokens - Documentation Index

Bienvenue dans la documentation complète du système de Status Tokens TopSteel.

## 🚀 Démarrage rapide

**Nouveau sur le projet ?** Commencez ici :

1. **[Quick Reference](./STATUS-QUICK-REFERENCE.md)** - Carte de référence rapide
2. **[README](./STATUS-README.md)** - Vue d'ensemble complète

**Pour développer :** Utilisez directement le composant
```tsx
import { StatusBadge } from '@topsteel/ui/components/status';

<StatusBadge status="EN_COURS" />
```

## 📚 Documentation complète

### Pour les développeurs

| Document | Description | Quand l'utiliser |
|----------|-------------|------------------|
| **[Quick Reference](./STATUS-QUICK-REFERENCE.md)** | Carte de référence d'une page | Recherche rapide de syntaxe |
| **[README](./STATUS-README.md)** | Documentation principale | Vue d'ensemble et exemples |
| **[Usage Guide](./STATUS-USAGE.md)** | Guide d'utilisation détaillé | Apprendre les différentes façons d'utiliser |
| **[Checklist](./STATUS-CHECKLIST.md)** | Liste de vérification | Valider l'intégration |

### Pour les architectes/leads

| Document | Description | Quand l'utiliser |
|----------|-------------|------------------|
| **[Integration](./STATUS-INTEGRATION.md)** | Documentation technique d'intégration | Comprendre l'implémentation |
| **[Changelog](../../CHANGELOG-STATUS-TOKENS.md)** | Historique des changements | Voir ce qui a été ajouté |

## 🎨 Démos et exemples

| Fichier | Type | Description |
|---------|------|-------------|
| **[status-demo.tsx](./status-demo.tsx)** | Component | Démo interactive des tokens |
| **[StatusBadge.stories.tsx](../components/status/StatusBadge.stories.tsx)** | Component | Démo complète des composants |

## 📦 Fichiers du système

### Tokens TypeScript
- **[status.ts](./status.ts)** - Définitions des 13 statuts métier
- **[status-css.ts](./status-css.ts)** - Générateur de variables CSS

### Composants React
- **[StatusBadge.tsx](../components/status/StatusBadge.tsx)** - Badge principal
- **[index.ts](../components/status/index.ts)** - Exports

### CSS Global
- **[globals.css](../../../../apps/web/src/styles/globals.css)** - Variables CSS intégrées

## 🎯 Par cas d'usage

### Je veux afficher un badge de statut
→ **[Quick Reference](./STATUS-QUICK-REFERENCE.md)** section "Utilisation rapide"

```tsx
import { StatusBadge } from '@topsteel/ui/components/status';

<StatusBadge status="EN_COURS" />
```

### Je veux utiliser les couleurs en CSS
→ **[Usage Guide](./STATUS-USAGE.md)** section "Variables CSS"

```css
.custom {
  background-color: hsl(var(--status-en-cours));
}
```

### Je veux utiliser les classes Tailwind
→ **[README](./STATUS-README.md)** section "Démarrage rapide"

```tsx
<div className="bg-status-en-cours text-white">
  En cours
</div>
```

### Je veux créer un composant custom
→ **[Usage Guide](./STATUS-USAGE.md)** section "Tokens TypeScript"

```tsx
import { statusByKey } from '@topsteel/ui/tokens/status';

const config = statusByKey['EN_COURS'];
```

### Je veux migrer du code existant
→ **[README](./STATUS-README.md)** section "Migration"

### Je veux vérifier l'intégration
→ **[Checklist](./STATUS-CHECKLIST.md)**

## 🔍 Recherche rapide

### Par statut

#### Projets
- `EN_COURS` - Bleu (217 91% 60%)
- `TERMINE` - Vert (142 76% 36%)
- `ANNULE` - Rouge (0 84% 60%)
- `BROUILLON` - Gris (220 9% 46%)

#### Devis
- `EN_ATTENTE` - Jaune (45 93% 47%)
- `ACCEPTE` - Vert (142 76% 36%)
- `REFUSE` - Rouge (0 84% 60%)

#### Production
- `PLANIFIE` - Indigo (231 48% 48%)
- `EN_PRODUCTION` - Orange (25 95% 53%)
- `CONTROLE_QUALITE` - Violet (271 91% 65%)

#### Stock
- `EN_STOCK` - Emerald (160 84% 39%)
- `RUPTURE` - Rouge (0 84% 60%)
- `STOCK_FAIBLE` - Amber (38 92% 50%)

### Par technologie

#### React/TypeScript
```tsx
import { StatusBadge, StatusIndicator } from '@topsteel/ui/components/status';
import { statusByKey, type StatusKey } from '@topsteel/ui/tokens/status';
```

#### Tailwind CSS
```tsx
className="bg-status-en-cours"
className="text-status-termine"
className="border-status-planifie"
```

#### CSS pur
```css
--status-en-cours: 217 91% 60%;
--status-en-cours-foreground: 0 0% 100%;
```

## 🎓 Parcours d'apprentissage

### Niveau 1 : Utilisation basique (5 min)
1. Lire **[Quick Reference](./STATUS-QUICK-REFERENCE.md)**
2. Copier un exemple de `StatusBadge`
3. Tester dans votre composant

### Niveau 2 : Utilisation intermédiaire (15 min)
1. Lire **[README](./STATUS-README.md)**
2. Comprendre les 3 variantes (solid/outline/subtle)
3. Tester avec différentes tailles
4. Essayer les classes Tailwind

### Niveau 3 : Utilisation avancée (30 min)
1. Lire **[Usage Guide](./STATUS-USAGE.md)**
2. Comprendre les tokens TypeScript
3. Utiliser les variables CSS
4. Créer un composant custom

### Niveau 4 : Expert (1h)
1. Lire **[Integration](./STATUS-INTEGRATION.md)**
2. Comprendre l'architecture complète
3. Contribuer des améliorations
4. Aider les autres développeurs

## 🛠 Outils et ressources

### Démos interactives
- `http://localhost:3000/test-status` - Page de test (à créer)
- Composant `StatusTokensDemo` - Visualisation des tokens
- Composant `StatusBadgeDemo` - Visualisation des composants

### Snippets VSCode
Voir **[Quick Reference](./STATUS-QUICK-REFERENCE.md)** section "Raccourcis VSCode"

### Tests
Voir **[Checklist](./STATUS-CHECKLIST.md)** section "Tests à effectuer"

## 🤝 Contribution

Pour proposer des améliorations :
1. Consulter **[Integration](./STATUS-INTEGRATION.md)**
2. Lire le code dans `status.ts` et `StatusBadge.tsx`
3. Proposer une PR avec tests

## 📞 Support

### Documentation
- Tous les fichiers MD dans ce dossier
- Commentaires dans les fichiers `.ts` et `.tsx`

### Exemples de code
- `status-demo.tsx` - Exemples de tokens
- `StatusBadge.stories.tsx` - Exemples de composants

### Questions fréquentes

**Q: Quelle méthode utiliser ?**
R: StatusBadge pour 90% des cas, classes Tailwind pour des cas simples, variables CSS pour du styling custom.

**Q: Comment changer une couleur ?**
R: Modifier `status.ts` et `globals.css`, rebuild.

**Q: Dark mode supporté ?**
R: Oui, les variables CSS s'adaptent automatiquement.

**Q: Comment migrer le code existant ?**
R: Voir section Migration dans **[README](./STATUS-README.md)**.

## 📊 Statistiques

- **13 statuts** métier
- **26 variables CSS** (13 colors + 13 foregrounds)
- **13 couleurs** Tailwind
- **4 composants** React
- **8 fichiers** de documentation
- **3 niveaux** d'intégration

---

## 🗺 Navigation rapide

### Documentation
- [Quick Reference](./STATUS-QUICK-REFERENCE.md) ⚡
- [README](./STATUS-README.md) 📖
- [Usage Guide](./STATUS-USAGE.md) 🎯
- [Integration](./STATUS-INTEGRATION.md) 🔧
- [Checklist](./STATUS-CHECKLIST.md) ✅
- [Changelog](../../CHANGELOG-STATUS-TOKENS.md) 📝

### Code
- [Tokens](./status.ts) 🎨
- [Components](../components/status/) 🧩
- [Demos](./status-demo.tsx) 🎬
- [CSS](../../../../apps/web/src/styles/globals.css) 🎨

---

**Dernière mise à jour:** 2025-11-30
**Version:** 1.0.0
**Statut:** Production Ready ✅
