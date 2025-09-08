import { exec } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils'

const execAsync = promisify(exec)

interface BackupInfo {
  id: string
  filename: string
  createdAt: string
  size: string
  type: 'manual' | 'scheduled'
  status: 'completed' | 'in-progress' | 'failed'
  filePath?: string
}

@Injectable()
export class DatabaseBackupService {
  private readonly backupDir = path.join(process.cwd(), 'backups')

  constructor(@InjectDataSource('auth') private _dataSource: DataSource) {
    this.ensureBackupDir()
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    try {
      const files = fs.readdirSync(this.backupDir)
      const backups: BackupInfo[] = []

      for (const file of files) {
        if (file.endsWith('.sql') || file.endsWith('.sql.gz')) {
          const filePath = path.join(this.backupDir, file)
          const stats = fs.statSync(filePath)

          backups.push({
            id: file.replace(/\.(sql|sql\.gz)$/, ''),
            filename: file,
            createdAt: stats.mtime.toISOString(),
            size: this.formatBytes(stats.size),
            type: file.includes('scheduled') ? 'scheduled' : 'manual',
            status: 'completed',
            filePath,
          })
        }
      }

      return backups.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } catch (_error) {
      return []
    }
  }

  async createBackup(
    options: { type?: string; compress?: boolean; includeMedia?: boolean } = {}
  ): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupType = options.type || 'manual'
      const filename = `backup_${backupType}_${timestamp}.sql${options.compress ? '.gz' : ''}`
      const filePath = path.join(this.backupDir, filename)

      // Récupérer les informations de connexion
      const connectionOptions = this._dataSource.options

      if (connectionOptions.type !== 'postgres') {
        throw new Error('Ce service ne supporte que PostgreSQL')
      }

      const pgOptions = connectionOptions as unknown
      const pgDumpCommand = [
        'pg_dump',
        `-h ${pgOptions.host}`,
        `-p ${pgOptions.port}`,
        `-U ${pgOptions.username}`,
        `-d ${pgOptions.database}`,
        '--no-password',
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
      ]

      let command = pgDumpCommand.join(' ')

      if (options.compress) {
        command += ` | gzip > "${filePath}"`
      } else {
        command += ` > "${filePath}"`
      }

      // Configurer les variables d'environnement
      const env = {
        ...process.env,
        PGPASSWORD: pgOptions.password as string,
      }

      await execAsync(command, { env: env as Record<string, string> })

      // Vérifier que le fichier a été créé
      if (!fs.existsSync(filePath)) {
        throw new Error("Le fichier de sauvegarde n'a pas été créé")
      }

      const stats = fs.statSync(filePath)

      return {
        success: true,
        message: 'Sauvegarde créée avec succès',
        data: {
          id: filename.replace(/\.(sql|sql\.gz)$/, ''),
          filename,
          size: this.formatBytes(stats.size),
          downloadUrl: `/api/admin/database/backups/${filename.replace(/\.(sql|sql\.gz)$/, '')}/download`,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de la création de la sauvegarde: ${error instanceof Error ? getErrorMessage(error) : 'Erreur inconnue'}`,
      }
    }
  }

  async restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    try {
      const backups = await this.listBackups()
      const backup = backups.find((b) => b.id === backupId)

      if (!backup || !backup.filePath) {
        return {
          success: false,
          message: 'Sauvegarde non trouvée',
        }
      }

      const connectionOptions = this._dataSource.options as unknown
      const isCompressed = backup.filename.endsWith('.gz')

      let command: string
      if (isCompressed) {
        command = `gunzip -c "${backup.filePath}" | psql -h ${connectionOptions.host} -p ${connectionOptions.port} -U ${connectionOptions.username} -d ${connectionOptions.database}`
      } else {
        command = `psql -h ${connectionOptions.host} -p ${connectionOptions.port} -U ${connectionOptions.username} -d ${connectionOptions.database} -f "${backup.filePath}"`
      }

      const env = {
        ...process.env,
        PGPASSWORD: connectionOptions.password as string,
      }

      await execAsync(command, { env: env as Record<string, string> })

      return {
        success: true,
        message: 'Base de données restaurée avec succès',
      }
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de la restauration: ${error instanceof Error ? getErrorMessage(error) : 'Erreur inconnue'}`,
      }
    }
  }

  async deleteBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    try {
      const backups = await this.listBackups()
      const backup = backups.find((b) => b.id === backupId)

      if (!backup || !backup.filePath) {
        return {
          success: false,
          message: 'Sauvegarde non trouvée',
        }
      }

      fs.unlinkSync(backup.filePath)

      return {
        success: true,
        message: 'Sauvegarde supprimée avec succès',
      }
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de la suppression: ${error instanceof Error ? getErrorMessage(error) : 'Erreur inconnue'}`,
      }
    }
  }

  async downloadBackup(backupId: string): Promise<Record<string, unknown>> {
    const backups = await this.listBackups()
    const backup = backups.find((b) => b.id === backupId)

    if (!backup || !backup.filePath) {
      throw new Error('Sauvegarde non trouvée')
    }

    return {
      filePath: backup.filePath,
      filename: backup.filename,
      mimeType: backup.filename.endsWith('.gz') ? 'application/gzip' : 'application/sql',
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }
}
