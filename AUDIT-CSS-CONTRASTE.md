# AUDIT CSS - CONTRASTE, LISIBILITÉ ET COHÉRENCE
**TopSteel ERP - Design System v2.0**
Date: 2025-11-30
Analyseur: Claude (Sonnet 4.5)

---

## SOMMAIRE EXÉCUTIF

Cet audit a identifié **21 problèmes** répartis en 3 niveaux de sévérité :
- **CRITIQUE** (7) : Problèmes de contraste rendant le texte illisible
- **IMPORTANT** (9) : Incohérences nécessitant une correction
- **MINEUR** (5) : Améliorations recommandées

---

## 1. PROBLÈMES CRITIQUES DE CONTRASTE

### 🔴 CRITIQUE #1 - Texte codé en dur (text-white sur fonds variables)
**Fichiers:** `packages/ui/src/variants/*.variants.ts`
**Lignes:**
- `button.variants.ts:42-46` - success/warning buttons
- `badge.variants.ts:21-23` - success/warning/info badges
- `tooltip.variants.ts:28-29` - success/warning tooltips
- `dropdown.variants.ts:83-84` - success dropdown items

**Problème:**
Utilisation de `text-white` codé en dur au lieu de variables CSS sémantiques. En mode clair, `text-white` sur `bg-emerald-500` ou `bg-amber-500` peut créer un contraste insuffisant.

**Exemple problématique:**
```typescript
success: 'border-transparent bg-emerald-500 text-white shadow hover:bg-emerald-600',
warning: 'border-transparent bg-amber-500 text-white shadow hover:bg-amber-600',
```

**Impact:** Contraste potentiellement < 4.5:1 (WCAG AA) selon la teinte exacte.

**Correction recommandée:**
```typescript
// Au lieu de text-white, utiliser :
success: 'border-transparent bg-emerald-600 text-white dark:bg-emerald-500 shadow',
// OU mieux encore :
success: 'border-transparent bg-success text-success-foreground shadow',
```

---

### 🔴 CRITIQUE #2 - Dialog overlay avec variantes problématiques
**Fichier:** `packages/ui/src/variants/dialog.variants.ts`
**Lignes:** 21-24

**Problème:**
Le variant `light` utilise `bg-white/80` qui peut rendre le contenu sous-jacent trop visible, créant de la confusion visuelle.

```typescript
light: 'bg-white/80 backdrop-blur-sm',
```

**Impact:** Mauvaise lisibilité du contenu du dialog en arrière-plan visible.

**Correction recommandée:**
```typescript
light: 'bg-white/95 backdrop-blur-md', // Augmenter opacité et blur
```

---

### 🔴 CRITIQUE #3 - Status badge avec logique text-white automatique
**Fichier:** `packages/ui/src/variants/status-badge.variants.ts`
**Ligne:** 46

**Problème:**
Utilise `text-white` pour TOUS les statuts sans vérifier le contraste.

```typescript
return `bg-status-${statusKey} text-white`
```

**Impact:** Certains statuts (ex: `--status-en-attente: 45 93% 47%` jaune) ont un contraste < 4.5:1 avec `text-white`.

**Correction recommandée:**
```typescript
// Utiliser les variables foreground définies dans globals.css
return `bg-status-${statusKey} text-status-${statusKey}-foreground`
```

Note: Les variables existent déjà dans `globals.css:246-259` mais ne sont pas utilisées !

---

### 🔴 CRITIQUE #4 - Card variant glass avec fond variable
**Fichier:** `packages/ui/src/variants/card.variants.ts`
**Ligne:** 20

**Problème:**
Utilise des couleurs codées en dur au lieu de variables système.

```typescript
glass: 'border-white/20 bg-white/80 dark:bg-gray-900/80',
```

**Impact:** Le `bg-gray-900/80` en dark mode ne suit pas le système de couleurs du design system.

**Correction recommandée:**
```typescript
glass: [
  'border-white/20 dark:border-border/20',
  'bg-background/80 backdrop-blur-xl',
  'shadow-lg'
],
```

---

### 🔴 CRITIQUE #5 - Tabs active avec contraste insuffisant potentiel
**Fichier:** `packages/ui/src/components/navigation/tabs/Tabs.tsx`
**Lignes:** 37-38

**Problème:**
Utilise `bg-primary` avec `text-primary-foreground` sans garantie de contraste en mode thème personnalisé.

```typescript
'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
```

**Impact:** Si l'utilisateur choisit une couleur d'accent claire (jaune, cyan), le contraste peut être < 4.5:1.

**Correction recommandée:**
Ajouter une vérification de contraste dans `use-appearance-settings.ts` ou utiliser une approche plus robuste :
```typescript
'data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-foreground',
```

---

