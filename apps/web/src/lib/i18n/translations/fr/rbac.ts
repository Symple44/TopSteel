export const roles = {
  owner: 'Propriétaire',
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  manager: 'Manager',
  commercial: 'Commercial',
  technician: 'Technicien',
  accountant: 'Comptable',
  operator: 'Opérateur',
  user: 'Utilisateur',
  viewer: 'Observateur',
  guest: 'Invité',
}

export const groups = {
  types: {
    CUSTOM: 'Personnalisé',
    ADMIN: 'Administrateur',
    USER: 'Utilisateur',
    MANAGER: 'Gestionnaire',
    VIEWER: 'Lecteur',
    SYSTEM: 'Système',
    XXX: 'Type inconnu',
  },
}

export const roleManagement = {
  title: 'Gestion des rôles',
  sections: {
    roles: 'Rôles',
    permissions: 'Permissions',
    users: 'Utilisateurs',
  },
  actions: {
    createRole: 'Créer un rôle',
    editRole: 'Modifier le rôle',
    deleteRole: 'Supprimer le rôle',
    assignRole: 'Assigner le rôle',
    unassignRole: 'Retirer le rôle',
    viewPermissions: 'Voir les permissions',
    managePermissions: 'Gérer les permissions',
  },
  fields: {
    roleName: 'Nom du rôle',
    roleDescription: 'Description du rôle',
    permissions: 'Permissions',
    users: 'Utilisateurs',
    createdAt: 'Créé le',
    updatedAt: 'Modifié le',
  },
  messages: {
    roleCreated: 'Rôle créé avec succès',
    roleUpdated: 'Rôle mis à jour avec succès',
    roleDeleted: 'Rôle supprimé avec succès',
    permissionGranted: 'Permission accordée',
    permissionRevoked: 'Permission révoquée',
    assignmentSuccess: 'Rôle assigné avec succès',
    unassignmentSuccess: 'Rôle retiré avec succès',
  },
}
