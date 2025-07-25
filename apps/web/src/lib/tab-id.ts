/**
 * Module pour gérer l'identifiant unique de l'onglet
 * Cet ID est partagé entre tous les composants d'un même onglet
 */

// Générer un ID unique pour cet onglet
const generateTabId = () => {
  if (typeof window === 'undefined') {
    return 'server'
  }
  
  // Vérifier d'abord si on a déjà un ID dans sessionStorage
  const existingId = sessionStorage.getItem('topsteel-tab-id')
  if (existingId) {
    return existingId
  }
  
  // Sinon, générer un nouvel ID
  const newId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  sessionStorage.setItem('topsteel-tab-id', newId)
  return newId
}

// Export d'une instance unique de l'ID
export const TAB_ID = generateTabId()

// Fonction pour obtenir l'ID (utile si on veut le récupérer après le chargement initial)
export const getTabId = () => TAB_ID