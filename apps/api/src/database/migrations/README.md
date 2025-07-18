# Migrations

Ce dossier est préparé pour les futures migrations de base de données.

## État actuel

L'application utilise actuellement la **synchronisation automatique TypeORM** (`synchronize: true`) pour créer et maintenir le schéma de base de données basé sur les entités.

## Système d'initialisation en place

- **Service d'initialisation** : `DatabaseInitService` 
- **Initialisation automatique** des énums PostgreSQL
- **Création automatique** des paramètres système par défaut
- **Création automatique** d'un utilisateur administrateur par défaut
- **Configuration** des menus par défaut

## Utilisation future des migrations

Quand l'application sera en production, nous pourrons :

1. **Désactiver** `synchronize: true` 
2. **Activer** `migrationsRun: true`
3. **Créer** des migrations avec : `npm run migration:generate -- --name=NomDeLaMigration`
4. **Exécuter** les migrations avec : `npm run migration:run`

## Commandes disponibles

```bash
# Générer une migration
npm run migration:generate -- --name=NomDeLaMigration

# Exécuter les migrations
npm run migration:run

# Revenir en arrière
npm run migration:revert
```

## Transition vers les migrations

Pour passer du mode synchronisation au mode migrations :

1. Modifier `database.module.ts` : `synchronize: false`, `migrationsRun: true`
2. Modifier `data-source.ts` : `migrationsRun: true`
3. Générer une migration initiale basée sur l'état actuel
4. Tester en environnement de développement
5. Déployer en production