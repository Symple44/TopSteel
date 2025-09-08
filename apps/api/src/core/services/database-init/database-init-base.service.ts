import { Injectable, Logger } from '@nestjs/common'
import type { DataSource } from 'typeorm'
import { INIT_DATA } from './database-init-data'

@Injectable()
export class DatabaseInitBaseService {
  protected readonly logger = new Logger(DatabaseInitBaseService.name)

  constructor(protected readonly dataSource: DataSource) {}

  /**
   * Vérifie si la base de données est connectée
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1')
      return true
    } catch (_error) {
      return false
    }
  }

  /**
   * Initialise les énums PostgreSQL
   */
  async initializeEnums(): Promise<void> {
    try {
      for (const enumDef of INIT_DATA.enums) {
        const enumExists = await this.dataSource.query(
          `
          SELECT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = $1
          );
        `,
          [enumDef.name]
        )

        if (enumExists[0]?.exists) {
          // Vérifier si toutes les valeurs existent
          const enumValues = await this.dataSource.query(
            `
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (
              SELECT oid 
              FROM pg_type 
              WHERE typname = $1
            )
          `,
            [enumDef.name]
          )

          const existingValues = enumValues.map((row: { enumlabel: string }) => row.enumlabel)

          for (const value of enumDef.values) {
            if (!existingValues.includes(value)) {
              await this.dataSource.query(`ALTER TYPE ${enumDef.name} ADD VALUE '${value}'`)
              this.logger.log(`Valeur '${value}' ajoutée à l'enum ${enumDef.name}`)
            }
          }
        } else {
          const values = enumDef.values.map((v) => `'${v}'`).join(', ')
          await this.dataSource.query(`
            CREATE TYPE ${enumDef.name} AS ENUM (${values});
          `)
          this.logger.log(`Enum ${enumDef.name} créé`)
        }
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'initialisation des énums:", error)
    }
  }

  /**
   * Initialise les modules système
   */
  async initializeModules(): Promise<void> {
    try {
      const moduleCount = await this.dataSource.query(`
        SELECT COUNT(*) as count FROM modules
      `)

      if (parseInt(moduleCount[0]?.count || '0', 10) === 0) {
        this.logger.log('Création des modules système...')

        for (const module of INIT_DATA.modules) {
          await this.dataSource.query(
            `
            INSERT INTO modules (name, description, category, icon, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (name) DO NOTHING
          `,
            [module.name, module.description, module.category, module.icon, true]
          )
        }

        this.logger.log('Modules système créés')
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'initialisation des modules:", error)
    }
  }

  /**
   * Initialise les permissions système
   */
  async initializePermissions(): Promise<void> {
    try {
      const permissionCount = await this.dataSource.query(`
        SELECT COUNT(*) as count FROM permissions
      `)

      if (parseInt(permissionCount[0]?.count || '0', 10) === 0) {
        this.logger.log('Création des permissions système...')

        // Permissions de base pour tous les modules
        await this.dataSource.query(`
          INSERT INTO permissions (module_id, action, name, description, level, is_required, created_at, updated_at)
          SELECT m.id, 'view', 'Voir les ' || LOWER(m.name), 'Consulter les données du module', 'READ', true, NOW(), NOW()
          FROM modules m
        `)

        // Permissions WRITE pour modules BUSINESS et CORE
        await this.dataSource.query(`
          INSERT INTO permissions (module_id, action, name, description, level, is_required, created_at, updated_at)
          SELECT m.id, 'create', 'Créer dans ' || LOWER(m.name), 'Créer de nouvelles données', 'WRITE', false, NOW(), NOW()
          FROM modules m
          WHERE m.category IN ('BUSINESS', 'CORE')
        `)

        await this.dataSource.query(`
          INSERT INTO permissions (module_id, action, name, description, level, is_required, created_at, updated_at)
          SELECT m.id, 'update', 'Modifier dans ' || LOWER(m.name), 'Modifier les données existantes', 'WRITE', false, NOW(), NOW()
          FROM modules m
          WHERE m.category IN ('BUSINESS', 'CORE')
        `)

        await this.dataSource.query(`
          INSERT INTO permissions (module_id, action, name, description, level, is_required, created_at, updated_at)
          SELECT m.id, 'delete', 'Supprimer dans ' || LOWER(m.name), 'Supprimer les données', 'DELETE', false, NOW(), NOW()
          FROM modules m
          WHERE m.category IN ('BUSINESS', 'CORE')
        `)

        this.logger.log('Permissions système créées')
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'initialisation des permissions:", error)
    }
  }

  /**
   * Initialise les rôles système
   */
  async initializeRoles(): Promise<void> {
    try {
      const roleCount = await this.dataSource.query(`
        SELECT COUNT(*) as count FROM roles
      `)

      if (parseInt(roleCount[0]?.count || '0', 10) === 0) {
        this.logger.log('Création des rôles système...')

        for (const role of INIT_DATA.roles) {
          await this.dataSource.query(
            `
            INSERT INTO roles (name, description, is_system_role, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT (name) DO NOTHING
          `,
            [role.name, role.description, role.is_system_role, true]
          )
        }

        this.logger.log('Rôles système créés')
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'initialisation des rôles:", error)
    }
  }

  /**
   * Initialise les groupes par défaut
   */
  async initializeGroups(): Promise<void> {
    try {
      const groupCount = await this.dataSource.query(`
        SELECT COUNT(*) as count FROM groups
      `)

      if (parseInt(groupCount[0]?.count || '0', 10) === 0) {
        this.logger.log('Création des groupes par défaut...')

        for (const group of INIT_DATA.groups) {
          await this.dataSource.query(
            `
            INSERT INTO groups (name, description, type, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT (name) DO NOTHING
          `,
            [group.name, group.description, group.type, true]
          )
        }

        // Associer les rôles aux groupes
        for (const group of INIT_DATA.groups) {
          if (group.roles && group.roles.length > 0) {
            for (const roleName of group.roles) {
              await this.dataSource.query(
                `
                INSERT INTO group_roles (group_id, role_id, created_at)
                SELECT g.id, r.id, NOW()
                FROM groups g, roles r
                WHERE g.name = $1 AND r.name = $2
                ON CONFLICT (group_id, role_id) DO NOTHING
              `,
                [group.name, roleName]
              )
            }
          }
        }

        this.logger.log('Groupes par défaut créés')
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'initialisation des groupes:", error)
    }
  }

  /**
   * Initialise les paramètres système
   */
  async initializeSystemParameters(): Promise<void> {
    try {
      const paramCount = await this.dataSource.query(`
        SELECT COUNT(*) as count FROM system_parameters
      `)

      if (parseInt(paramCount[0]?.count || '0', 10) === 0) {
        this.logger.log('Création des paramètres système...')

        for (const param of INIT_DATA.systemParameters) {
          await this.dataSource.query(
            `
            INSERT INTO system_parameters (key, value, description, type, category, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (key) DO NOTHING
          `,
            [param.key, param.value, param.description, param.type, param.category]
          )
        }

        this.logger.log('Paramètres système créés')
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'initialisation des paramètres système:", error)
    }
  }

  /**
   * Vérifie si une table existe et a des données
   */
  async tableHasData(tableName: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = $1
        ) as table_exists,
        (
          SELECT COUNT(*) 
          FROM ${tableName}
        ) as row_count
      `,
        [tableName]
      )

      return result[0]?.table_exists && parseInt(result[0]?.row_count || '0', 10) > 0
    } catch (_error) {
      return false
    }
  }
}
