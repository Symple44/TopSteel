# Système de Sécurité Continue TopSteel ERP

Ce document décrit le système de contrôles de sécurité continus mis en place pour le projet TopSteel ERP.

## Vue d'ensemble

Le système de sécurité comprend trois composants principaux :

1. **Workflow GitHub Actions** (`.github/workflows/security-continuous.yml`)
2. **Script de sécurité** (`scripts/security-check.sh` et `scripts/Check-Security.ps1`)  
3. **Configuration de sécurité** (`security.config.json`)

## Composants

### 1. Workflow GitHub Actions

Le workflow `security-continuous.yml` s'exécute automatiquement :
- À chaque push sur `main` et `develop`
- À chaque pull request
- Quotidiennement à 2h00 UTC

#### Contrôles effectués :

- **NPM Security Audit** : Audit des vulnérabilités dans les dépendances
- **CodeQL Analysis** : Analyse statique du code pour détecter les vulnérabilités
- **TruffleHog Secret Scanning** : Détection de secrets exposés dans le code
- **OWASP ZAP** : Tests de sécurité d'application web
- **OWASP Dependency Check** : Vérification des vulnérabilités dans les dépendances
- **Contrôles Windows** : Tests spécifiques pour la compatibilité Windows

#### Artefacts générés :

- Rapports de sécurité détaillés
- Issues GitHub automatiques en cas de problème critique
- Logs d'audit pour la traçabilité

### 2. Scripts de sécurité

#### Script Bash (`security-check.sh`)

Compatible Linux et Windows (Git Bash/WSL).

**Utilisation :**
```bash
./scripts/security-check.sh
```

**Contrôles effectués :**
- Vérification des permissions de fichiers
- Analyse des variables d'environnement
- Détection des injections SQL potentielles
- Validation de l'implémentation JWT
- Vérification des headers de sécurité
- Contrôle de l'authentification
- Analyse des dépendances

#### Script PowerShell (`Check-Security.ps1`)

Spécialement optimisé pour Windows.

**Utilisation :**
```powershell
# Exécution basique
.\scripts\Check-Security.ps1

# Avec rapport détaillé
.\scripts\Check-Security.ps1 -DetailedReport

# Avec export des résultats
.\scripts\Check-Security.ps1 -ExportResults -OutputPath "rapport-securite.json"
```

### 3. Configuration de sécurité

Le fichier `security.config.json` centralise toutes les politiques de sécurité :

#### Sections principales :

- **CORS** : Configuration des requêtes cross-origin
- **Headers** : Headers de sécurité HTTP (CSP, HSTS, etc.)
- **Rate Limiting** : Limitation des taux de requêtes
- **Validation** : Règles de validation des entrées
- **Authentification** : Politiques JWT et mots de passe
- **Chiffrement** : Configuration des algorithmes de chiffrement
- **Logging** : Journalisation des événements de sécurité
- **Monitoring** : Surveillance et alertes
- **Compliance** : Conformité GDPR et autres réglementations

## Installation et Configuration

### 1. Installation des dépendances

```bash
# NPM/PNPM dependencies for security tools
pnpm install audit-ci better-npm-audit --save-dev

# PowerShell (Windows uniquement)
# Les modules requis sont installés automatiquement
```

### 2. Configuration des secrets GitHub

Configurez les secrets suivants dans votre repository GitHub :

- `SLACK_WEBHOOK_URL` : Pour les notifications Slack (optionnel)
- `SECURITY_EMAIL` : Email pour les alertes de sécurité

### 3. Activation des contrôles

Les contrôles sont activés automatiquement via GitHub Actions. Pour les tests locaux :

```bash
# Linux/WSL/Git Bash
chmod +x scripts/security-check.sh
./scripts/security-check.sh

# Windows PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\Check-Security.ps1
```

## Interprétation des résultats

### Niveaux de sévérité

- **🔴 CRITICAL/ERROR** : Problèmes de sécurité nécessitant une correction immédiate
- **🟡 WARNING** : Problèmes potentiels à examiner et corriger
- **🔵 INFO** : Informations sur la configuration actuelle
- **🟢 SUCCESS** : Contrôles réussis

### Actions recommandées

#### En cas d'erreurs critiques :
1. Ne pas déployer en production
2. Corriger immédiatement les problèmes identifiés
3. Re-exécuter les contrôles
4. Documenter les correctifs

#### En cas d'avertissements :
1. Examiner les problèmes identifiés
2. Évaluer l'impact sur la sécurité
3. Planifier les correctifs
4. Mettre à jour la documentation

## Bonnes pratiques

### Développement

1. **Exécuter les contrôles locaux** avant chaque commit
2. **Utiliser des variables d'environnement** pour les secrets
3. **Implémenter la validation des entrées** systématiquement
4. **Utiliser des requêtes paramétrées** pour SQL
5. **Configurer les headers de sécurité** appropriés

### Configuration

1. **Réviser régulièrement** `security.config.json`
2. **Mettre à jour les politiques** selon les besoins métier
3. **Tester les configurations** en environnement de staging
4. **Documenter les changements** de politique

### Monitoring

1. **Surveiller les alertes** GitHub Issues automatiques
2. **Analyser les rapports** de sécurité quotidiens
3. **Maintenir les dépendances** à jour
4. **Former l'équipe** aux bonnes pratiques

## Dépannage

### Problèmes courants

#### Script bash ne s'exécute pas sur Windows
```bash
# S'assurer que Git Bash est installé
# Ou utiliser WSL
# Alternativement, utiliser le script PowerShell
```

#### Erreur de permissions PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### CodeQL échoue sur certains fichiers
- Vérifier la syntaxe TypeScript/JavaScript
- Exclure les fichiers problématiques du scan si nécessaire

#### TruffleHog génère des faux positifs
- Mettre à jour le fichier `.trufflehogignore`
- Utiliser des patterns d'exclusion appropriés

## Maintenance

### Mise à jour mensuelle

1. **Mettre à jour les outils** de sécurité
2. **Réviser les politiques** de sécurité
3. **Analyser les métriques** de sécurité
4. **Former l'équipe** sur les nouvelles menaces

### Mise à jour des configurations

1. **Tester en staging** avant production
2. **Documenter les changements**
3. **Communiquer** avec l'équipe
4. **Surveiller** l'impact après déploiement

## Support

Pour toute question ou problème :

1. **Consulter** cette documentation
2. **Vérifier** les logs des workflows GitHub Actions
3. **Contacter** l'équipe sécurité TopSteel
4. **Créer une issue** GitHub pour les problèmes techniques

---

**Dernière mise à jour :** Août 2025  
**Version :** 1.0.0  
**Responsable :** Équipe Sécurité TopSteel