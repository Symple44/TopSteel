#!/usr/bin/env ts-node

import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { authDataSourceOptions } from '../core/database/data-source-auth'

config()

async function checkUsersColumns() {
  const authDataSource = new DataSource(authDataSourceOptions)

  try {
    await authDataSource.initialize()

    // Récupérer toutes les colonnes de la table users
    const columns = await authDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)

    columns.forEach((_col: unknown) => {})

    // Vérifier spécifiquement refreshToken
    const refreshTokenColumn = columns.find(
      (col: unknown) =>
        (col as { column_name: string }).column_name.toLowerCase() === 'refreshtoken'
    )
    if (refreshTokenColumn) {
    } else {
      columns
        .filter((col: unknown) =>
          (col as { column_name: string }).column_name.toLowerCase().includes('refresh')
        )
        .forEach((_col: unknown) => {})
    }
  } catch (_error: unknown) {
  } finally {
    if (authDataSource.isInitialized) {
      await authDataSource.destroy()
    }
  }
}

checkUsersColumns()
