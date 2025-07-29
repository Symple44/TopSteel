#!/usr/bin/env ts-node

/**
 * Script pour créer une association utilisateur-société par défaut
 * Usage: npx ts-node src/scripts/create-user-company-association.ts
 */

import { DataSource } from 'typeorm'
import { databaseConfig } from '../config/database.config'

async function createUserCompanyAssociation() {
  console.log('🔍 Création d\'association utilisateur-société...\n')

  // Configuration de la base auth
  const authDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_AUTH_NAME || 'topsteel_auth',
    synchronize: false,
    logging: false,
  })

  try {
    await authDataSource.initialize()
    console.log('✅ Connexion à la base auth établie')

    // Vérifier les utilisateurs sans société par défaut
    const usersWithoutCompany = await authDataSource.query(`
      SELECT u.id, u.email, u.nom, u.prenom
      FROM users u
      LEFT JOIN societe_users su ON u.id = su.userId AND su.isDefault = true
      WHERE su.userId IS NULL
      ORDER BY u.email
    `)

    console.log(`📊 ${usersWithoutCompany.length} utilisateurs sans société par défaut trouvés`)

    if (usersWithoutCompany.length === 0) {
      console.log('✅ Tous les utilisateurs ont déjà une société par défaut')
      return
    }

    // Afficher les utilisateurs
    console.log('\n👥 Utilisateurs sans société:')
    usersWithoutCompany.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.email} (${user.nom} ${user.prenom}) - ID: ${user.id}`)
    })

    // Vérifier les sociétés disponibles
    const societes = await authDataSource.query(`
      SELECT id, nom, code, actif
      FROM societes
      WHERE actif = true
      ORDER BY nom
    `)

    console.log(`\n🏢 ${societes.length} sociétés actives disponibles:`)
    societes.forEach((societe: any, index: number) => {
      console.log(`${index + 1}. ${societe.nom} (${societe.code}) - ID: ${societe.id}`)
    })

    if (societes.length === 0) {
      console.log('❌ Aucune société active trouvée. Création d\'une société par défaut...')
      
      // Créer une société par défaut
      const defaultSociete = await authDataSource.query(`
        INSERT INTO societes (nom, code, type, statut, actif, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, nom, code
      `, ['TopSteel Défaut', 'TOPSTEEL_DEFAULT', 'HOLDING', 'ACTIVE', true])

      console.log(`✅ Société par défaut créée: ${defaultSociete[0].nom} (ID: ${defaultSociete[0].id})`)
      
      // Associer tous les utilisateurs à cette société
      for (const user of usersWithoutCompany) {
        await authDataSource.query(`
          INSERT INTO societe_users (userId, societeId, role, actif, isDefault, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [user.id, defaultSociete[0].id, 'ADMIN', true, true])
        
        console.log(`✅ Utilisateur ${user.email} associé à la société par défaut`)
      }
    } else {
      // Associer à la première société active
      const defaultSocieteId = societes[0].id
      console.log(`\n🔗 Association des utilisateurs à la société: ${societes[0].nom}`)

      for (const user of usersWithoutCompany) {
        await authDataSource.query(`
          INSERT INTO societe_users (userId, societeId, role, actif, isDefault, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [user.id, defaultSocieteId, 'ADMIN', true, true])
        
        console.log(`✅ Utilisateur ${user.email} associé à ${societes[0].nom}`)
      }
    }

    // Vérifier le résultat
    const verification = await authDataSource.query(`
      SELECT u.email, s.nom as societe_nom, su.role, su.isDefault
      FROM users u
      JOIN societe_users su ON u.id = su.userId
      JOIN societes s ON su.societeId = s.id
      WHERE su.isDefault = true
      ORDER BY u.email
    `)

    console.log(`\n📋 Vérification - ${verification.length} associations par défaut:`)
    verification.forEach((assoc: any) => {
      console.log(`- ${assoc.email} → ${assoc.societe_nom} (${assoc.role})`)
    })

    console.log('\n🎉 Associations utilisateur-société créées avec succès!')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await authDataSource.destroy()
  }
}

// Exécuter le script
if (require.main === module) {
  createUserCompanyAssociation().catch(console.error)
}

export { createUserCompanyAssociation }