# 🔄 AUDIT DE MIGRATION - COMPOSANTS UI

## État initial (Baseline)
- ✅ packages/ui compile sans erreur
- ⚠️ apps/web a des erreurs TS existantes (non liées aux composants UI)

## Matrice des doublons identifiés

### 🟠 CRITIQUES (à fusionner en priorité)

| Composant | apps/web | packages/ui | Action |
|-----------|----------|-------------|---------|
| Button | `ui/button.tsx` | `primitives/button/Button.tsx` | ✅ Garder packages/ui (Radix + CVA) |
| Dialog | `ui/dialog.tsx` | `feedback/dialog/dialog.tsx` | ✅ Garder packages/ui (Radix complet) |  
| DropdownMenu | `ui/dropdown-menu.tsx` + `ui/dropdown-menu-fixed.tsx` | `navigation/dropdown-menu/dropdown-menu.tsx` | ⚠️ Fusionner (3 versions!) |
| Tooltip | `ui/tooltip-fixed.tsx` + `ui/tooltip-simple.tsx` + `ui/tooltip-portal.tsx` | `feedback/tooltip/tooltip.tsx` | ⚠️ Fusionner (4 versions!) |
| Input | `ui/input.tsx` | `primitives/input/input.tsx` | ✅ Garder packages/ui |
| Select | `ui/select.tsx` | `primitives/select/select.tsx` | ✅ Garder packages/ui |

### 🟡 PROVIDERS DE THÈME

| Provider | Localisation | Statut |
|----------|-------------|--------|
| ThemeProvider | `apps/web/src/components/providers/theme-provider.tsx` | 🔴 Custom complet (570 lignes) |
| ThemeProviderWrapper | `apps/web/src/components/providers/theme-provider-wrapper.tsx` | 🔴 next-themes wrapper |
| ThemeSwitcher | `packages/ui/src/components/theme/theme-switcher/ThemeSwitcher.tsx` | 🟡 Package UI |

### 🔵 COMPATIBILITÉ THÈMES

| Thème | CSS Variables | Localisation |
|-------|---------------|-------------|
| light | ✅ Défini | `apps/web/src/styles/globals.css:18-40` |
| dark | ✅ Défini | `apps/web/src/styles/globals.css:42-82` |
| vibrant | ✅ Défini | `apps/web/src/styles/globals.css:84-125` |
| system | ✅ Auto-detect | Géré par providers |

## Plan de migration robuste

### ✅ Phase 1 - AUDIT TERMINÉ
- [x] Audit des doublons - 224 composants analysés
- [x] Checkpoint compilation baseline - packages/ui ✅ apps/web ⚠️

### ✅ Phase 2 - DESIGN SYSTEM UNIFIÉ CRÉÉ !
- [x] Créer `/design-system` dans packages/ui avec architecture modulaire
- [x] Migrer tokens CSS depuis apps/web (colorTokens, spacingTokens, etc.)
- [x] Créer configuration thèmes unifiée (light/dark/vibrant)
- [x] Étendre variants CVA avec nouveaux composants (dropdown, tooltip, etc.)
- [x] API centralisée avec `designSystem` object
- [x] **Checkpoint compilation ✅** - Package compile sans erreur

### ✅ Phase 3 - COMPOSANTS PRIMITIFS TERMINÉE !
- [x] **Améliorer Button unifié** ✅ (variants étendus + loading + icônes + design system)
- [x] **Créer Dialog unifié** ✅ (Radix UI + variants size/overlay + robustesse)
- [x] **Créer DropdownMenu unifié** ✅ (complexe - 3 versions fusionnées)
- [x] **Créer Tooltip unifié** ✅ (complexe - 4 versions fusionnées)
- [x] **Checkpoint compilation final** ✅ - Tous les primitifs unifiés compilent sans erreur

**✨ Résultats Phase 3:**
- 4 composants primitifs unifiés dans `/primitives/`
- Design system intégré avec variants robustes
- Package size: ESM 49.87 KB → CJS 55.04 KB (primitives)
- 100% compatible Radix UI pour accessibilité

### ✅ Phase 4 - PROVIDER THÈME UNIFIÉ TERMINÉE !
- [x] **Créer ThemeProvider unifié** ✅ (next-themes + design system intégré)
- [x] **Améliorer ThemeSwitcher** ✅ (dropdown + toggle modes + icônes Lucide)
- [x] **Intégrer thèmes existants** ✅ (lightTheme, darkTheme, vibrantTheme)
- [x] **Résoudre conflits types** ✅ (TopSteel préfixe pour éviter collisions)
- [x] **Checkpoint compilation final** ✅ - Système de thème unifié fonctionne

**✨ Résultats Phase 4:**
- ThemeProvider unifié basé sur next-themes avec 3 thèmes (light/dark/vibrant)
- ThemeSwitcher avec 2 modes : toggle simple + dropdown complet
- Integration design-system existant (pas de duplication types)
- Package theme: ESM 10.32 KB → 23.97 KB (+132% fonctionnalités)
- Support SSR, hydration safe, CSS variables automatiques

### 🔄 Phase 5 - NETTOYAGE
- [ ] Supprimer doublons apps/web/ui/
- [ ] Mettre à jour imports
- [ ] **Tests complets**

## Règles de robustesse

1. **Compilation après chaque étape**
2. **Backward compatibility maintenue**  
3. **Rollback possible à tout moment**
4. **Tests avant suppression**
5. **Migration progressive (pas de big bang)**