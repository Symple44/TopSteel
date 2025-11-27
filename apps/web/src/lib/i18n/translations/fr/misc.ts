export const status = {
  active: 'Actif',
  inactive: 'Inactif',
  pending: 'En attente',
  inProgress: 'En cours',
  system: 'Système',
}

export const warehouse = {
  main: 'Dépôt principal',
}

export const address = {
  main: 'Adresse principale',
  additionalInfo: 'Informations complémentaires',
}

export const filters = {
  noSort: 'Aucun tri',
}

export const menu = {
  untitled: 'Sans titre',
  hidden: 'Masqué',
  title: 'Titre',
  type: 'Type',
  icon: 'Icône',
  order: 'Ordre',
  visible: 'Visible',
}

export const modules = {
  title: 'Modules',
  access: 'Accès',
}

export const messages = {
  selectTableColumn: 'Veuillez sélectionner au moins une table et une colonne',
  querySuccess: 'Requête exécutée avec succès ({{count}} résultats)',
  executionError: "Erreur lors de l'exécution: {{message}}",
  queryExecutionError: "Erreur lors de l'exécution de la requête",
  queryNameRequired: 'Veuillez donner un nom à votre requête',
  querySaved: 'Requête sauvegardée avec succès',
  saveError: 'Erreur lors de la sauvegarde: {{message}}',
  saveErrorGeneric: 'Erreur lors de la sauvegarde',
}

export const system = {
  modules: {
    available: 'Modules système disponibles',
  },
  permissions: {
    default: 'Permissions par défaut',
  },
}

export const projects = {
  types: {
    steel_structure: 'Structure métallique',
    maintenance: 'Maintenance',
    custom_fabrication: 'Fabrication sur mesure',
  },
  workflow: {
    default_steps: 'Étapes par défaut des projets',
  },
}

export const materials = {
  steel_grades: "Grades d'acier disponibles",
}

export const actions = {
  refresh: 'Actualiser',
  connect: 'Se connecter',
  disconnect: 'Se déconnecter',
  reconnect: 'Se reconnecter',
  connecting: 'Connexion...',
  synchronizing: 'Synchronisation...',
  redirecting: 'Redirection en cours...',
  processing: 'Traitement en cours...',
  validating: 'Validation...',
  authenticating: 'Authentification...',
  cancel: 'Annuler',
  save: 'Sauvegarder',
  edit: 'Modifier',
  create: 'Créer',
  createOrder: "Créer l'ordre",
  addToMenu: 'Ajouter au Menu',
  addMaterial: 'Ajouter le matériau',
  saveChanges: 'Sauvegarder les modifications',
  createMaterial: 'Créer un nouveau matériau',
}

export const search = {
  template: 'Rechercher un template...',
  global: 'Rechercher clients, articles, projets...',
  byNumberDesc: 'Rechercher par numéro, description...',
  byOrderNumber: "Rechercher par numéro d'ordre, description, projet...",
  byRefClient: 'Rechercher par référence, client...',
  byMaterialRef: 'Rechercher par matériau, référence, utilisateur...',
  byNameEmail: 'Rechercher par nom ou email...',
  byMaterialDim: 'Rechercher par matériau, dimensions...',
  byNameAuthor: 'Rechercher par nom ou auteur...',
  scrap: 'Rechercher une chute...',
}

export const statusIndicator = {
  online: 'En ligne',
  offline: 'Hors ligne',
  connected: 'Connecté',
  disconnected: 'Déconnecté',
  syncing: 'Synchronisation...',
  lastSync: 'Dernière synchronisation: {{time}}',
  reconnecting: 'Reconnexion...',
  failed: 'Échec',
  success: 'Succès',
}

export const templates = {
  title: "Templates d'Interface",
  description: 'Choisissez un template prédéfini',
  categories: {
    all: 'Tous',
    business: 'Entreprise',
    modern: 'Moderne',
    classic: 'Classique',
  },
  states: {
    noTemplates: 'Aucun template trouvé',
    loading: 'Chargement des templates...',
    applying: 'Application en cours...',
    applied: 'Appliqué',
  },
  actions: {
    preview: 'Aperçu',
    apply: 'Appliquer',
    customize: 'Personnaliser',
    reset: 'Réinitialiser',
  },
}

export const app = {
  name: 'TopSteel ERP',
  tagline: 'Gestion Métallurgique',
  description: 'Système ERP spécialisé pour la métallurgie',
}

export const menuConfig = {
  confirmActivate: 'Êtes-vous sûr de vouloir activer cette configuration ? La configuration actuelle sera désactivée.',
  noConfigurationsDescription: 'Commencez par créer une nouvelle configuration de menu ou utilisez le menu par défaut.',
  preview: 'Aperçu',
}

export const rootKeys = {
  securityNoticeText: "Si vous ne recevez pas l'email, vérifiez que l'adresse est correcte ou contactez votre administrateur.",
  signIn: 'Se connecter',
  switchToStandardMenu: 'Passer au menu standard',
  accountInfo: 'Informations du compte',
  switchToCustomMenu: 'Passer au menu personnalisé',
  saveRequired: 'Sauvegarde requise',
  saveBeforeExecute: 'Sauvegarder avant exécution',
  executeError: "Erreur d'exécution",
  calculatedFields: 'Champs calculés',
  clickExecuteToSeeResults: 'Cliquez sur exécuter pour voir les résultats',
  clickExecuteToLoadData: 'Cliquez sur exécuter pour charger les données',
  selectTableToStart: 'Sélectionnez une table pour commencer',
  clickLineNumbers: 'Cliquez sur les numéros de ligne pour sélectionner',
  closeMenu: 'Fermer le menu',
  openMenu: 'Ouvrir le menu',
}
