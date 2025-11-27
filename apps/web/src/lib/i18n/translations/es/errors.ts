export const errors = {
  general: 'Ha ocurrido un error',
  networkError: 'Error de conexión de red',
  validationError: 'Error de validación',
  unauthorized: 'Acceso no autorizado',
  forbidden: 'Acceso prohibido',
  serverError: 'Error del servidor',
  timeout: 'Tiempo de espera agotado',
  tryAgain: 'Intentar de nuevo',
  contactSupport: 'Contactar soporte',
  websocket: 'No se puede crear conexión WebSocket',
  title: 'Error',
  unexpectedDetailed: 'Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo.',
  dashboardError: 'Problema en el panel',
  dashboardMessage: 'Se produjo un error al cargar el panel.',
  passwords: {
    mismatch: 'Las contraseñas no coinciden',
    updateFailed: 'Error al actualizar la contraseña',
  },
  reset: {
    confirmText: '¿Está seguro de que desea restablecer? Esta acción no se puede deshacer.',
    success: 'Restablecimiento completado exitosamente',
  },
  network: {
    title: 'Error de red',
    message: 'No se puede conectar al servidor. Verifique su conexión a internet.',
    action: 'Reintentar',
  },
  validation: {
    title: 'Error de validación',
    action: 'Corregir errores',
  },
  auth: {
    title: 'Error de autenticación',
    message: 'Su sesión ha expirado o sus credenciales son inválidas.',
    action: 'Iniciar sesión de nuevo',
  },
  authorization: {
    title: 'Acceso denegado',
    message: 'No tiene los permisos necesarios para esta acción.',
    action: 'Volver',
  },
  notFound: {
    title: 'No encontrado',
    message: 'El recurso solicitado no existe o ha sido eliminado.',
    action: 'Ir al inicio',
  },
  conflict: {
    title: 'Conflicto de datos',
    message: 'Los datos han sido modificados por otro usuario.',
    action: 'Actualizar',
  },
  rateLimit: {
    title: 'Límite alcanzado',
    message: 'Demasiadas solicitudes. Por favor espere {{seconds}} segundos.',
    action: 'Esperar',
  },
  server: {
    title: 'Error del servidor',
    message: 'Ha ocurrido un error interno. Nuestro equipo ha sido notificado.',
    action: 'Intentar más tarde',
  },
  unexpected: {
    title: 'Error inesperado',
    message: 'Ha ocurrido un error inesperado.',
    action: 'Reintentar',
  },
  backend: {
    unavailable: 'Servidor no disponible',
    connected: '¡Conexión restablecida!',
    checking: 'Verificando...',
    connectionInfo: 'Información de conexión:',
    lastCheck: 'Última verificación:',
    responseTime: 'Tiempo de respuesta:',
    notConfigured: 'No configurado',
    accessDashboard: 'Acceder al panel',
    verifying: 'Verificando...',
    autoCheck: 'Verificación automática cada 30 segundos',
    troubleshooting: 'Consejos de solución de problemas',
    checkServer: 'Verifique que el servidor API esté iniciado',
    checkPort: 'Confirme que el puerto {port} sea accesible',
    checkNetwork: 'Verifique su conexión de red',
    checkLogs: 'Consulte los registros del servidor para más detalles',
  },
}

export const errorsEnhanced = {
  boundary: {
    title: 'Ocurrió un error',
    description: 'Por favor actualice la página',
    refresh: 'Actualizar',
    retry: 'Reintentar',
    details: 'Detalles técnicos',
    reportIssue: 'Reportar problema',
  },
  monitoring: {
    title: '¡Ups! Ocurrió un error',
    description: 'Ocurrió un error inesperado en la aplicación. Nuestros equipos han sido notificados.',
    reloadPage: 'Recargar página',
  },
  connection: {
    lost: 'Conexión perdida',
    restored: 'Conexión restablecida',
    offline: 'Modo sin conexión',
    reconnecting: 'Reconectando...',
  },
}

export const success = {
  saved: 'Guardado exitosamente',
  updated: 'Actualizado exitosamente',
  deleted: 'Eliminado exitosamente',
  created: 'Creado exitosamente',
  sent: 'Enviado exitosamente',
  imported: 'Importado exitosamente',
  exported: 'Exportado exitosamente',
  passwordChanged: 'Contraseña cambiada exitosamente',
  photoUpdated: 'Foto de perfil actualizada',
}
