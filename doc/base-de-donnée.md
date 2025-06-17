# 📚 Documentation Base de Données ERP TOPSTEEL

## Vue d'ensemble

La base de données PostgreSQL de l'ERP TOPSTEEL est conçue pour gérer l'ensemble des processus métier d'une entreprise de métallerie, depuis la relation client jusqu'à la production et la facturation.

### Caractéristiques principales

- **Base de données** : PostgreSQL 15+
- **Schéma** : Relationnel avec support JSON pour données flexibles
- **Sécurité** : Row Level Security (RLS) sur tables sensibles
- **Audit** : Traçabilité complète des modifications
- **Performance** : Index optimisés et vues matérialisées

## 📊 Statistiques de la base

- **33 tables** principales
- **21 types ENUM** pour la cohérence des données
- **85+ index** pour les performances
- **10+ triggers** pour l'automatisation
- **5+ fonctions** métier

## 🗂️ Description des tables

### 1. Gestion des utilisateurs

#### **users**

Table centrale pour l'authentification et la gestion des utilisateurs.

| Colonne       | Type         | Description                             |
| ------------- | ------------ | --------------------------------------- |
| id            | UUID         | Identifiant unique                      |
| email         | VARCHAR(255) | Email unique pour connexion             |
| password      | VARCHAR(255) | Mot de passe hashé (bcrypt)             |
| nom           | VARCHAR(100) | Nom de famille                          |
| prenom        | VARCHAR(100) | Prénom                                  |
| role          | user_role    | Rôle (ADMIN, MANAGER, COMMERCIAL, etc.) |
| is_active     | BOOLEAN      | Compte actif ou non                     |
| refresh_token | TEXT         | Token de rafraîchissement JWT           |
| last_login    | TIMESTAMP    | Dernière connexion                      |

**Relations** :

- Un utilisateur peut être responsable de plusieurs projets
- Un utilisateur peut être assigné à plusieurs opérations
- Un utilisateur créé des documents, devis, factures, etc.

### 2. Gestion commerciale

#### **clients**

Gestion des clients (particuliers, professionnels, collectivités).

| Colonne       | Type         | Description                 |
| ------------- | ------------ | --------------------------- |
| id            | UUID         | Identifiant unique          |
| type          | client_type  | Type de client              |
| nom           | VARCHAR(255) | Raison sociale ou nom       |
| siret         | VARCHAR(14)  | SIRET (unique)              |
| adresse       | JSONB        | Adresse complète structurée |
| credit_limite | DECIMAL      | Limite de crédit autorisée  |
| encours       | DECIMAL      | Encours actuel calculé      |

**Structure JSON adresse** :

```json
{
  "rue": "123 Rue Example",
  "code_postal": "44000",
  "ville": "Nantes",
  "pays": "France",
  "complement": "Bât. A"
}
```

#### **projets**

Table centrale qui lie tous les processus de l'entreprise.

| Colonne    | Type          | Description                      |
| ---------- | ------------- | -------------------------------- |
| id         | UUID          | Identifiant unique               |
| reference  | VARCHAR(50)   | Référence unique (PRJ-2025-0001) |
| statut     | projet_statut | État du projet                   |
| type       | projet_type   | Type de réalisation              |
| client_id  | UUID          | Client associé                   |
| montant_ht | DECIMAL       | Montant HT total                 |
| avancement | DECIMAL       | Pourcentage d'avancement (0-100) |

**États possibles** :

- BROUILLON → DEVIS → ACCEPTE → EN_COURS → TERMINE → FACTURE → CLOTURE
- Peut être ANNULE à tout moment

#### **devis**

Gestion des devis avec versioning.

| Colonne       | Type         | Description                   |
| ------------- | ------------ | ----------------------------- |
| numero        | VARCHAR(50)  | Numéro unique (DEV-2025-0001) |
| projet_id     | UUID         | Projet associé                |
| version       | INTEGER      | Version du devis              |
| statut        | devis_statut | État du devis                 |
| date_validite | DATE         | Date limite de validité       |

**Particularités** :

- Support du multi-version pour un même projet
- Calcul automatique des totaux
- Lignes optionnelles possibles

### 3. Gestion des achats

#### **fournisseurs**

Base fournisseurs avec informations commerciales.

| Colonne         | Type         | Description                    |
| --------------- | ------------ | ------------------------------ |
| nom             | VARCHAR(255) | Raison sociale                 |
| delai_paiement  | INTEGER      | Délai en jours                 |
| delai_livraison | INTEGER      | Délai moyen en jours           |
| franco          | DECIMAL      | Montant minimum franco de port |
| categories      | TEXT[]       | Catégories de produits fournis |

#### **commandes**

Commandes fournisseurs liées ou non à des projets.

