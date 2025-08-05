import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'

@Injectable()
export class DatabaseEnumFixService {
  constructor(
    @InjectDataSource('auth')
    private _dataSource: DataSource
  ) {}

  async fixNotificationTypeEnum() {
    try {
      // Vérifier si l'enum existe et contient 'info'
      const enumValues = await this._dataSource.query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'notifications_type_enum'
        )
      `)

      const hasInfo = enumValues.some((row: any) => row.enumlabel === 'info')

      if (hasInfo) {
        return {
          success: true,
          message: 'La valeur "info" existe déjà dans l\'enum',
          enumValues: enumValues.map((row: any) => row.enumlabel),
        }
      } else {
        // Ajouter 'info' à l'enum
        await this._dataSource.query(`ALTER TYPE notifications_type_enum ADD VALUE 'info'`)
        return {
          success: true,
          message: 'Valeur "info" ajoutée à l\'enum notifications_type_enum',
          enumValues: [...enumValues.map((row: any) => row.enumlabel), 'info'],
        }
      }
    } catch (error) {
      // Si l'enum n'existe pas, le créer
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('type "notifications_type_enum" does not exist')) {
        try {
          await this._dataSource.query(`
            CREATE TYPE notifications_type_enum AS ENUM ('info', 'warning', 'error', 'success')
          `)
          return {
            success: true,
            message: 'Enum notifications_type_enum créé avec succès',
            enumValues: ['info', 'warning', 'error', 'success'],
          }
        } catch (createError) {
          const createErrorMessage =
            createError instanceof Error ? createError.message : String(createError)
          return {
            success: false,
            message: "Erreur lors de la création de l'enum",
            error: createErrorMessage,
          }
        }
      }

      return {
        success: false,
        message: "Erreur lors de la correction de l'enum",
        error: errorMessage,
      }
    }
  }
}
