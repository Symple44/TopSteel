import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { getErrorMessage } from '../../../core/common/utils'

@Injectable()
export class DatabaseEnumFixService {
  constructor(private readonly prisma: PrismaService) {}

  async fixNotificationTypeEnum() {
    try {
      // Vérifier si l'enum existe et contient 'info'
      const enumValues = await this.prisma.$queryRawUnsafe<Array<{ enumlabel: string }>>(`
        SELECT enumlabel
        FROM pg_enum
        WHERE enumtypid = (
          SELECT oid
          FROM pg_type
          WHERE typname = 'notifications_type_enum'
        )
      `)

      const hasInfo = enumValues.some((row) => row.enumlabel === 'info')

      if (hasInfo) {
        return {
          success: true,
          message: "La valeur \"info\" existe déjà dans l'enum",
          enumValues: enumValues.map((row) => row.enumlabel),
        }
      } else {
        // Ajouter 'info' à l'enum
        await this.prisma.$queryRawUnsafe(`ALTER TYPE notifications_type_enum ADD VALUE 'info'`)
        return {
          success: true,
          message: "Valeur \"info\" ajoutée à l'enum notifications_type_enum",
          enumValues: [...enumValues.map((row) => row.enumlabel), 'info'],
        }
      }
    } catch (error) {
      // Si l'enum n'existe pas, le créer
      const errorMessage = error instanceof Error ? getErrorMessage(error) : getErrorMessage(error)
      if (errorMessage.includes('type "notifications_type_enum" does not exist')) {
        try {
          await this.prisma.$queryRawUnsafe(`
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