| Colonne        | Type            | Description                   |
| -------------- | --------------- | ----------------------------- |
| numero         | VARCHAR(50)     | Numéro unique (CMD-2025-0001) |
| projet_id      | UUID            | Projet associé (optionnel)    |
| fournisseur_id | UUID            | Fournisseur                   |
| statut         | commande_statut | État de la commande           |

**Workflow** :
BROUILLON → CONFIRMEE → EN_COURS → LIVREE_PARTIELLEMENT → LIVREE → FACTUREE

### 4. Gestion des stocks

#### **produits**

Catalogue des produits et matières premières.

| Colonne        | Type              | Description                  |
| -------------- | ----------------- | ---------------------------- |
| reference      | VARCHAR(100)      | Référence unique             |
| categorie      | categorie_produit | Type de produit              |
| unite          | unite_mesure      | Unité de mesure              |
| coefficient    | DECIMAL           | Coefficient prix vente/achat |
| specifications | JSONB             | Caractéristiques techniques  |

**Catégories** : PROFILE, TOLE, TUBE, ACCESSOIRE, QUINCAILLERIE, CONSOMMABLE, OUTILLAGE

#### **stocks**

État des stocks en temps réel.

| Colonne             | Type    | Description                     |
| ------------------- | ------- | ------------------------------- |
| produit_id          | UUID    | Produit concerné (relation 1-1) |
| quantite_disponible | DECIMAL | Stock physique                  |
| quantite_reservee   | DECIMAL | Réservé pour projets            |
| quantite_minimale   | DECIMAL | Seuil d'alerte                  |

**Calculs** :

- Quantité libre = disponible - reservee
- Alerte si disponible < minimale × 1.2

#### **mouvements_stock**

Historique complet des mouvements.

| Colonne            | Type           | Description           |
| ------------------ | -------------- | --------------------- |
| type_mouvement     | type_mouvement | Nature du mouvement   |
| quantite_avant     | DECIMAL        | Stock avant mouvement |
| quantite_apres     | DECIMAL        | Stock après mouvement |
| reference_document | VARCHAR        | Document source       |

**Types** : ENTREE, SORTIE, RESERVATION, LIBERATION, AJUSTEMENT, INVENTAIRE

### 5. Gestion de production

#### **ordres_fabrication**

Ordres de fabrication liés aux projets.

| Colonne     | Type              | Description                  |
| ----------- | ----------------- | ---------------------------- |
| numero      | VARCHAR(50)       | Numéro unique (OF-2025-0001) |
| projet_id   | UUID              | Projet associé               |
| statut      | production_statut | État de production           |
| progression | DECIMAL           | Avancement global (0-100)    |

#### **operations**

Détail des opérations de fabrication.

| Colonne              | Type         | Description            |
| -------------------- | ------------ | ---------------------- |
| ordre_fabrication_id | UUID         | OF parent              |
| nom                  | VARCHAR(255) | Nom de l'opération     |
| duree_estimee        | INTEGER      | Durée prévue (minutes) |
| duree_reelle         | INTEGER      | Durée réelle (minutes) |
| technicien_id        | UUID         | Technicien assigné     |

### 6. Gestion financière

#### **factures**

Factures clients avec suivi des paiements.

| Colonne      | Type           | Description                   |
| ------------ | -------------- | ----------------------------- |
| numero       | VARCHAR(50)    | Numéro unique (FAC-2025-0001) |
| projet_id    | UUID           | Projet facturé                |
| statut       | facture_statut | État de la facture            |
| montant_paye | DECIMAL        | Montant déjà payé             |
| relances     | INTEGER        | Nombre de relances            |

**États** : BROUILLON → EMISE → ENVOYEE → PAYEE_PARTIELLEMENT → PAYEE

#### **paiements**

Enregistrement des paiements reçus.

| Colonne       | Type          | Description         |
| ------------- | ------------- | ------------------- |
| facture_id    | UUID          | Facture concernée   |
| montant       | DECIMAL       | Montant du paiement |
| mode_paiement | mode_paiement | Mode de règlement   |
| reconcilie    | BOOLEAN       | Rapproché en compta |

### 7. Gestion documentaire

#### **documents**

Stockage sécurisé des documents.

| Colonne      | Type          | Description                |
| ------------ | ------------- | -------------------------- |
| nom          | VARCHAR(255)  | Nom du fichier             |
| type         | type_document | Type de document           |
| hash_fichier | VARCHAR(64)   | Hash SHA256 pour intégrité |
| metadata     | JSONB         | Métadonnées additionnelles |

**Sécurité** :

- Row Level Security activé
- Accès limité au propriétaire sauf admin/manager

### 8. Planning et notifications

#### **planning_taches**

Gestion du planning et des tâches.