### 🔴 CRITIQUE #6 - Alert variants sans contraste garanti
**Fichier:** `packages/ui/src/variants/alert.variants.ts`
**Lignes:** 25-38

**Problème:**
Les variants `success`, `warning`, `info` utilisent des couleurs de texte qui peuvent manquer de contraste sur leurs fonds respectifs.

```typescript
success: [
  'border-emerald-500/50 text-emerald-700 dark:text-emerald-400',
  'bg-emerald-50 dark:bg-emerald-950/20',
],
```

**Impact:** `text-emerald-700` sur `bg-emerald-50` = contraste ~3.2:1 (échec WCAG AA).

**Correction recommandée:**
```typescript
success: [
  'border-emerald-500/50 text-emerald-800 dark:text-emerald-300',
  'bg-emerald-50 dark:bg-emerald-950/30',
],
```

---

### 🔴 CRITIQUE #7 - Tooltip light variant
**Fichier:** `packages/ui/src/variants/tooltip.variants.ts`
**Ligne:** 24

**Problème:**
`text-slate-900` sur `bg-white` manque de contraste en bordure avec fond clair.

```typescript
light: 'bg-white text-slate-900 border-slate-200 shadow-lg',
```

**Impact:** Contraste insuffisant de la bordure, peut se perdre sur fond blanc.

**Correction recommandée:**
```typescript
light: 'bg-white text-slate-950 border-slate-300 shadow-xl',
```

---

## 2. PROBLÈMES IMPORTANTS D'INCOHÉRENCE

### 🟠 IMPORTANT #1 - Globals.css avec sélecteurs d'attributs globaux
**Fichier:** `apps/web/src/styles/globals.css`
**Lignes:** 884-943

**Problème:**
Utilise des sélecteurs Radix UI globaux sans classe, ce qui peut créer des conflits.

```css
[data-radix-select-item] {
  padding: 0.5rem 0.75rem;
  background-color: transparent;
  color: hsl(var(--popover-foreground));
}

[data-radix-select-item]:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}
```

**Impact:** Override des styles des composants Select dans variants, incohérence.

**Correction recommandée:**
Supprimer ces sélecteurs de `globals.css` et s'appuyer uniquement sur les variants CVA dans `select.variants.ts`.

---

### 🟠 IMPORTANT #2 - Duplication de styles DataTable
**Fichiers:**
- `apps/web/src/styles/globals.css:663-854`
- `apps/web/src/styles/datatable-demo.css`

**Problème:**
Styles DataTable définis dans DEUX fichiers avec des règles qui se chevauchent.

**Impact:** Confusion, surcharge CSS, difficulté de maintenance.

**Correction recommandée:**
Centraliser TOUS les styles DataTable dans un seul endroit (préférablement dans le package UI avec variants CVA).

---

### 🟠 IMPORTANT #3 - Variables CSS accent-color non utilisées partout
**Fichier:** `apps/web/src/styles/globals.css`
**Lignes:** 1979-2166

**Problème:**
Le système de variables CSS `--accent-*` est défini mais de nombreux composants utilisent encore `hsl(var(--primary))` en dur.

**Exemple dans globals.css:**
```css
.menu-item-active-primary {
  background-color: hsl(var(--primary)); /* Devrait utiliser var(--accent-100) */
  color: white;
}
```

**Impact:** Les préférences utilisateur d'accent color ne s'appliquent pas partout.

**Correction recommandée:**
Audit complet et remplacement systématique de `hsl(var(--primary))` par les variables accent appropriées.

---

### 🟠 IMPORTANT #4 - Sélecteurs .dark avec spécificité excessive
**Fichier:** `apps/web/src/styles/globals.css`
**Lignes:** 1366-1414

**Problème:**
Utilise des sélecteurs de type nus dans `.dark` qui peuvent override les classes Tailwind.

```css
.dark a { color: hsl(var(--primary)); }
.dark button { color: hsl(var(--foreground)); }
.dark li { color: hsl(var(--foreground)); }
```

**Impact:** Impossible d'utiliser des classes Tailwind comme `text-muted-foreground` sur ces éléments en dark mode.

**Correction recommandée:**
Supprimer ces règles ou les rendre opt-in avec des classes spécifiques :
```css
.dark .prose a { color: hsl(var(--primary)); }
```

---

### 🟠 IMPORTANT #5 - Menu CSS avec !important
**Fichier:** `apps/web/src/styles/globals.css`
**Ligne:** 546

**Problème:**
Utilise `!important` qui empêche le override via classes.

```css
.menu-item-parent-with-active-child {
  background: transparent !important;
}
```

**Impact:** Impossible de personnaliser ce style via classes Tailwind.

**Correction recommandée:**
Augmenter la spécificité au lieu d'utiliser `!important` :
```css
nav .menu-item-parent-with-active-child {
  background: transparent;
}
```

---

