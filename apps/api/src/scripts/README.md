# 🏗️ Scripts d'Injection - Charpente Métallique TopSteel

Ce dossier contient tous les scripts nécessaires pour alimenter votre base de données TopSteel avec un catalogue complet d'articles de métallurgie et charpente métallique.

## 📦 Contenu des Scripts

### 🔧 Scripts Principaux

| Script | Description | Articles créés |
|--------|-------------|----------------|
| `seed-system-settings.sql` | Paramètres système (matériaux, nuances, dimensions) | - |
| `insert_ipe_profiles.sql` | Profilés IPE (80 à 600mm) | ~54 |
| `insert_hea_heb_profiles.sql` | Profilés HEA/HEB (100 à 300mm) | ~36 |
| `inject-tubes-metalliques.sql` | Tubes ronds, carrés, rectangulaires | ~65 |
| `insert-fers-plats-ronds.sql` | Fers plats et ronds (toutes dimensions) | ~257 |
| `inject-toles-metalliques.sql` | Tôles acier, inox, alu, spéciales | ~120 |
| `insert_bardage_couverture.sql` | Bacs, panneaux sandwich, accessoires | ~15 |

### 🎯 Scripts d'Exécution

| Script | Type | Description |
|--------|------|-------------|
| `master_inject_all_articles.sql` | SQL | Script maître PostgreSQL |
| `inject-metallurgy-data.ts` | TypeScript | Script d'exécution automatisé |
| `README.md` | Documentation | Ce fichier |

## 🚀 Installation et Exécution

### Prérequis

1. **Base de données PostgreSQL** fonctionnelle
2. **Node.js et TypeScript** installés
3. **Variables d'environnement** configurées dans `.env` :
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=erp_topsteel
   ```

### 🎯 Méthode 1: Exécution Automatique (Recommandée)

```bash
# Depuis le dossier apps/api
cd apps/api

# Exécution du script TypeScript
npx ts-node src/scripts/inject-metallurgy-data.ts

# Ou via npm (si script ajouté dans package.json)
npm run inject-metallurgy-data
```

### 🔧 Méthode 2: Exécution Manuelle SQL

```bash
# Connexion à PostgreSQL
psql -h localhost -U postgres -d erp_topsteel

# Exécution dans l'ordre :
\i src/scripts/seed-system-settings.sql
\i src/scripts/insert_ipe_profiles.sql
\i src/scripts/insert_hea_heb_profiles.sql
\i src/scripts/inject-tubes-metalliques.sql
\i src/scripts/insert-fers-plats-ronds.sql
\i src/scripts/inject-toles-metalliques.sql
\i src/scripts/insert_bardage_couverture.sql
```

### ⚡ Méthode 3: Script Maître SQL

```bash
psql -h localhost -U postgres -d erp_topsteel -f src/scripts/master_inject_all_articles.sql
```

## 📊 Données Injectées

### 🏗️ Matériaux et Nuances

**Aciers :**
- S235JR, S275JR, S355JR, S460JR
- Propriétés mécaniques complètes
- Normes EN 10025-2

**Inox :**
- 304, 304L, 316, 316L, 430
- Composition chimique
- Résistance corrosion

**Aluminium :**
- 1050, 5754, 6060, 6082
- Propriétés spécifiques
- Applications marines

### 🔩 Profilés Métalliques

**IPE (Poutrelles en I européennes) :**
- Tailles : 80, 100, 120, 140, 160, 180, 200, 220, 240, 270, 300, 330, 360, 400, 450, 500, 550, 600
- Nuances : S235JR, S275JR, S355JR
- Caractéristiques : moments d'inertie, modules de résistance, poids

**HEA/HEB (Poutrelles H européennes) :**
- HEA : 100 à 300mm
- HEB : 100 à 300mm  
- Nuances : S235JR, S275JR, S355JR
- Données techniques complètes

### 🟤 Tubes Métalliques

**Types :**
- Tubes ronds : Ø20 à Ø114.3mm
- Tubes carrés : 20x20 à 100x100mm
- Tubes rectangulaires : 40x20 à 200x100mm

**Matériaux :**
- Aciers : S235JR, S355JR
- Inox : 304L (tubes ronds)

### ⬜ Fers et Barres

**Fers ronds :**
- Diamètres : 6 à 100mm
- Matériaux : S235JR, S275JR, S355JR, 304L, 316L

**Fers plats :**
- Dimensions : 20x3 à 200x30mm
- Matériaux : S235JR, S275JR, S355JR

### 📄 Tôles Métalliques

**Types :**
- Tôles lisses acier : 0.5 à 30mm
- Tôles inox : 0.5 à 10mm
- Tôles aluminium : 0.5 à 10mm
- Tôles spéciales : larmées, gaufrées, perforées
- Tôles galvanisées Z275

### 🏠 Bardage et Couverture

**Éléments :**
- Bacs acier couverture (35.207, 40.183, 59.200)
- Bacs acier bardage (33.250, 40.250)
- Panneaux sandwich (PU, laine de roche)
- Plaques fibrociment
- Accessoires (faîtières, rives, gouttières)

## 📋 Structure des Articles

Chaque article contient :

```json
{
  "reference": "IPE-200-S235JR",
  "designation": "Poutrelle IPE 200 S235JR",
  "famille": "PROFILES_ACIER",
  "sousFamille": "IPE",
  "caracteristiquesTechniques": {
    "hauteur": 200,
    "largeur": 100,
    "epaisseurAme": 5.6,
    "epaisseurAile": 8.5,
    "poids": 22.4,
    "section": 28.5,
    "momentInertieX": 1943,
    "moduleResistanceX": 194,
    "norme": "EN 10025-2"
  }
}
```

## 🛠️ Codes de Références

### Format Standard
- **Profilés :** `{TYPE}-{HAUTEUR}-{NUANCE}`
- **Tubes :** `TUBE-{FORME}-{DIMENSIONS}-{NUANCE}`  
- **Fers :** `FER-{TYPE}-{DIMENSIONS}-{NUANCE}`
- **Tôles :** `TOLE-{NUANCE}-{ÉPAISSEUR}-{DIMENSIONS}`

### Exemples
```
IPE-200-S235JR          → Poutrelle IPE 200 en S235JR
TUBE-RD-48.3x3.0-S235JR → Tube rond Ø48.3 épaisseur 3mm
FER-PL-50x8-S275JR      → Fer plat 50x8mm en S275JR
TOLE-S235JR-3.0-2000x3000 → Tôle 3mm 2x3m en S235JR
```

## 🔍 Vérifications Post-Injection

### Requêtes de Contrôle

```sql
-- Nombre total d'articles par famille
SELECT famille, COUNT(*) 
FROM articles 
WHERE famille IN ('PROFILES_ACIER', 'TUBES_PROFILES', 'ACIERS_LONGS', 'TOLES_PLAQUES', 'COUVERTURE_BARDAGE')
GROUP BY famille;

