#!/usr/bin/env ts-node

/**
 * Service principal de migration vers l'architecture multi-tenant
 * Orchestre toutes les étapes de migration
 */

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Charger les variables d'environnement
config({ path: path.join(__dirname, '../../../.env') })

interface MigrationStep {
  name: string
  description: string
  execute: () => Promise<void>
  rollback?: () => Promise<void>
  critical: boolean
}

class MigrationService {
  private currentDataSource: DataSource
  private authDataSource: DataSource
  private sharedDataSource: DataSource
  private tenantDataSource: DataSource
  private completedSteps: string[] = []

  constructor() {
    // Base de données actuelle (source)
    this.currentDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'erp_topsteel',
    })

    // Base AUTH (destination)
    this.authDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
      migrations: [path.join(__dirname, '../../database/migrations/auth/*.ts')],
      migrationsRun: false
    })

    // Base SHARED (destination)
    this.sharedDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_SHARED_NAME || 'erp_topsteel_shared',
      migrations: [path.join(__dirname, '../../database/migrations/shared/*.ts')],
      migrationsRun: false
    })

    // Base TENANT par défaut (TopSteel)
    this.tenantDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'erp_topsteel_topsteel', // Base tenant par défaut
      migrations: [path.join(__dirname, '../../database/migrations/tenant/*.ts')],
      migrationsRun: false
    })
  }

  /**
   * Initialise toutes les connexions
   */
  async initializeConnections(): Promise<void> {
    console.log('🔗 Initialisation des connexions...')
    
    await this.currentDataSource.initialize()
    console.log('   ✓ Base actuelle connectée')
    
    // Les autres bases seront créées et connectées selon les besoins
  }

  /**
   * Ferme toutes les connexions
   */
  async closeConnections(): Promise<void> {
    console.log('🔌 Fermeture des connexions...')
    
    const connections = [
      this.currentDataSource,
      this.authDataSource,
      this.sharedDataSource,
      this.tenantDataSource
    ]

    for (const connection of connections) {
      if (connection.isInitialized) {
        await connection.destroy()
      }
    }
  }

  /**
   * Crée les nouvelles bases de données
   */
  async createDatabases(): Promise<void> {
    console.log('🗄️ Création des nouvelles bases de données...')
    
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres', // Base admin
    })

    await adminDataSource.initialize()

    try {
      const databases = [
        process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
        process.env.DB_SHARED_NAME || 'erp_topsteel_shared',
        'erp_topsteel_topsteel' // Base tenant par défaut
      ]

      for (const dbName of databases) {
        try {
          await adminDataSource.query(`CREATE DATABASE "${dbName}" WITH ENCODING 'UTF8'`)
          console.log(`   ✓ Base créée: ${dbName}`)
        } catch (error: any) {
          if (error.code === '42P04') {
            console.log(`   ⚠️ Base existe déjà: ${dbName}`)
          } else {
            throw error
          }
        }
      }
    } finally {
      await adminDataSource.destroy()
    }
  }

  /**
   * Exécute les migrations sur les nouvelles bases
   */
  async runMigrations(): Promise<void> {
    console.log('📋 Exécution des migrations...')
    
    // Migration AUTH
    console.log('   🔐 Migration base AUTH...')
    if (!this.authDataSource.isInitialized) {
      await this.authDataSource.initialize()
    }
    await this.authDataSource.runMigrations()
    console.log('   ✓ Migrations AUTH terminées')
    
    // Migration SHARED
    console.log('   📊 Migration base SHARED...')
    if (!this.sharedDataSource.isInitialized) {
      await this.sharedDataSource.initialize()
    }
    await this.sharedDataSource.runMigrations()
    console.log('   ✓ Migrations SHARED terminées')
    
    // Migration TENANT
    console.log('   🏢 Migration base TENANT...')
    if (!this.tenantDataSource.isInitialized) {
      await this.tenantDataSource.initialize()
    }
    await this.tenantDataSource.runMigrations()
    console.log('   ✓ Migrations TENANT terminées')
  }

  /**
   * Migre les utilisateurs vers la base AUTH
   */
  async migrateUsers(): Promise<void> {
    console.log('👥 Migration des utilisateurs...')
    
    // Récupérer les utilisateurs de la base actuelle
    const users = await this.currentDataSource.query(`
      SELECT id, nom, prenom, email, password, role, actif, acronyme, 
             dernier_login, version, "refreshToken", metadata, 
             created_at, updated_at, deleted_at
      FROM users 
      WHERE deleted_at IS NULL
    `)
    
    console.log(`   📊 ${users.length} utilisateurs à migrer`)
    
    // Insérer dans la base AUTH
    for (const user of users) {
      await this.authDataSource.query(`
        INSERT INTO users (
          id, nom, prenom, email, password, role, actif, acronyme,
          dernier_login, version, "refreshToken", metadata,
          created_at, updated_at, deleted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          updated_at = EXCLUDED.updated_at
      `, [
        user.id, user.nom, user.prenom, user.email, user.password,
        user.role, user.actif, user.acronyme, user.dernier_login,
        user.version, user.refreshToken, user.metadata,
        user.created_at, user.updated_at, user.deleted_at
      ])
    }
    
    console.log('   ✓ Utilisateurs migrés')
  }

  /**
   * Crée la société par défaut TopSteel
   */
  async createDefaultCompany(): Promise<string> {
    console.log('🏢 Création de la société par défaut...')
    
    const societeId = await this.authDataSource.query(`
      INSERT INTO societes (
        nom, code, database_name, status, plan,
        max_users, max_sites, configuration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      'TopSteel',
      'TOPSTEEL',
      'erp_topsteel_topsteel',
      'ACTIVE',
      'ENTERPRISE',
      100,
      10,
      JSON.stringify({
        modules: ['stocks', 'production', 'clients', 'commandes'],
        features: ['multi_site', 'advanced_reporting'],
        locale: 'fr-FR',
        timezone: 'Europe/Paris'
      })
    ])
    
    const companyId = societeId[0].id
    console.log(`   ✓ Société créée avec ID: ${companyId}`)
    
    // Créer le site principal
    await this.authDataSource.query(`
      INSERT INTO sites (
        societe_id, nom, code, type, is_principal, actif
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [companyId, 'Site Principal TopSteel', 'MAIN', 'MIXED', true, true])
    
    console.log('   ✓ Site principal créé')
    
    return companyId
  }

  /**
   * Associe les utilisateurs à la société par défaut
   */
  async associateUsersToCompany(companyId: string): Promise<void> {
    console.log('👥 Association des utilisateurs à la société...')
    
    const users = await this.authDataSource.query(`
      SELECT id FROM users WHERE deleted_at IS NULL
    `)
    
    for (const user of users) {
      await this.authDataSource.query(`
        INSERT INTO societe_users (
          user_id, societe_id, role, actif, is_default, permissions
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        user.id,
        companyId,
        'ADMIN', // Tous admin par défaut pour la migration
        true,
        true,
        JSON.stringify(['*']) // Toutes permissions
      ])
    }
    
    console.log(`   ✓ ${users.length} utilisateurs associés`)
  }

  /**
   * Migre les données métier vers la base tenant
   */
  async migrateBusinessData(companyId: string): Promise<void> {
    console.log('📦 Migration des données métier...')
    
    // Migration des clients
    await this.migrateClients(companyId)
    
    // Migration des fournisseurs
    await this.migrateFournisseurs(companyId)
    
    // Migration des matériaux
    await this.migrateMateriaux(companyId)
    
    // Migration des stocks
    await this.migrateStocks(companyId)
    
    // Migration des commandes
    await this.migrateCommandes(companyId)
    
    console.log('   ✓ Données métier migrées')
  }

  private async migrateClients(companyId: string): Promise<void> {
    const clients = await this.currentDataSource.query(`
      SELECT * FROM clients WHERE deleted_at IS NULL
    `)
    
    console.log(`   📊 Migration de ${clients.length} clients...`)
    
    for (const client of clients) {
      await this.tenantDataSource.query(`
        INSERT INTO clients (
          id, societe_id, nom, code, type, siret, adresse, code_postal,
          ville, pays, telephone, email, contact_principal, actif, notes,
          created_at, updated_at, deleted_at, version, created_by_id, updated_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `, [
        client.id, companyId, client.nom, client.code, 'ENTREPRISE',
        client.siret, client.adresse, client.code_postal, client.ville,
        client.pays || 'France', client.telephone, client.email,
        client.contact_principal, client.actif, client.notes,
        client.created_at, client.updated_at, client.deleted_at,
        client.version, client.created_by_id, client.updated_by_id
      ])
    }
  }

  private async migrateFournisseurs(companyId: string): Promise<void> {
    const fournisseurs = await this.currentDataSource.query(`
      SELECT * FROM fournisseurs WHERE deleted_at IS NULL
    `)
    
    console.log(`   📊 Migration de ${fournisseurs.length} fournisseurs...`)
    
    for (const fournisseur of fournisseurs) {
      await this.tenantDataSource.query(`
        INSERT INTO fournisseurs (
          id, societe_id, nom, code, type, siret, adresse, telephone, email,
          contact_principal, conditions_paiement, delai_livraison, actif,
          created_at, updated_at, deleted_at, version, created_by_id, updated_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        fournisseur.id, companyId, fournisseur.nom, fournisseur.code,
        'DISTRIBUTEUR', fournisseur.siret, fournisseur.adresse,
        fournisseur.telephone, fournisseur.email, fournisseur.contact_principal,
        fournisseur.conditions_paiement, fournisseur.delai_livraison,
        fournisseur.actif, fournisseur.created_at, fournisseur.updated_at,
        fournisseur.deleted_at, fournisseur.version, fournisseur.created_by_id,
        fournisseur.updated_by_id
      ])
    }
  }

  private async migrateMateriaux(companyId: string): Promise<void> {
    const materiaux = await this.currentDataSource.query(`
      SELECT * FROM materiaux WHERE deleted_at IS NULL
    `)
    
    console.log(`   📊 Migration de ${materiaux.length} matériaux...`)
    
    for (const materiau of materiaux) {
      await this.tenantDataSource.query(`
        INSERT INTO materiaux (
          id, societe_id, fournisseur_id, nom, reference, type, forme,
          dimensions, poids_unitaire, prix_unitaire, unite, stock_minimum,
          actif, caracteristiques, created_at, updated_at, deleted_at,
          version, created_by_id, updated_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        materiau.id, companyId, materiau.fournisseur_id, materiau.nom,
        materiau.reference, 'ACIER', 'PLAQUE', JSON.stringify({}),
        materiau.poids_unitaire, materiau.prix_unitaire, materiau.unite || 'kg',
        materiau.stock_minimum || 0, materiau.actif, JSON.stringify({}),
        materiau.created_at, materiau.updated_at, materiau.deleted_at,
        materiau.version, materiau.created_by_id, materiau.updated_by_id
      ])
    }
  }

  private async migrateStocks(companyId: string): Promise<void> {
    const stocks = await this.currentDataSource.query(`
      SELECT * FROM stocks WHERE deleted_at IS NULL
    `)
    
    console.log(`   📊 Migration de ${stocks.length} stocks...`)
    
    for (const stock of stocks) {
      // Chercher le matériau correspondant
      const materiau = await this.currentDataSource.query(`
        SELECT id FROM materiaux WHERE id = $1
      `, [stock.materiau_id])
      
      if (materiau.length > 0) {
        await this.tenantDataSource.query(`
          INSERT INTO stocks (
            id, societe_id, materiau_id, quantite, quantite_reservee,
            emplacement, date_derniere_entree, date_derniere_sortie,
            valeur_stock, actif, created_at, updated_at, deleted_at,
            version, created_by_id, updated_by_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          stock.id, companyId, stock.materiau_id, stock.quantite || 0,
          stock.quantite_reservee || 0, stock.emplacement,
          stock.date_derniere_entree, stock.date_derniere_sortie,
          stock.valeur_stock || 0, stock.actif, stock.created_at,
          stock.updated_at, stock.deleted_at, stock.version,
          stock.created_by_id, stock.updated_by_id
        ])
      }
    }
  }

  private async migrateCommandes(companyId: string): Promise<void> {
    const commandes = await this.currentDataSource.query(`
      SELECT * FROM commandes WHERE deleted_at IS NULL
    `)
    
    console.log(`   📊 Migration de ${commandes.length} commandes...`)
    
    for (const commande of commandes) {
      await this.tenantDataSource.query(`
        INSERT INTO commandes (
          id, societe_id, client_id, numero, date_commande, date_livraison_prevue,
          statut, montant_ht, montant_tva, montant_ttc, notes,
          created_at, updated_at, deleted_at, version, created_by_id, updated_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        commande.id, companyId, commande.client_id, commande.numero,
        commande.date_commande, commande.date_livraison_prevue,
        commande.statut || 'BROUILLON', commande.montant_ht || 0,
        commande.montant_tva || 0, commande.montant_ttc || 0,
        commande.notes, commande.created_at, commande.updated_at,
        commande.deleted_at, commande.version, commande.created_by_id,
        commande.updated_by_id
      ])
    }
  }

  /**
   * Processus complet de migration
   */
  async runFullMigration(): Promise<void> {
    console.log('🚀 DÉMARRAGE DE LA MIGRATION MULTI-TENANT')
    console.log('=' + '='.repeat(59))
    
    try {
      // 1. Connexions
      await this.initializeConnections()
      
      // 2. Création des bases
      await this.createDatabases()
      
      // 3. Migrations des schémas
      await this.runMigrations()
      
      // 4. Migration des utilisateurs
      await this.migrateUsers()
      
      // 5. Création société par défaut
      const companyId = await this.createDefaultCompany()
      
      // 6. Association utilisateurs-société
      await this.associateUsersToCompany(companyId)
      
      // 7. Migration données métier
      await this.migrateBusinessData(companyId)
      
      console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS!')
      console.log('📊 Résumé:')
      console.log('   ✓ Base AUTH créée et peuplée')
      console.log('   ✓ Base SHARED créée')
      console.log('   ✓ Base TENANT créée et peuplée')
      console.log('   ✓ Société TopSteel configurée')
      console.log('   ✓ Utilisateurs migrés et associés')
      
    } catch (error) {
      console.error('\n💥 ERREUR LORS DE LA MIGRATION')
      console.error('Erreur:', error)
      throw error
    } finally {
      await this.closeConnections()
    }
  }
}

// Exécution du script
if (require.main === module) {
  const migration = new MigrationService()
  migration.runFullMigration()
    .then(() => {
      console.log('\n✅ Migration terminée avec succès!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Échec de la migration:', error)
      process.exit(1)
    })
}

export { MigrationService }