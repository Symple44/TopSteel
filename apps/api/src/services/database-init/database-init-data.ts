// Données d'initialisation par défaut pour la base de données
export const INIT_DATA = {
  // Modules système
  modules: [
    { name: 'USER_MANAGEMENT', description: 'Gestion des utilisateurs', category: 'CORE', icon: 'Users' },
    { name: 'ROLE_MANAGEMENT', description: 'Gestion des rôles', category: 'CORE', icon: 'Shield' },
    { name: 'SYSTEM_SETTINGS', description: 'Paramètres système', category: 'CORE', icon: 'Settings' },
    { name: 'CLIENT_MANAGEMENT', description: 'Gestion des clients', category: 'BUSINESS', icon: 'Building' },
    { name: 'PROJECT_MANAGEMENT', description: 'Gestion des projets', category: 'BUSINESS', icon: 'FolderOpen' },
    { name: 'BILLING_MANAGEMENT', description: 'Gestion de la facturation', category: 'BUSINESS', icon: 'CreditCard' },
    { name: 'PRODUCTION_MANAGEMENT', description: 'Gestion de la production', category: 'BUSINESS', icon: 'Cog' },
    { name: 'STOCK_MANAGEMENT', description: 'Gestion des stocks', category: 'BUSINESS', icon: 'Package' },
    { name: 'NOTIFICATION_MANAGEMENT', description: 'Gestion des notifications', category: 'ADMIN', icon: 'Bell' },
    { name: 'AUDIT_LOGS', description: 'Journaux d\'audit', category: 'ADMIN', icon: 'FileText' },
    { name: 'BACKUP_MANAGEMENT', description: 'Gestion des sauvegardes', category: 'ADMIN', icon: 'HardDrive' },
    { name: 'FINANCIAL_REPORTS', description: 'Rapports financiers', category: 'REPORTS', icon: 'TrendingUp' },
    { name: 'PRODUCTION_REPORTS', description: 'Rapports de production', category: 'REPORTS', icon: 'BarChart3' },
    { name: 'CUSTOM_REPORTS', description: 'Rapports personnalisés', category: 'REPORTS', icon: 'PieChart' },
  ],

  // Rôles système
  roles: [
    { name: 'SUPER_ADMIN', description: 'Super Administrateur - Accès complet', is_system_role: true },
    { name: 'ADMIN', description: 'Administrateur - Accès administratif', is_system_role: true },
    { name: 'MANAGER', description: 'Manager - Accès business complet', is_system_role: true },
    { name: 'COMMERCIAL', description: 'Commercial - Clients et facturation', is_system_role: true },
    { name: 'TECHNICIEN', description: 'Technicien - Production et stocks', is_system_role: true },
    { name: 'OPERATEUR', description: 'Opérateur - Lecture seule production', is_system_role: true },
    { name: 'DEVISEUR', description: 'Deviseur - Spécialisé devis', is_system_role: false },
  ],

  // Groupes par défaut
  groups: [
    { name: 'Direction', description: 'Équipe de direction', type: 'DEPARTMENT', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Commercial', description: 'Équipe commerciale', type: 'DEPARTMENT', roles: ['COMMERCIAL'] },
    { name: 'Production', description: 'Équipe de production', type: 'DEPARTMENT', roles: ['MANAGER', 'TECHNICIEN'] },
    { name: 'Technique', description: 'Équipe technique', type: 'DEPARTMENT', roles: ['TECHNICIEN'] },
    { name: 'Administratif', description: 'Équipe administrative', type: 'DEPARTMENT', roles: ['MANAGER'] },
    { name: 'Projet Alpha', description: 'Équipe projet Alpha', type: 'PROJECT', roles: [] },
    { name: 'Projet Beta', description: 'Équipe projet Beta', type: 'PROJECT', roles: [] },
  ],

  // Paramètres système
  systemParameters: [
    { key: 'app_name', value: 'TopSteel ERP', description: 'Nom de l\'application', type: 'string', category: 'general' },
    { key: 'app_version', value: '1.0.0', description: 'Version de l\'application', type: 'string', category: 'general' },
    { key: 'maintenance_mode', value: 'false', description: 'Mode maintenance activé', type: 'boolean', category: 'system' },
    { key: 'notifications_enabled', value: 'true', description: 'Notifications activées', type: 'boolean', category: 'notifications' },
    { key: 'session_timeout', value: '3600', description: 'Timeout de session en secondes', type: 'number', category: 'security' },
    { key: 'max_login_attempts', value: '5', description: 'Nombre maximum de tentatives de connexion', type: 'number', category: 'security' },
  ],

  // Énums PostgreSQL
  enums: [
    {
      name: 'notifications_type_enum',
      values: ['info', 'warning', 'error', 'success']
    }
  ],

  // Utilisateur administrateur par défaut
  defaultAdmin: {
    nom: 'Admin',
    prenom: 'System',
    email: 'admin@topsteel.tech',
    password: 'TopSteel44!',
    role: 'SUPER_ADMIN',
    userSettings: {
      theme: 'light',
      language: 'fr',
      timezone: 'Europe/Paris',
      date_format: 'DD/MM/YYYY',
      time_format: 'HH:mm'
    }
  },

  // Configuration des permissions par rôle
  rolePermissions: {
    SUPER_ADMIN: {
      access_level: 'ADMIN',
      modules: 'ALL'
    },
    ADMIN: {
      access_level: 'DELETE',
      modules: 'ALL',
      exceptions: [
        { module: 'SYSTEM_SETTINGS', actions: ['create', 'update', 'delete'], access_level: 'WRITE' }
      ]
    },
    MANAGER: {
      access_level: 'DELETE',
      modules: ['BUSINESS']
    },
    COMMERCIAL: {
      access_level: 'WRITE',
      modules: ['CLIENT_MANAGEMENT', 'PROJECT_MANAGEMENT', 'BILLING_MANAGEMENT'],
      exceptions: [
        { module: 'ALL', actions: ['delete'], access_level: 'WRITE' }
      ]
    },
    TECHNICIEN: {
      access_level: 'WRITE',
      modules: ['PRODUCTION_MANAGEMENT', 'STOCK_MANAGEMENT'],
      exceptions: [
        { module: 'ALL', actions: ['delete'], access_level: 'WRITE' }
      ]
    },
    OPERATEUR: {
      access_level: 'READ',
      modules: ['PRODUCTION_MANAGEMENT'],
      actions: ['view']
    },
    DEVISEUR: {
      access_level: 'WRITE',
      modules: ['CLIENT_MANAGEMENT', 'BILLING_MANAGEMENT'],
      exceptions: [
        { module: 'CLIENT_MANAGEMENT', actions: ['delete'], granted: false },
        { module: 'BILLING_MANAGEMENT', actions: ['validate'], granted: false }
      ]
    }
  }
}