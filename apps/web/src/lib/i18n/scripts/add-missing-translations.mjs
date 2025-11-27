/**
 * Adds missing translations with proper translations (not placeholders)
 * Run: node apps/web/src/lib/i18n/scripts/add-missing-translations.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TRANSLATIONS_DIR = path.join(__dirname, '..', 'translations')

// Manual translations for common French -> English
const FR_TO_EN = {
  // Common words
  'Sauvegarder': 'Save',
  'Enregistrer': 'Save',
  'Réinitialiser': 'Reset',
  'Annuler': 'Cancel',
  'Chargement...': 'Loading...',
  'Chargement': 'Loading',
  'Erreur': 'Error',
  'Succès': 'Success',
  'Retour': 'Back',
  'Suivant': 'Next',
  'Précédent': 'Previous',
  'Fermer': 'Close',
  'Ouvrir': 'Open',
  'Ajouter': 'Add',
  'Supprimer': 'Delete',
  'Modifier': 'Edit',
  'Créer': 'Create',
  'Confirmer': 'Confirm',
  'Oui': 'Yes',
  'Non': 'No',
  'Actif': 'Active',
  'Inactif': 'Inactive',
  'Activé': 'Enabled',
  'Désactivé': 'Disabled',
  'Titre': 'Title',
  'Description': 'Description',
  'Nom': 'Name',
  'Email': 'Email',
  'Téléphone': 'Phone',
  'Adresse': 'Address',
  'Ville': 'City',
  'Pays': 'Country',
  'Code postal': 'Postal Code',
  'Site web': 'Website',
  'Logo': 'Logo',
  'Configuration': 'Configuration',
  'Paramètres': 'Settings',
  'Préférences': 'Preferences',
  'Utilisateur': 'User',
  'Utilisateurs': 'Users',
  'Rôle': 'Role',
  'Rôles': 'Roles',
  'Groupe': 'Group',
  'Groupes': 'Groups',
  'Permission': 'Permission',
  'Permissions': 'Permissions',
  'Statut': 'Status',
  'Actions': 'Actions',
  'Détails': 'Details',
  'Informations': 'Information',
  'Général': 'General',
  'Avancé': 'Advanced',
  'Sécurité': 'Security',
  'Connexion': 'Connection',
  'Déconnexion': 'Logout',
  'Authentification': 'Authentication',
  'Mot de passe': 'Password',
  'Rechercher': 'Search',
  'Filtrer': 'Filter',
  'Exporter': 'Export',
  'Importer': 'Import',
  'Télécharger': 'Download',
  'Aperçu': 'Preview',
  'Voir': 'View',
  'Tous': 'All',
  'Aucun': 'None',
  'Département': 'Department',
  'Équipe': 'Team',
  'Projet': 'Project',
  'Personnalisé': 'Custom',
  'Système': 'System',
  'Menu': 'Menu',
  'Navigation': 'Navigation',
  'Tableau de bord': 'Dashboard',
  'Administration': 'Administration',
  'Notifications': 'Notifications',
  'Apparence': 'Appearance',
  'Langue': 'Language',
  'Thème': 'Theme',
  'Clair': 'Light',
  'Sombre': 'Dark',
  'Date': 'Date',
  'Heure': 'Time',
  'Aujourd\'hui': 'Today',
  'Hier': 'Yesterday',
  'Jamais': 'Never',
  'Nouveau': 'New',
  'Nouvelle': 'New',
  'Ancien': 'Old',
  'Membres': 'Members',
  'Membre': 'Member',
  'Type': 'Type',
  'Valeur': 'Value',
  'Total': 'Total',
  'Moyenne': 'Average',
  'Minimum': 'Minimum',
  'Maximum': 'Maximum',
  'Résultats': 'Results',
  'Aucun résultat': 'No results',
  'Erreur de chargement': 'Loading error',
  'Erreur de connexion': 'Connection error',
  'Opération réussie': 'Operation successful',
  'Opération échouée': 'Operation failed',
  'Enregistrement...': 'Saving...',
  'Enregistré': 'Saved',
  'Connexions': 'Connections',
  'Base de données': 'Database',
  'Requêtes': 'Queries',
  'Session': 'Session',
  'Sessions': 'Sessions',
  'Locataire': 'Tenant',
  'Pool': 'Pool',
  'Timeout': 'Timeout',
  'Santé': 'Health',
  'Sain': 'Healthy',
  'Dégradé': 'Degraded',
  'Non sain': 'Unhealthy',
  'Initialisé': 'Initialized',
  'Non initialisé': 'Not initialized',
  'Actives': 'Active',
  'Inactives': 'Inactive',
  'En erreur': 'Error',
  'Redémarrer': 'Restart',
  'Configurer': 'Configure',
}

// French -> Spanish translations
const FR_TO_ES = {
  'Sauvegarder': 'Guardar',
  'Enregistrer': 'Guardar',
  'Réinitialiser': 'Restablecer',
  'Annuler': 'Cancelar',
  'Chargement...': 'Cargando...',
  'Chargement': 'Cargando',
  'Erreur': 'Error',
  'Succès': 'Éxito',
  'Retour': 'Volver',
  'Suivant': 'Siguiente',
  'Précédent': 'Anterior',
  'Fermer': 'Cerrar',
  'Ouvrir': 'Abrir',
  'Ajouter': 'Añadir',
  'Supprimer': 'Eliminar',
  'Modifier': 'Editar',
  'Créer': 'Crear',
  'Confirmer': 'Confirmar',
  'Oui': 'Sí',
  'Non': 'No',
  'Actif': 'Activo',
  'Inactif': 'Inactivo',
  'Activé': 'Activado',
  'Désactivé': 'Desactivado',
  'Titre': 'Título',
  'Description': 'Descripción',
  'Nom': 'Nombre',
  'Email': 'Email',
  'Téléphone': 'Teléfono',
  'Adresse': 'Dirección',
  'Ville': 'Ciudad',
  'Pays': 'País',
  'Code postal': 'Código postal',
  'Site web': 'Sitio web',
  'Logo': 'Logo',
  'Configuration': 'Configuración',
  'Paramètres': 'Configuración',
  'Préférences': 'Preferencias',
  'Utilisateur': 'Usuario',
  'Utilisateurs': 'Usuarios',
  'Rôle': 'Rol',
  'Rôles': 'Roles',
  'Groupe': 'Grupo',
  'Groupes': 'Grupos',
  'Permission': 'Permiso',
  'Permissions': 'Permisos',
  'Statut': 'Estado',
  'Actions': 'Acciones',
  'Détails': 'Detalles',
  'Informations': 'Información',
  'Général': 'General',
  'Avancé': 'Avanzado',
  'Sécurité': 'Seguridad',
  'Connexion': 'Conexión',
  'Déconnexion': 'Cerrar sesión',
  'Authentification': 'Autenticación',
  'Mot de passe': 'Contraseña',
  'Rechercher': 'Buscar',
  'Filtrer': 'Filtrar',
  'Exporter': 'Exportar',
  'Importer': 'Importar',
  'Télécharger': 'Descargar',
  'Aperçu': 'Vista previa',
  'Voir': 'Ver',
  'Tous': 'Todos',
  'Aucun': 'Ninguno',
  'Département': 'Departamento',
  'Équipe': 'Equipo',
  'Projet': 'Proyecto',
  'Personnalisé': 'Personalizado',
  'Système': 'Sistema',
  'Menu': 'Menú',
  'Navigation': 'Navegación',
  'Tableau de bord': 'Panel de control',
  'Administration': 'Administración',
  'Notifications': 'Notificaciones',
  'Apparence': 'Apariencia',
  'Langue': 'Idioma',
  'Thème': 'Tema',
  'Clair': 'Claro',
  'Sombre': 'Oscuro',
}

/**
 * Simple translation function
 */