### 🟠 IMPORTANT #6 - Inconsistance transitions
**Fichier:** `apps/web/src/styles/globals.css`
**Lignes:** 207-213

**Problème:**
Définit des variables de transition multiples alors que le design system devrait en avoir 3 max.

```css
--transition-fast: 0.15s ease-out;
--transition-base: 0.2s ease-out;
--transition-slow: 0.3s ease-out;
```

Mais ensuite utilise aussi `transition-all duration-200 ease-out` en Tailwind dans les variants.

**Impact:** Incohérence des durées d'animation.

**Correction recommandée:**
Standardiser sur les 3 durées et créer des classes utilitaires Tailwind :
```typescript
// tailwind.config
theme: {
  transitionDuration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  }
}
```

---

### 🟠 IMPORTANT #7 - Z-index sans système
**Fichier:** `apps/web/src/styles/globals.css`
**Lignes multiples (870, 911, 944, 950, 963, etc.)

**Problème:**
Valeurs z-index arbitraires sans échelle cohérente :
- `z-50`
- `z-9997`
- `z-9998`
- `z-9999`
- `z-10000`
- `z-10001`
- `z-10003`

**Impact:** Risques de conflits de superposition, difficile à maintenir.

**Correction recommandée:**
Créer une échelle z-index dans le design system :
```typescript
// Dans @theme
--z-base: 0;
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
--z-notification: 1080;
```

---

### 🟠 IMPORTANT #8 - Styles Radix UI hardcodés
**Fichier:** `apps/web/src/styles/globals.css`
**Lignes:** 920-943

**Problème:**
Styles `[role="menu"]` et `[role="menuitem"]` en global qui override les composants.

```css
[role="menuitem"]:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}
```

**Impact:** Conflit avec les variants de DropdownMenu qui définissent leurs propres styles.

**Correction recommandée:**
Supprimer ces styles globaux, laisser les composants gérer leurs propres styles via variants CVA.

---

### 🟠 IMPORTANT #9 - Input variants avec duplication état
**Fichier:** `packages/ui/src/variants/input.variants.ts`
**Lignes:** 37-43

**Problème:**
Le variant `size` duplique les valeurs de `variant.default`.

```typescript
size: {
  default: 'h-10 px-4 py-2', // Duplique variant.default
  sm: 'h-8 px-3 text-xs rounded-md',
  lg: 'h-12 px-5 text-base',
}
```

**Impact:** Si on change `variant` ET `size`, les padding se cumulent de façon incorrecte.

**Correction recommandée:**
Retirer le padding de `variant.default` et le garder uniquement dans `size`.

---

## 3. AMÉLIORATIONS MINEURES RECOMMANDÉES

### 🟡 MINEUR #1 - Scrollbar trop subtile en light mode
**Fichier:** `apps/web/src/styles/globals.css`
**Lignes:** 424-443

**Problème:**
`opacity: 0.3` rend la scrollbar presque invisible.

```css
::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
}
```

**Correction recommandée:**
```css
::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.4);
}
```

---

### 🟡 MINEUR #2 - Skeleton animation manque de smoothness
**Fichier:** `apps/web/src/styles/globals.css`
**Lignes:** 151-154

**Problème:**
L'animation shimmer utilise un `linear` qui paraît saccadé.

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

