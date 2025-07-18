import { promises as fs } from 'fs'
import path from 'path'

const STORAGE_DIR = path.join(process.cwd(), '.storage')
const USER_PREFERENCES_FILE = 'user-menu-preferences.json'

export interface StoredPreferences {
  selectedPages: string[]
  menuOrder?: Record<string, number>
  customLabels?: Record<string, string>
  updatedAt: string
}

export class ServerStorage {
  private async ensureStorageDir() {
    try {
      await fs.access(STORAGE_DIR)
    } catch {
      await fs.mkdir(STORAGE_DIR, { recursive: true })
    }
  }

  async saveSelectedPages(selectedPages: string[]): Promise<void> {
    await this.ensureStorageDir()
    
    const filePath = path.join(STORAGE_DIR, USER_PREFERENCES_FILE)
    
    try {
      // Lire les préférences existantes
      let preferences: StoredPreferences
      try {
        const data = await fs.readFile(filePath, 'utf-8')
        preferences = JSON.parse(data)
      } catch {
        // Fichier n'existe pas, créer nouvelles préférences
        preferences = {
          selectedPages: [],
          updatedAt: new Date().toISOString()
        }
      }
      
      // Mettre à jour les pages sélectionnées
      preferences.selectedPages = selectedPages
      preferences.updatedAt = new Date().toISOString()
      
      // Sauvegarder
      await fs.writeFile(filePath, JSON.stringify(preferences, null, 2), 'utf-8')
      console.log('Pages sélectionnées sauvegardées:', selectedPages.length, 'pages')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des pages:', error)
      throw error
    }
  }

  async getSelectedPages(): Promise<string[]> {
    await this.ensureStorageDir()
    
    const filePath = path.join(STORAGE_DIR, USER_PREFERENCES_FILE)
    
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      const preferences: StoredPreferences = JSON.parse(data)
      return preferences.selectedPages || []
    } catch {
      // Retourner les pages par défaut si le fichier n'existe pas
      return ['dashboard', 'clients', 'projets', 'stocks', 'production']
    }
  }

  async getAllPreferences(): Promise<StoredPreferences> {
    await this.ensureStorageDir()
    
    const filePath = path.join(STORAGE_DIR, USER_PREFERENCES_FILE)
    
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch {
      // Retourner les préférences par défaut
      return {
        selectedPages: ['dashboard', 'clients', 'projets', 'stocks', 'production'],
        updatedAt: new Date().toISOString()
      }
    }
  }
}

// Instance singleton
export const serverStorage = new ServerStorage()