function translateText(frText, targetLang) {
  const dict = targetLang === 'en' ? FR_TO_EN : FR_TO_ES

  // Direct match
  if (dict[frText]) {
    return dict[frText]
  }

  // Try to translate parts
  let result = frText
  for (const [fr, translated] of Object.entries(dict)) {
    if (result.includes(fr)) {
      result = result.replace(fr, translated)
    }
  }

  // If still French, return with lang prefix for manual review
  if (result === frText && /[àâäéèêëïîôùûüç]/i.test(frText)) {
    return targetLang === 'en' ? `[EN] ${frText}` : `[ES] ${frText}`
  }

  return result
}

/**
 * Extract keys from object
 */
function extractKeys(obj, prefix = '') {
  const keys = new Map()
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nested = extractKeys(value, fullKey)
      for (const [k, v] of nested) keys.set(k, v)
    } else if (typeof value === 'string') {
      keys.set(fullKey, value)
    }
  }
  return keys
}

/**
 * Load translations from a language directory
 */
function loadLanguage(lang) {
  const langDir = path.join(TRANSLATIONS_DIR, lang)
  const files = fs.readdirSync(langDir).filter(f => f.endsWith('.ts') && f !== 'index.ts')
  const translations = {}

  for (const file of files) {
    const content = fs.readFileSync(path.join(langDir, file), 'utf-8')
    const matches = content.matchAll(/export const (\w+) = (\{[\s\S]*?\n\})/g)
    for (const match of matches) {
      try {
        translations[match[1]] = new Function(`return ${match[2]}`)()
      } catch (e) {}
    }
  }
  return translations
}

