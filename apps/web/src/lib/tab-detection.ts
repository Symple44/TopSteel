/**
 * Utilitaires pour détecter et gérer les onglets multiples
 */

/**
 * Détecte s'il y a d'autres onglets ouverts avec la même application
 * Utilise une combinaison de BroadcastChannel et localStorage
 */
export function detectMultipleTabs(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    const channel = new BroadcastChannel('topsteel-tab-detection')
    const tabId = `tab_${Date.now()}_${Math.random()}`
    let hasResponse = false

    // Écouter les réponses d'autres onglets
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TAB_PING_RESPONSE') {
        hasResponse = true
        channel.close()
        resolve(true)
      }
    }

    // Envoyer un ping pour détecter d'autres onglets
    const sendPing = () => {
      channel.postMessage({
        type: 'TAB_PING',
        tabId,
        timestamp: Date.now()
      })
    }

    // Répondre aux pings d'autres onglets
    const handlePing = (event: MessageEvent) => {
      if (event.data.type === 'TAB_PING' && event.data.tabId !== tabId) {
        channel.postMessage({
          type: 'TAB_PING_RESPONSE',
          originalTabId: event.data.tabId,
          responderTabId: tabId,
          timestamp: Date.now()
        })
      }
    }

    channel.addEventListener('message', handleMessage)
    channel.addEventListener('message', handlePing)

    // Envoyer le ping
    sendPing()

    // Attendre 500ms pour les réponses
    setTimeout(() => {
      channel.removeEventListener('message', handleMessage)
      channel.removeEventListener('message', handlePing)
      
      if (!hasResponse) {
        channel.close()
        resolve(false)
      }
    }, 500)
  })
}

/**
 * Compte approximativement le nombre d'onglets ouverts
 * Utilise sessionStorage pour tracker les onglets actifs
 */
export function getApproximateTabCount(): number {
  if (typeof window === 'undefined') return 0

  try {
    // Générer un ID unique pour cet onglet s'il n'existe pas
    if (!sessionStorage.getItem('tab-id')) {
      sessionStorage.setItem('tab-id', `tab_${Date.now()}_${Math.random()}`)
    }

    // Récupérer la liste des onglets actifs depuis localStorage
    const activeTabsData = localStorage.getItem('topsteel-active-tabs')
    const activeTabs = activeTabsData ? JSON.parse(activeTabsData) : {}
    
    // Nettoyer les onglets inactifs (plus de 30 secondes)
    const now = Date.now()
    const cleanedTabs = Object.fromEntries(
      Object.entries(activeTabs).filter(
        ([_, timestamp]) => now - (timestamp as number) < 30000
      )
    )

    // Ajouter/mettre à jour cet onglet
    const currentTabId = sessionStorage.getItem('tab-id')!
    cleanedTabs[currentTabId] = now

    // Sauvegarder la liste mise à jour
    localStorage.setItem('topsteel-active-tabs', JSON.stringify(cleanedTabs))

    return Object.keys(cleanedTabs).length
  } catch (error) {
    console.warn('Erreur lors du comptage des onglets:', error)
    return 1
  }
}

/**
 * Nettoie les données de détection d'onglets au fermeture
 */
export function cleanupTabDetection(): void {
  if (typeof window === 'undefined') return

  try {
    const currentTabId = sessionStorage.getItem('tab-id')
    if (currentTabId) {
      const activeTabsData = localStorage.getItem('topsteel-active-tabs')
      if (activeTabsData) {
        const activeTabs = JSON.parse(activeTabsData)
        delete activeTabs[currentTabId]
        localStorage.setItem('topsteel-active-tabs', JSON.stringify(activeTabs))
      }
    }
  } catch (error) {
    console.warn('Erreur lors du nettoyage de détection d\'onglets:', error)
  }
}

/**
 * Hook pour nettoyer automatiquement à la fermeture
 */
export function useTabCleanup(): void {
  if (typeof window === 'undefined') return

  // Nettoyer à la fermeture de l'onglet (unload est deprecated)
  window.addEventListener('beforeunload', cleanupTabDetection)
  window.addEventListener('pagehide', cleanupTabDetection)

  // Nettoyer aussi quand l'onglet devient inactif
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // Marquer comme potentiellement fermé après 5 minutes d'inactivité
      setTimeout(() => {
        if (document.visibilityState === 'hidden') {
          cleanupTabDetection()
        }
      }, 5 * 60 * 1000)
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

/**
 * Fonction pour nettoyer les event listeners
 */
export function removeTabCleanup(): void {
  if (typeof window === 'undefined') return
  
  window.removeEventListener('beforeunload', cleanupTabDetection)
  window.removeEventListener('pagehide', cleanupTabDetection)
}