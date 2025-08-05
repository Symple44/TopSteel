#!/usr/bin/env ts-node

import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

config()

async function checkUsersColumns() {
  const authDataSource = new DataSource(authDataSourceOptions)

  try {
    await authDataSource.initialize()
    console.log('✅ Connexion établie\n')

    // Récupérer toutes les colonnes de la table users
    const columns = await authDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)

    console.log('📋 Colonnes de la table users:')
    console.log('='.repeat(50))

    columns.forEach((col: any) => {
      console.log(
        `${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${col.is_nullable}`
      )
    })

    // Vérifier spécifiquement refreshToken
    const refreshTokenColumn = columns.find(
      (col: any) => col.column_name.toLowerCase() === 'refreshtoken'
    )

    console.log('\n' + '='.repeat(50))
    if (refreshTokenColumn) {
      console.log(`✅ Colonne refreshToken trouvée: ${refreshTokenColumn.column_name}`)
    } else {
      console.log('❌ Colonne refreshToken NON trouvée')
      console.log('\nColonnes contenant "refresh":')
      columns
        .filter((col: any) => col.column_name.toLowerCase().includes('refresh'))
        .forEach((col: any) => {
          console.log(`  - ${col.column_name}`)
        })
    }
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    if (authDataSource.isInitialized) {
      await authDataSource.destroy()
    }
  }
}

checkUsersColumns()
