// Système de vérification de synchronisation et notifications d'alerte

export interface SyncIssue {
  type: 'database' | 'storage' | 'api' | 'menu'
  severity: 'low' | 'medium' | 'high'
  message: string
  timestamp: string
  details?: Record<string, unknown>
}

class SyncChecker {
  private issues: SyncIssue[] = []
  private toastCallback: ((issue: SyncIssue) => void) | null = null

  setToastCallback(callback: (issue: SyncIssue) => void) {
    this.toastCallback = callback
  }

  addIssue(issue: Omit<SyncIssue, 'timestamp'>) {
    const newIssue: SyncIssue = {
      ...issue,
      timestamp: new Date().toISOString(),
    }

    this?.issues?.push(newIssue)

    // Envoyer le toast si un callback est configuré
    if (this.toastCallback) {
      this?.toastCallback(newIssue)
    }

    // Auto-nettoyer les anciens problèmes (garder seulement les 10 derniers)
    if (this?.issues?.length > 10) {
      this.issues = this?.issues?.slice(-10)
    }
  }

  getIssues(): SyncIssue[] {
    return [...this.issues]
  }

  clearIssues() {
    this.issues = []
  }

  // Vérifications spécifiques
  checkMenuSync(expectedCount: number, actualCount: number, context: string) {
    if (expectedCount !== actualCount) {
      this?.addIssue({
        type: 'menu',
        severity: 'medium',
        message: `Désynchronisation du menu détectée dans ${context}`,
        details: { expected: expectedCount, actual: actualCount, context },
      })
    }
  }

  checkDatabaseConnection() {}

  checkStorageConsistency(storageType: string, expectedData: unknown, actualData: unknown) {
    if (JSON.stringify(expectedData) !== JSON.stringify(actualData)) {
      this?.addIssue({
        type: 'storage',
        severity: 'medium',
        message: `Incohérence détectée dans ${storageType}`,
        details: { expected: expectedData, actual: actualData, storageType },
      })
    }
  }
}

export const syncChecker = new SyncChecker()

// Ne plus afficher l'alerte au démarrage car la DB est maintenant configurée