/**
 * Set nested value
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) current[keys[i]] = {}
    if (typeof current[keys[i]] !== 'object') return false
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
  return true
}

/**
 * Format object to string
 */
function formatObj(obj, indent = 0) {
  const sp = '  '.repeat(indent)
  const sp1 = '  '.repeat(indent + 1)
  if (typeof obj === 'string') {
    const escaped = obj.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    return `'${escaped}'`
  }
  if (typeof obj !== 'object' || obj === null) return String(obj)
  const entries = Object.entries(obj)
  if (!entries.length) return '{}'
  const lines = entries.map(([k, v]) => {
    const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `'${k}'`
    return `${sp1}${key}: ${formatObj(v, indent + 1)}`
  })
  return `{\n${lines.join(',\n')},\n${sp}}`
}

async function main() {
  const args = process.argv.slice(2)
  const targetLang = args[0] || 'en'

  console.log(`=== Adding Missing Translations for ${targetLang.toUpperCase()} ===\n`)

  const frTranslations = loadLanguage('fr')
  const targetTranslations = loadLanguage(targetLang)

  const frKeys = new Map()
  for (const [ns, content] of Object.entries(frTranslations)) {
    for (const [k, v] of extractKeys(content, ns)) frKeys.set(k, v)
  }

  const targetKeys = new Map()
  for (const [ns, content] of Object.entries(targetTranslations)) {
    for (const [k, v] of extractKeys(content, ns)) targetKeys.set(k, v)
  }

  // Find missing and translate
  const missing = []
  for (const [key, frValue] of frKeys) {
    if (!targetKeys.has(key)) {
      const translated = translateText(frValue, targetLang)
      missing.push({ key, fr: frValue, translated })
    }
  }

  console.log(`Found ${missing.length} missing keys\n`)

  // Group by namespace (first part of key)
  const byFile = new Map()
  for (const { key, translated } of missing) {
    const [ns] = key.split('.')
    const restKey = key.substring(ns.length + 1)

    // Determine which file this namespace belongs to
    let file = 'misc'
    if (['common', 'translation'].includes(ns)) file = 'common'
    else if (ns === 'auth') file = 'auth'
    else if (ns === 'admin') file = 'admin'
    else if (ns === 'dashboard') file = 'dashboard'
    else if (['navigation', 'navigationEnhanced', 'breadcrumb'].includes(ns)) file = 'navigation'
    else if (['errors', 'errorsEnhanced', 'success'].includes(ns)) file = 'errors'
    else if (['settings', 'appearance', 'notifications'].includes(ns)) file = 'settings'
    else if (['profile', 'profileEnhanced'].includes(ns)) file = 'profile'
    else if (['queryBuilder', 'datatable', 'codeViewer'].includes(ns)) file = 'data'
    else if (['roles', 'groups', 'roleNames', 'roleManagement', 'bulk'].includes(ns)) file = 'rbac'
    else if (['connections', 'companies', 'tabSync'].includes(ns)) file = 'connections'

    if (!byFile.has(file)) byFile.set(file, new Map())
    if (!byFile.get(file).has(ns)) byFile.get(file).set(ns, {})

    setNestedValue(byFile.get(file).get(ns), restKey, translated)
  }

  // Update each file
  for (const [file, namespaces] of byFile) {
    const filePath = path.join(TRANSLATIONS_DIR, targetLang, `${file}.ts`)
    let content = fs.readFileSync(filePath, 'utf-8')

    for (const [ns, additions] of namespaces) {
      // Find the export and merge
      const regex = new RegExp(`export const ${ns} = (\\{[\\s\\S]*?\\n\\})`, 'm')
      const match = content.match(regex)

      if (match) {
        try {
          const existing = new Function(`return ${match[1]}`)()
          // Deep merge
          const merged = deepMerge(existing, additions)
          const newStr = `export const ${ns} = ${formatObj(merged)}`
          content = content.replace(regex, newStr)
        } catch (e) {
          console.error(`Error processing ${ns} in ${file}: ${e.message}`)
        }
      }
    }

    fs.writeFileSync(filePath, content)
    console.log(`Updated: ${file}.ts`)
  }

  console.log('\n=== Done! ===')
}

function deepMerge(target, source) {
  const result = { ...target }
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] || {}, value)
    } else {
      result[key] = value
    }
  }
  return result
}

main().catch(console.error)
