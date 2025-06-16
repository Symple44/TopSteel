# 🚀 Guide de Lancement Rapide - ERP Métallerie

## 📋 Checklist de démarrage

### 1️⃣ Installation (5 minutes)

```bash
# Cloner le projet (ou créer un nouveau dossier)
mkdir erp-metallerie
cd erp-metallerie

# Initialiser le projet Next.js
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
# Répondre "No" à src/ directory
# Répondre "Yes" aux autres questions

# Copier tous les fichiers du projet
# (Remplacer les fichiers existants si demandé)

# Installer les dépendances
npm install
```

### 2️⃣ Configuration (2 minutes)

```bash
# Créer le fichier d'environnement
cp .env.example .env.local

# Éditer .env.local si nécessaire
# (Les valeurs par défaut fonctionnent pour la démo)
```

### 3️⃣ Lancement (1 minute)

```bash
# Lancer le serveur de développement
npm run dev
```

📱 Ouvrir [http://localhost:3000](http://localhost:3000)

### 4️⃣ Connexion

**Identifiants de démonstration :**
- 📧 Email : `demo@metallerie.fr`
- 🔑 Mot de passe : `password`

## 🎯 Fonctionnalités disponibles

### ✅ Modules fonctionnels
- **Dashboard** : Vue d'ensemble avec statistiques
- **Projets** : Liste, détails, création
- **Stocks** : Inventaire et alertes
- **Chiffrage** : Calculateur de devis
- **Production** : Ordres de fabrication et planning
- **Clients** : Gestion de la base clients

### 🔧 À implémenter
- Connexion API backend réelle
- Module de visualisation 3D
- Système de notifications temps réel
- Export PDF des documents
- Gestion des emails

## 🐛 Résolution des problèmes courants

### ❌ Erreur "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ Erreur de types TypeScript
```bash
# Normal au premier lancement, ignorez ou :
npm run type-check
```

### ❌ Port 3000 déjà utilisé
```bash
# Utiliser un autre port
PORT=3001 npm run dev
```

## 📱 Navigation dans l'application

1. **Dashboard** : Vue d'ensemble de l'activité
2. **Projets** : 
   - Cliquez sur un projet pour voir les détails
   - Bouton "Nouveau projet" pour créer
   - Onglets : Infos, Devis, Production, 3D, Documents
3. **Stocks** : 
   - Alertes en rouge pour stocks critiques
   - Filtres par catégorie
4. **Chiffrage** : 
   - Ajouter des éléments
   - Calcul automatique avec marge
5. **Production** : 
   - Vue des ordres en cours
   - Planning hebdomadaire
6. **Clients** : 
   - Liste avec recherche
   - Fiche détaillée par client

## 🎨 Personnalisation rapide

### Changer les couleurs
Éditer `tailwind.config.ts` :
```js
primary: {
  DEFAULT: "hsl(222.2 47.4% 11.2%)", // Remplacer par votre couleur
}
```

### Changer le logo
1. Remplacer dans `src/components/layout/sidebar.tsx`
2. Modifier l'icône `Building2` par votre logo

### Ajouter votre entreprise
Éditer `src/app/layout.tsx` :
```tsx
metadata: {
  title: 'Votre Entreprise - ERP',
}
```

## 🚦 Prochaines étapes

1. **Backend** : Connecter une vraie API
2. **Base de données** : Configurer PostgreSQL + Prisma
3. **Authentification** : Implémenter JWT
4. **Déploiement** : Vercel ou serveur dédié

## 💡 Tips

- 🔄 Hot reload actif : les modifications sont visibles instantanément
- 📱 Interface responsive : testez sur mobile
- 🌙 Mode sombre : cliquez sur l'icône soleil/lune
- 📊 Données mockées : modifiables dans chaque page

## 🆘 Support

- 📖 Documentation complète : `README.md`
- 🐛 Problème ? Créez une issue GitHub
- 💬 Questions ? Contact : support@erp-metallerie.fr

---

**Bon développement ! 🎉**