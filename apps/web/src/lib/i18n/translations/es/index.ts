import { common, translation } from './common'
import { auth } from './auth'
import { admin } from './admin'
import { dashboard } from './dashboard'
import { navigation, navigationEnhanced, breadcrumb } from './navigation'
import { errors, errorsEnhanced, success } from './errors'
import { settings, appearance, notifications } from './settings'
import { profile, profileEnhanced } from './profile'
import { queryBuilder, datatable, codeViewer } from './data'
import { roles, groups, roleManagement } from './rbac'
import { companies, tabSync } from './connections'
import { status, warehouse, address, filters, menu, modules, societes, messages, system, projects, materials, actions, search, statusIndicator, templates, app, menuConfig, rootKeys } from './misc'

export const es = {
  common,
  translation,
  auth,
  admin,
  dashboard,
  navigation,
  navigationEnhanced,
  breadcrumb,
  errors,
  errorsEnhanced,
  success,
  settings,
  appearance,
  notifications,
  profile,
  profileEnhanced,
  queryBuilder,
  datatable,
  codeViewer,
  roles,
  groups,
  roleManagement,
  companies,
  tabSync,
  status,
  warehouse,
  address,
  filters,
  menu,
  modules,
  societes,
  messages,
  system,
  projects,
  materials,
  actions,
  search,
  statusIndicator,
  templates,
  app,
  menuConfig,
  ...rootKeys,
}
