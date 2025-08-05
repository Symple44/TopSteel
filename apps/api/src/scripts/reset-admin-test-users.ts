#!/usr/bin/env ts-node

/**
 * Script de réinitialisation des utilisateurs ADMIN et TEST
 *
 * Ce script réinitialise les utilisateurs standards du système :
 * - admin@topsteel.tech (SUPER_ADMIN)
 * - test@topsteel.com (ADMIN)
 */

import * as bcrypt from 'bcrypt'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

config()

interface StandardUser {
  email: string
  nom: string
  prenom: string
  role: string
  actif: boolean
  password: string
  metadata: Record<string, any>
}

class AdminTestUsersResetter {
  private authDataSource: DataSource
  private standardUsers: StandardUser[] = [
    {
      email: 'admin@topsteel.tech',
      nom: 'Administrateur',
      prenom: 'Système',
      role: 'SUPER_ADMIN',
      actif: true,
      password: 'Admin@123!', // Mot de passe par défaut à changer
      metadata: {
        isSystemUser: true,
        resetRequired: true,
        createdBy: 'system-init',
        purpose: 'system-administration',
      },
    },
    {
      email: 'test@topsteel.com',
      nom: 'Test',
      prenom: 'Utilisateur',
      role: 'ADMIN',
      actif: true,
      password: 'Test@123!', // Mot de passe par défaut à changer
      metadata: {
        isTestUser: true,
        resetRequired: true,
        createdBy: 'system-init',
        purpose: 'testing',
      },
    },
  ]

  constructor() {
    this.authDataSource = new DataSource(authDataSourceOptions)
  }

  async resetUsers(): Promise<void> {
    console.log('🔄 Réinitialisation des utilisateurs ADMIN et TEST...\n')

    try {
      await this.authDataSource.initialize()
      console.log('✅ Connexion établie à la base AUTH\n')

      for (const userData of this.standardUsers) {
        await this.resetUser(userData)
      }

      console.log('\n✅ Réinitialisation terminée avec succès!')
      console.log('\n⚠️  IMPORTANT: Les mots de passe par défaut sont:')
      console.log('   - admin@topsteel.tech: Admin@123!')
      console.log('   - test@topsteel.com: Test@123!')
      console.log('\n🔐 Ces mots de passe doivent être changés lors de la première connexion.')
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error)
      throw error
    } finally {
      if (this.authDataSource.isInitialized) {
        await this.authDataSource.destroy()
      }
    }
  }

  private async resetUser(userData: StandardUser): Promise<void> {
    const queryRunner = this.authDataSource.createQueryRunner()

    try {
      console.log(`📝 Traitement de l'utilisateur: ${userData.email}`)

      // Vérifier si l'utilisateur existe
      const existingUser = await queryRunner.query(
        `SELECT id, email, role FROM users WHERE email = $1`,
        [userData.email]
      )

      const hashedPassword = await bcrypt.hash(userData.password, 10)

      if (existingUser.length > 0) {
        // Mettre à jour l'utilisateur existant
        const userId = existingUser[0].id

        await queryRunner.query(
          `
          UPDATE users 
          SET 
            nom = $2,
            prenom = $3,
            role = $4,
            actif = $5,
            password = $6,
            metadata = $7,
            updated_at = CURRENT_TIMESTAMP,
            "refreshToken" = NULL,
            dernier_login = NULL
          WHERE id = $1
        `,
          [
            userId,
            userData.nom,
            userData.prenom,
            userData.role,
            userData.actif,
            hashedPassword,
            JSON.stringify(userData.metadata),
          ]
        )

        console.log(`   ✅ Utilisateur mis à jour (ID: ${userId})`)

        // Supprimer toutes les sessions actives
        await queryRunner.query(`DELETE FROM user_sessions WHERE "userId" = $1`, [userId])
        console.log(`   🔐 Sessions supprimées`)

        // Supprimer les rôles société existants
        await queryRunner.query(`DELETE FROM user_societe_roles WHERE "userId" = $1`, [userId])
        console.log(`   🏢 Rôles société réinitialisés`)

        // Pour l'admin SUPER_ADMIN, s'assurer qu'il a accès à toutes les sociétés
        if (userData.role === 'SUPER_ADMIN') {
          await this.ensureSuperAdminAccess(queryRunner, userId)
        }
      } else {
        // Créer un nouvel utilisateur
        const result = await queryRunner.query(
          `
          INSERT INTO users (
            email,
            nom,
            prenom,
            role,
            actif,
            password,
            metadata,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `,
          [
            userData.email,
            userData.nom,
            userData.prenom,
            userData.role,
            userData.actif,
            hashedPassword,
            JSON.stringify(userData.metadata),
          ]
        )

        const userId = result[0].id
        console.log(`   ✅ Nouvel utilisateur créé (ID: ${userId})`)

        // Pour l'admin SUPER_ADMIN, s'assurer qu'il a accès à toutes les sociétés
        if (userData.role === 'SUPER_ADMIN') {
          await this.ensureSuperAdminAccess(queryRunner, userId)
        }
      }
    } catch (error) {
      console.error(`   ❌ Erreur pour ${userData.email}:`, error)
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  private async ensureSuperAdminAccess(queryRunner: any, userId: string): Promise<void> {
    // Récupérer toutes les sociétés actives
    const societes = await queryRunner.query(`
      SELECT id, nom FROM societes WHERE status = 'ACTIVE'
    `)

    if (societes.length > 0) {
      console.log(`   🏢 Attribution de l'accès à ${societes.length} société(s)`)

      // Récupérer le rôle ADMIN par défaut (ou créer si nécessaire)
      let adminRole = await queryRunner.query(`
        SELECT id FROM roles WHERE name = 'Administrateur' LIMIT 1
      `)

      if (adminRole.length === 0) {
        // Créer le rôle admin par défaut
        const roleResult = await queryRunner.query(`
          INSERT INTO roles (name, description, actif, "isSystemRole", created_at, updated_at)
          VALUES ('Administrateur', 'Rôle administrateur système', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `)
        adminRole = [{ id: roleResult[0].id }]
      }

      for (const societe of societes) {
        // Vérifier si l'association existe déjà
        const existing = await queryRunner.query(
          `
          SELECT id FROM user_societe_roles 
          WHERE "userId" = $1 AND "societeId" = $2
        `,
          [userId, societe.id]
        )

        if (existing.length === 0) {
          // Créer l'association
          await queryRunner.query(
            `
            INSERT INTO user_societe_roles ("userId", "societeId", "roleId", "isActive", "roleType", "isDefaultSociete", "additionalPermissions", "restrictedPermissions", "grantedAt", "metadata", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, true, 'SUPER_ADMIN', true, '{}', '{}', CURRENT_TIMESTAMP, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `,
            [userId, societe.id, adminRole[0].id]
          )
        }
      }
    }
  }
}

// Script d'aide pour afficher l'utilisation
function showUsage(): void {
  console.log(`
🔧 Script de réinitialisation des utilisateurs ADMIN et TEST

Ce script réinitialise les utilisateurs standards du système :
- admin@topsteel.tech (SUPER_ADMIN)
- test@topsteel.com (ADMIN)

Usage:
  ts-node apps/api/src/scripts/reset-admin-test-users.ts

Options:
  --help    Afficher cette aide

⚠️  ATTENTION: Ce script réinitialise les mots de passe !
`)
}

// Exécution du script
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help')) {
    showUsage()
    process.exit(0)
  }

  const resetter = new AdminTestUsersResetter()
  await resetter.resetUsers()
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
}

export { AdminTestUsersResetter }
