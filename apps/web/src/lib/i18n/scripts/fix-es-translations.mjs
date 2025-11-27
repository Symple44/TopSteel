/**
 * Fix Spanish translations - replace French text and [ES] markers
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ES_DIR = path.join(__dirname, '..', 'translations', 'es')

// Replacements map: French with [ES] -> Spanish
const REPLACEMENTS = {
  // admin.ts
  "[ES] Êtes-vous sûr de vouloir activer cette configuration ? La configuration actuelle sera désactivée.": "¿Está seguro de que desea activar esta configuración? La configuración actual se desactivará.",
  "[ES] Commencez par créer une nouvelle configuration de menu ou utilisez le menu par défaut.": "Comience creando una nueva configuración de menú o use el menú predeterminado.",
  "[ES] Créé le": "Creado el",
  "[ES] Modifié le": "Modificado el",
  "[ES] Création...": "Creando...",
  "[ES] L\\'éditeur de menu avancé sera disponible dans une prochaine version.": "El editor de menú avanzado estará disponible en una próxima versión.",
  "[ES] Ajoutez des éléments via l\\'éditeur de configuration": "Añada elementos a través del editor de configuración",
  "[ES] Décrivez cette configuration...": "Describa esta configuración...",
  "[ES] Ajoutez votre premier élément de menu": "Añada su primer elemento de menú",
  "[ES] Nouvel élément": "Nuevo elemento",
  "[ES] Gérez les utilisateurs, les permissions, les configurations et les paramètres système": "Gestione usuarios, permisos, configuraciones y ajustes del sistema",

  // common.ts
  "[ES] Sélectionner une société": "Seleccionar una empresa",
  "[ES] Impossible de charger les sociétés disponibles": "No se pudieron cargar las empresas disponibles",
  "[ES] Société non trouvée": "Empresa no encontrada",
  "[ES] Contactez votre administrateur pour obtenir les accès nécessaires.": "Contacte a su administrador para obtener los accesos necesarios.",
  "[ES] Connecté à {{name}}": "Conectado a {{name}}",
  "[ES] Impossible de se connecter à cette société": "No se puede conectar a esta empresa",
  "[ES] Affectera tous les onglets ouverts ({{count}} détecté(s)).": "Afectará a todas las pestañas abiertas ({{count}} detectadas).",
  "[ES] Définir comme société par défaut": "Establecer como empresa predeterminada",
  "[ES] Choisissez la société sur laquelle vous souhaitez travailler.": "Elija la empresa con la que desea trabajar.",

  // dashboard.ts
  "[ES] Vérification de l\\'authentification...": "Verificando autenticación...",
  "[ES] Connecté en tant que": "Conectado como",

  // navigation.ts
  "[ES] Gestion des rôles": "Gestión de roles",

  // settings.ts
  "[ES] Gérez vos préférences de notification et d\\'alertes": "Gestione sus preferencias de notificaciones y alertas",
  "[ES] Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?": "¿Está seguro de que desea restablecer todos los ajustes?",
  "[ES] Sauvegardé": "Guardado",
  "[ES] Vous avez des modifications non sauvegardées. N\\'oubliez pas de sauvegarder vos préférences.": "Tiene cambios sin guardar. No olvide guardar sus preferencias.",
  "[ES] Niveau de sécurité": "Nivel de seguridad",
  "[ES] Configurez vos préférences, votre profil et les paramètres de votre compte": "Configure sus preferencias, perfil y ajustes de cuenta",

  // Additional French text without markers
  "Preferencias sauvegardées avec succès!": "¡Preferencias guardadas correctamente!",
  "Error lors de la sauvegarde des préférences": "Error al guardar las preferencias",
  "Personnalisez l\\'interface et configurez la langue": "Personaliza la interfaz y configura el idioma",
}

// Process each file
const files = fs.readdirSync(ES_DIR).filter(f => f.endsWith('.ts'))

for (const file of files) {
  const filePath = path.join(ES_DIR, file)
  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false

  for (const [french, spanish] of Object.entries(REPLACEMENTS)) {
    if (content.includes(french)) {
      content = content.split(french).join(spanish)
      modified = true
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`Updated: ${file}`)
  }
}

console.log('Done!')
