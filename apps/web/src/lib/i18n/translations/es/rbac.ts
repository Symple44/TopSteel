export const roles = {
  owner: 'Propietario',
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  manager: 'Gerente',
  commercial: 'Comercial',
  technician: 'Técnico',
  accountant: 'Contador',
  operator: 'Operador',
  user: 'Usuario',
  viewer: 'Observador',
  guest: 'Invitado',
}

export const groups = {
  types: {
    CUSTOM: 'Personalizado',
    ADMIN: 'Administrador',
    USER: 'Usuario',
    MANAGER: 'Gestor',
    VIEWER: 'Lector',
    SYSTEM: 'Sistema',
    XXX: 'Tipo desconocido',
  },
}

export const roleManagement = {
  title: 'Gestión de Roles',
  sections: {
    roles: 'Roles',
    permissions: 'Permisos',
    users: 'Usuarios',
  },
  actions: {
    createRole: 'Crear rol',
    editRole: 'Editar rol',
    deleteRole: 'Eliminar rol',
    assignRole: 'Asignar rol',
    unassignRole: 'Quitar rol',
    viewPermissions: 'Ver permisos',
    managePermissions: 'Gestionar permisos',
  },
  fields: {
    roleName: 'Nombre del rol',
    roleDescription: 'Descripción del rol',
    permissions: 'Permisos',
    users: 'Usuarios',
    createdAt: 'Creado el',
    updatedAt: 'Actualizado el',
  },
  messages: {
    roleCreated: 'Rol creado exitosamente',
    roleUpdated: 'Rol actualizado exitosamente',
    roleDeleted: 'Rol eliminado exitosamente',
    permissionGranted: 'Permiso otorgado',
    permissionRevoked: 'Permiso revocado',
    assignmentSuccess: 'Rol asignado exitosamente',
    unassignmentSuccess: 'Rol quitado exitosamente',
  },
}
