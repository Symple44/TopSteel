export const status = {
  active: 'Activo',
  inactive: 'Inactivo',
  pending: 'Pendiente',
  inProgress: 'En Curso',
  system: 'Sistema',
}

export const warehouse = {
  main: 'Almacén principal',
}

export const address = {
  main: 'Dirección principal',
  additionalInfo: 'Información adicional',
}

export const filters = {
  noSort: 'Sin ordenar',
}

export const menu = {
  untitled: 'Sin título',
  hidden: 'Oculto',
  title: 'Título',
  type: 'Tipo',
  icon: 'Icono',
  order: 'Orden',
  visible: 'Visible',
}

export const messages = {
  selectTableColumn: 'Por favor seleccione al menos una tabla y una columna',
  querySuccess: 'Consulta ejecutada correctamente ({{count}} resultados)',
  executionError: 'Error de ejecución: {{message}}',
  queryExecutionError: 'Error al ejecutar consulta',
  queryNameRequired: 'Por favor proporcione un nombre para su consulta',
  querySaved: 'Consulta guardada correctamente',
  saveError: 'Error al guardar: {{message}}',
  saveErrorGeneric: 'Error al guardar',
}

export const system = {
  modules: {
    available: 'Módulos del Sistema Disponibles',
  },
  permissions: {
    default: 'Permisos por Defecto',
  },
}

export const projects = {
  types: {
    steel_structure: 'Estructura Metálica',
    maintenance: 'Mantenimiento',
    custom_fabrication: 'Fabricación a Medida',
  },
  workflow: {
    default_steps: 'Pasos por Defecto del Proyecto',
  },
}

export const materials = {
  steel_grades: 'Grados de Acero Disponibles',
}

export const actions = {
  refresh: 'Actualizar',
  connect: 'Conectar',
  disconnect: 'Desconectar',
  reconnect: 'Reconectar',
  connecting: 'Conectando...',
  synchronizing: 'Sincronizando...',
  redirecting: 'Redirigiendo...',
  processing: 'Procesando...',
  validating: 'Validando...',
  authenticating: 'Autenticando...',
  cancel: 'Cancelar',
  save: 'Guardar',
  edit: 'Editar',
  create: 'Crear',
  createOrder: 'Crear Orden',
  addToMenu: 'Añadir al Menú',
  addMaterial: 'Añadir Material',
  saveChanges: 'Guardar Cambios',
  createMaterial: 'Crear nuevo material',
}

export const search = {
  template: 'Buscar plantilla...',
  global: 'Buscar clientes, artículos, proyectos...',
  byNumberDesc: 'Buscar por número, descripción...',
  byOrderNumber: 'Buscar por número de orden, descripción, proyecto...',
  byRefClient: 'Buscar por referencia, cliente...',
  byMaterialRef: 'Buscar por material, referencia, usuario...',
  byNameEmail: 'Buscar por nombre o email...',
  byMaterialDim: 'Buscar por material, dimensiones...',
  byNameAuthor: 'Buscar por nombre o autor...',
  scrap: 'Buscar un desperdicio...',
}

export const statusIndicator = {
  online: 'En línea',
  offline: 'Sin conexión',
  connected: 'Conectado',
  disconnected: 'Desconectado',
  syncing: 'Sincronizando...',
  lastSync: 'Última sincronización: {{time}}',
  reconnecting: 'Reconectando...',
  failed: 'Falló',
  success: 'Éxito',
}

export const templates = {
  title: 'Plantillas de Interfaz',
  description: 'Elija una plantilla predefinida',
  categories: {
    all: 'Todas',
    business: 'Empresarial',
    modern: 'Moderno',
    classic: 'Clásico',
  },
  states: {
    noTemplates: 'No se encontraron plantillas',
    loading: 'Cargando plantillas...',
    applying: 'Aplicando...',
    applied: 'Aplicado',
  },
  actions: {
    preview: 'Vista previa',
    apply: 'Aplicar',
    customize: 'Personalizar',
    reset: 'Restablecer',
  },
}

export const app = {
  name: 'TopSteel ERP',
  tagline: 'Gestión Metalúrgica',
  description: 'Sistema ERP especializado para metalurgia',
}

export const menuConfig = {
  confirmActivate: '¿Está seguro de que desea activar esta configuración? La configuración actual será desactivada.',
  noConfigurationsDescription: 'Comience creando una nueva configuración de menú o use el menú por defecto.',
  preview: 'Vista previa',
}

export const rootKeys = {
  securityNoticeText: 'Si no recibe el email, verifique que la dirección sea correcta o contacte a su administrador.',
  signIn: 'Iniciar sesión',
  switchToStandardMenu: 'Cambiar a menú estándar',
  accountInfo: 'Información de la cuenta',
  switchToCustomMenu: 'Cambiar a menú personalizado',
  saveRequired: 'Guardado requerido',
  saveBeforeExecute: 'Guardar antes de ejecutar',
  executeError: 'Error de ejecución',
  calculatedFields: 'Campos calculados',
  clickExecuteToSeeResults: 'Haga clic en ejecutar para ver los resultados',
  clickExecuteToLoadData: 'Haga clic en ejecutar para cargar los datos',
  selectTableToStart: 'Seleccione una tabla para comenzar',
  clickLineNumbers: 'Haga clic en los números de línea para seleccionar',
  closeMenu: 'Cerrar menú',
  openMenu: 'Abrir menú',
}