| Colonne    | Type         | Description                |
| ---------- | ------------ | -------------------------- |
| titre      | VARCHAR(255) | Titre de la tâche          |
| projet_id  | UUID         | Projet associé (optionnel) |
| assigne_a  | UUID         | Utilisateur assigné        |
| recurrence | JSONB        | Règles de récurrence       |

#### **notifications**

Système de notifications utilisateur.

| Colonne        | Type              | Description          |
| -------------- | ----------------- | -------------------- |
| utilisateur_id | UUID              | Destinataire         |
| type           | type_notification | Type de notification |
| lu             | BOOLEAN           | Statut de lecture    |
| action_url     | VARCHAR           | Lien vers l'action   |

### 9. Administration

#### **parametres**

Configuration système key-value.

| Colonne     | Type         | Description        |
| ----------- | ------------ | ------------------ |
| cle         | VARCHAR(100) | Clé unique         |
| valeur      | TEXT         | Valeur stockée     |
| type_valeur | type_valeur  | Type pour parsing  |
| categorie   | VARCHAR(50)  | Groupement logique |

#### **audit_logs**

Traçabilité complète des modifications.

| Colonne           | Type        | Description                |
| ----------------- | ----------- | -------------------------- |
| entite            | VARCHAR(50) | Table auditée              |
| action            | VARCHAR(20) | INSERT/UPDATE/DELETE       |
| anciennes_valeurs | JSONB       | Valeurs avant modification |
| nouvelles_valeurs | JSONB       | Valeurs après modification |

## 🔗 Relations principales

### Hiérarchie des données

```
Client
  └── Projet
      ├── Devis → Facture → Paiements
      ├── Commandes fournisseur
      ├── Ordres de fabrication → Opérations
      ├── Documents
      └── Planning/Tâches
```

### Relations critiques

1. **Projet** est l'entité centrale qui lie :

   - Client (obligatoire)
   - Devis (multiples versions possibles)
   - Commandes (optionnelles)
   - Production (OF et opérations)
   - Facturation

2. **Stock** avec double gestion :

   - Quantité disponible (physique)
   - Quantité réservée (pour projets)
   - Historique complet via mouvements

3. **Utilisateurs** avec multi-rôles :
   - Responsable projet
   - Technicien production
   - Commercial (devis)
   - Comptable (factures)

## 🔒 Sécurité et intégrité

### Contraintes d'intégrité

- **Unicité** : Email, SIRET, références (projet, devis, etc.)
- **Clés étrangères** : Toutes avec ON DELETE CASCADE ou RESTRICT
- **Check constraints** : Avancement 0-100%, dates cohérentes
- **Valeurs par défaut** : Timestamps, statuts initiaux

### Row Level Security (RLS)

Activé sur :

- **documents** : Accès propriétaire + admin/manager
- **notifications** : Accès personnel uniquement

### Audit automatique

Triggers sur tables critiques :

- projets, devis, factures, paiements
- Capture complète avant/après modification

## 📈 Optimisations

### Index de performance

1. **Clés étrangères** : Tous les FK sont indexés
2. **Recherche** : Index GIN pour recherche textuelle
3. **JSONB** : Index GIN sur champs JSON
4. **Dates** : Index composites sur plages de dates
5. **Statuts** : Index sur enums fréquemment filtrés

### Vues optimisées

- **v_dashboard_stats** : Statistiques temps réel
- **v_stocks_critiques** : Alertes stock pré-calculées

## 🛠️ Maintenance

### Sauvegardes recommandées

```bash
# Sauvegarde complète
pg_dump -h localhost -U postgres -d erp_topsteel -F c -f backup.dump

# Sauvegarde schéma uniquement
pg_dump -h localhost -U postgres -d erp_topsteel --schema-only -f schema.sql
```

### Monitoring à surveiller

1. **Taille des tables** : audit_logs, mouvements_stock
2. **Index bloat** : Réindexation périodique
3. **Vacuum** : Auto-vacuum configuré
4. **Connexions** : Pool de 100 max

## 📝 Notes d'implémentation

### Bonnes pratiques appliquées

1. **UUID** pour tous les identifiants (évite les conflits)
2. **Timestamps WITH TIME ZONE** (gestion multi-sites)
3. **JSONB** pour données flexibles (adresses, metadata)
4. **Arrays** pour listes simples (tags, catégories)
5. **Triggers** pour logique métier côté base
6. **Functions** pour calculs complexes

### Points d'attention

1. **Performances** : Les vues complexes peuvent nécessiter des index supplémentaires
2. **Archivage** : Prévoir une stratégie pour audit_logs et mouvements_stock
3. **RGPD** : Implémenter la suppression/anonymisation des données clients
4. **Backup** : Sauvegardes quotidiennes minimum en production