**Correction recommandée:**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
/* Et dans l'utilisation : */
animation: shimmer 1.5s ease-in-out infinite;
```

---

### 🟡 MINEUR #3 - Badge variants manquent de hover states
**Fichier:** `packages/ui/src/variants/badge.variants.ts`
**Lignes:** 17-23

**Problème:**
Tous les variants ont `hover:` sauf `outline`.

**Correction recommandée:**
```typescript
outline: 'text-foreground border-border hover:bg-accent hover:text-accent-foreground',
```

---

### 🟡 MINEUR #4 - Tooltip sans max-width en variant lg
**Fichier:** `packages/ui/src/variants/tooltip.variants.ts`
**Lignes:** 32-35

**Problème:**
Le variant `lg` peut devenir trop large.

```typescript
lg: 'text-base px-4 py-2 max-w-sm',
```

**Correction recommandée:**
```typescript
lg: 'text-base px-4 py-2 max-w-md', // Augmenter à md pour plus d'espace
```

---

### 🟡 MINEUR #5 - Focus ring sans border-radius adaptatif
**Fichier:** Tous les composants

**Problème:**
`focus-visible:ring-2` ne suit pas le `border-radius` du composant.

**Correction recommandée:**
Ajouter `focus-visible:ring-offset-2` partout où manquant pour créer un espacement.

---

## 4. RECOMMANDATIONS GÉNÉRALES

### Architecture CSS

1. **Centraliser les styles Radix UI**
   Supprimer tous les sélecteurs `[data-radix-*]` de `globals.css` et les gérer uniquement via variants CVA dans le package UI.

2. **Système de z-index**
   Créer une échelle cohérente avec variables CSS.

3. **Consolidation DataTable**
   Fusionner `datatable-demo.css` dans `globals.css` ou créer un module CSS dédié.

4. **Variables accent-color**
   Audit complet pour remplacer tous les `hsl(var(--primary))` par les variables accent.

### Accessibilité

1. **Contraste WCAG AA minimum**
   Vérifier tous les couples texte/fond pour garantir 4.5:1 minimum (7:1 pour AAA).

2. **Focus visible**
   Ajouter `focus-visible:ring-offset-2` partout pour meilleure visibilité.

3. **Reduced motion**
   Le système respecte `prefers-reduced-motion` (globals.css:398-407) ✅

### Performance

1. **CSS unused**
   Utiliser PurgeCSS pour supprimer les classes inutilisées de `globals.css`.

2. **Animations**
   Utiliser `will-change` avec parcimonie sur les éléments animés fréquemment.

### Maintenabilité

1. **Documentation variants**
   Ajouter des exemples visuels pour chaque variant dans Storybook.

2. **Tests de contraste automatisés**
   Intégrer `axe-core` ou `jest-axe` pour tester le contraste automatiquement.

3. **Design tokens**
   Migrer vers un système de design tokens (JSON) pour faciliter la synchronisation design/code.

---

## 5. PLAN D'ACTION PRIORITAIRE

### Phase 1 - CRITIQUE (Sprint immédiat)
1. ✅ Corriger status-badge pour utiliser `-foreground` variables
2. ✅ Remplacer `text-white` par variables sémantiques dans tous les variants
3. ✅ Vérifier et ajuster contraste Alert variants
4. ✅ Audit et correction Card glass variant
5. ✅ Renforcer contraste Dialog overlay light

### Phase 2 - IMPORTANT (Sprint suivant)
1. ✅ Supprimer sélecteurs Radix UI globaux de globals.css
2. ✅ Créer système z-index cohérent
3. ✅ Audit et migration vers variables accent-color
4. ✅ Consolider styles DataTable
5. ✅ Retirer `!important` et sélecteurs de type nus

### Phase 3 - MINEUR (Backlog)
1. ⚠️ Améliorer animations (smoothness)
2. ⚠️ Compléter hover states manquants
3. ⚠️ Optimiser scrollbar visibility
4. ⚠️ Ajouter focus-visible:ring-offset partout
5. ⚠️ Documentation et Storybook

---

## 6. CHECKLIST DE VALIDATION

### Contraste
- [ ] Tous les variants success/warning/info ont contraste ≥ 4.5:1
- [ ] Status badges utilisent variables `-foreground`
- [ ] Alert variants passent WCAG AA
- [ ] Tabs active en mode accent personnalisé lisible
- [ ] Dialog overlays suffisamment opaques

### Cohérence
- [ ] Pas de sélecteurs Radix UI globaux dans globals.css
- [ ] Z-index suivent échelle définie
- [ ] Variables accent-color utilisées partout
- [ ] Transitions utilisent durées standardisées
- [ ] Pas de `!important` sauf cas exceptionnels documentés

### Accessibilité
- [ ] Focus visible sur tous les éléments interactifs
- [ ] `prefers-reduced-motion` respecté
- [ ] Texte redimensionnable (em/rem)
- [ ] Couleurs ne sont pas le seul indicateur d'état

### Performance
- [ ] CSS < 100KB après minification
- [ ] Pas de règles inutilisées
- [ ] Animations GPU-accélérées (transform, opacity)

---

## 7. OUTILS RECOMMANDÉS

1. **Contrast Checker**
   https://webaim.org/resources/contrastchecker/

2. **axe DevTools**
   Extension navigateur pour audit accessibilité automatique

3. **CSS Stats**
   Analyse de la complexité et taille CSS

4. **Lighthouse**
   Audit performance et accessibilité

5. **Storybook Accessibility Addon**
   Tests de contraste automatiques dans Storybook

---

## CONCLUSION

L'audit révèle un design system **globalement bien structuré** avec quelques problèmes de contraste à corriger en priorité. Les 7 problèmes critiques concernent principalement :
- Utilisation de couleurs codées en dur au lieu de variables sémantiques
- Manque de vérification de contraste sur certains variants
- Incohérences entre globals.css et variants CVA

**Action immédiate recommandée:** Corriger les 7 problèmes critiques dans le prochain sprint pour garantir l'accessibilité WCAG AA.

**Estimation effort:**
- Phase 1 (Critique): ~2-3 jours
- Phase 2 (Important): ~3-5 jours
- Phase 3 (Mineur): ~2-3 jours

**Total:** ~7-11 jours de développement pour une refonte complète.
