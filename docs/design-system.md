# 🎨 Design System ERP TopSteel

## 📋 Architecture

Cette configuration créé un design system auto-suffisant qui :

- ✅ **Évite les dépendances externes** (plus besoin de tailwindcss-animate)
- ✅ **Centralise tous les styles** dans `@erp/config`
- ✅ **Scalable** pour de nouvelles apps
- ✅ **Performance optimisée** avec tree-shaking
- ✅ **Type-safe** avec IntelliSense complet

## 🏗️ Structure

```
packages/config/tailwind/
├── base.js           # Design system complet
└── web.js           # Extensions spécifiques web

apps/web/
├── tailwind.config.js # Référence simple vers @erp/config
├── postcss.config.js  # Configuration PostCSS standard
└── src/app/globals.css # CSS avec variables et utilitaires
```

## 🎯 Utilisation

### Couleurs métier
```jsx
<div className="bg-metallurgy-600 text-white">TopSteel</div>
<div className="bg-steel-500">Acier</div>
<span className="status-badge status-active">Actif</span>
```

### Animations intégrées
```jsx
<div className="animate-fade-in">Apparition douce</div>
<div className="animate-slide-in-up">Glissement vers le haut</div>
<div className="animate-accordion-down">Accordéon</div>
```

### Composants ERP
```jsx
<button className="btn-erp btn-metallurgy">Action</button>
<div className="card-erp card-hover">Carte interactive</div>
<div className="scrollbar-thin">Contenu avec scrollbar fine</div>
```

### Grilles responsives
```jsx
<div className="grid-cards">Cartes auto-adaptatives</div>
<div className="grid-dashboard">Layout dashboard</div>
```

## 🚀 Avantages

1. **Zéro dépendance externe** - Tout est intégré
2. **Performance** - Tree-shaking optimal
3. **Maintenance** - Un seul endroit pour tous les styles
4. **Extensibilité** - Facile d'ajouter de nouvelles apps
5. **TypeScript** - IntelliSense pour toutes les classes

## 📦 Dépendances minimales

Seulement 3 dépendances nécessaires :
- `tailwindcss`
- `postcss` 
- `autoprefixer`

## 🔄 Migration d'apps existantes

Pour une nouvelle app :
```js
// nouvelle-app/tailwind.config.js
module.exports = require('@erp/config/tailwind/web')
```

## 🎨 Customisation

Modifiez `packages/config/tailwind/base.js` pour :
- Ajouter de nouvelles couleurs
- Créer des animations personnalisées
- Étendre les composants ERP
- Définir de nouvelles grilles

Les changements s'appliquent automatiquement à toutes les apps !