-- Articles les plus chers
SELECT reference, designation, prix_vente_ht 
FROM articles 
ORDER BY prix_vente_ht DESC 
LIMIT 10;

-- Vérification des caractéristiques techniques
SELECT reference, caracteristiques_techniques->'poids' as poids_kg_m
FROM articles 
WHERE famille = 'PROFILES_ACIER'
LIMIT 5;
```

## ⚠️ Points d'Attention

### Avant Exécution
1. **Sauvegardez** votre base de données
2. **Vérifiez** l'espace disque disponible
3. **Testez** sur un environnement de développement
4. **Adaptez** le code société si nécessaire

### Pendant Exécution
- L'injection prend ~5-10 minutes selon la machine
- Les scripts nettoient les données existantes
- Les références doivent être uniques

### Après Exécution
- Vérifiez les statistiques affichées
- Testez dans l'interface ERP
- Contrôlez quelques calculs de prix

## 🔧 Personnalisation

### Modifier les Prix
Ajustez les prix dans chaque script selon vos tarifs :
```sql
prix_achat_standard, prix_vente_ht, taux_marge
```

### Ajouter des Matériaux
Complétez `seed-system-settings.sql` avec vos nuances spécifiques.

### Modifier les Dimensions
Adaptez les boucles de génération dans chaque script.

## 🆘 Support et Dépannage

### Erreurs Courantes

**"Base de données n'existe pas"**
```bash
createdb erp_topsteel
```

**"Société non trouvée"**
```sql
INSERT INTO societes (id, code, raison_sociale, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'topsteel', 'TopSteel Métallurgie', 'ACTIF', NOW(), NOW());
```

**"Contrainte de clé unique violée"**
- Exécutez les scripts de nettoyage en début
- Vérifiez les références existantes

### Logs et Diagnostics
```bash
# Activer les logs PostgreSQL
tail -f /var/log/postgresql/postgresql.log

# Vérifier les performances
EXPLAIN ANALYZE SELECT * FROM articles WHERE famille = 'PROFILES_ACIER';
```

## 📞 Contact

Pour toute question ou amélioration, consultez la documentation du projet TopSteel ou contactez l'équipe de développement.

---

🎉 **Prêt à injecter 550+ articles de charpente métallique dans votre ERP TopSteel !**