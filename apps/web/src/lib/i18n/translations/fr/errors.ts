export const errors = {
  general: 'Une erreur est survenue',
  networkError: 'Erreur de connexion réseau',
  validationError: 'Erreur de validation',
  unauthorized: 'Accès non autorisé',
  forbidden: 'Accès interdit',
  serverError: 'Erreur serveur',
  timeout: "Délai d'attente dépassé",
  tryAgain: 'Réessayer',
  contactSupport: 'Contacter le support',
  websocket: 'Impossible de créer la connexion WebSocket',
  title: 'Erreur',
  unexpectedDetailed: "Une erreur inattendue s'est produite. Veuillez réessayer.",
  dashboardError: 'Problème dans le dashboard',
  dashboardMessage: "Une erreur s'est produite lors du chargement du dashboard.",
  passwords: {
    mismatch: 'Les mots de passe ne correspondent pas',
    updateFailed: 'Échec de la mise à jour du mot de passe',
  },
  reset: {
    confirmText: 'Êtes-vous sûr de vouloir réinitialiser ? Cette action est irréversible.',
    success: 'Réinitialisation effectuée avec succès',
  },
  network: {
    title: 'Erreur réseau',
    message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
    action: 'Réessayer',
  },
  validation: {
    title: 'Erreur de validation',
    action: 'Corriger les erreurs',
  },
  auth: {
    title: "Erreur d'authentification",
    message: 'Votre session a expiré ou vos identifiants sont invalides.',
    action: 'Se reconnecter',
  },
  authorization: {
    title: 'Accès refusé',
    message: "Vous n'avez pas les permissions nécessaires pour cette action.",
    action: 'Retour',
  },
  notFound: {
    title: 'Non trouvé',
    message: "La ressource demandée n'existe pas ou a été supprimée.",
    action: "Retour à l'accueil",
  },
  conflict: {
    title: 'Conflit de données',
    message: 'Les données ont été modifiées par un autre utilisateur.',
    action: 'Rafraîchir',
  },
  rateLimit: {
    title: 'Limite atteinte',
    message: 'Trop de requêtes. Veuillez patienter {{seconds}} secondes.',
    action: 'Patienter',
  },
  server: {
    title: 'Erreur serveur',
    message: 'Une erreur interne est survenue. Nos équipes ont été notifiées.',
    action: 'Réessayer plus tard',
  },
  unexpected: {
    title: 'Erreur inattendue',
    message: 'Une erreur inattendue est survenue.',
    action: 'Réessayer',
  },
  backend: {
    unavailable: 'Serveur indisponible',
    connected: 'Connexion rétablie !',
    checking: 'Vérification en cours...',
    connectionInfo: 'Informations de connexion :',
    lastCheck: 'Dernière vérification :',
    responseTime: 'Temps de réponse :',
    notConfigured: 'Non configurée',
    accessDashboard: 'Accéder au tableau de bord',
    verifying: 'Vérification...',
    autoCheck: 'La vérification se fait automatiquement toutes les 30 secondes',
    troubleshooting: 'Conseils de dépannage',
    checkServer: 'Vérifiez que le serveur API est démarré',
    checkPort: 'Confirmez que le port {port} est accessible',
    checkNetwork: 'Vérifiez votre connexion réseau',
    checkLogs: 'Consultez les logs du serveur pour plus de détails',
  },
}

export const errorsEnhanced = {
  boundary: {
    title: "Une erreur s'est produite",
    description: 'Veuillez rafraîchir la page',
    refresh: 'Rafraîchir',
    retry: 'Réessayer',
    details: 'Détails techniques',
    reportIssue: 'Signaler le problème',
  },
  monitoring: {
    title: "Oops! Une erreur s'est produite",
    description: "Une erreur inattendue s'est produite dans l'application. Nos équipes ont été notifiées.",
    reloadPage: 'Recharger la page',
  },
  connection: {
    lost: 'Connexion perdue',
    restored: 'Connexion rétablie',
    offline: 'Mode hors ligne',
    reconnecting: 'Reconnexion en cours...',
  },
}

export const success = {
  saved: 'Enregistré avec succès',
  updated: 'Mis à jour avec succès',
  deleted: 'Supprimé avec succès',
  created: 'Créé avec succès',
  sent: 'Envoyé avec succès',
  imported: 'Importé avec succès',
  exported: 'Exporté avec succès',
  passwordChanged: 'Mot de passe modifié avec succès',
  photoUpdated: 'Photo de profil mise à jour',
}
