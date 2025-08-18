import { Injectable, Logger } from '@nestjs/common'
import type { MetadataScanner, ModulesContainer, Reflector } from '@nestjs/core'
import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'

/**
 * Discovered page/route information
 */
export interface DiscoveredPage {
  id: string
  module: string
  controller: string
  handler: string
  method: string
  path: string
  fullPath: string
  metadata: {
    roles?: string[]
    permissions?: string[]
    isPublic?: boolean
    skipAuth?: boolean
    resource?: string
    action?: string
    description?: string
    deprecated?: boolean
  }
  parameters: Array<{
    name: string
    type: string
    source: 'params' | 'query' | 'body' | 'headers'
    required: boolean
  }>
  createdAt: Date
  lastSeen: Date
}

/**
 * Module information
 */
export interface ModuleInfo {
  name: string
  controllers: number
  routes: number
  publicRoutes: number
  protectedRoutes: number
  permissions: Set<string>
}

/**
 * Service for discovering all pages/routes in the application
 */
@Injectable()
export class PageDiscoveryService {
  private readonly logger = new Logger(PageDiscoveryService.name)
  private discoveredPages: Map<string, DiscoveredPage> = new Map()
  private moduleInfo: Map<string, ModuleInfo> = new Map()

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector
  ) {}

  /**
   * Discover all pages/routes in the application
   */
  async discoverAllPages(): Promise<DiscoveredPage[]> {
    this.logger.log('Starting page discovery...')
    this.discoveredPages.clear()
    this.moduleInfo.clear()

    // Iterate through all modules
    for (const [moduleName, module] of this.modulesContainer.entries()) {
      const moduleInfo: ModuleInfo = {
        name: moduleName,
        controllers: 0,
        routes: 0,
        publicRoutes: 0,
        protectedRoutes: 0,
        permissions: new Set(),
      }

      // Get controllers from the module
      const controllers = module.controllers

      for (const [controllerName, controller] of controllers) {
        if (this.isController(controller)) {
          moduleInfo.controllers++
          await this.discoverControllerRoutes(
            controller,
            moduleName,
            controllerName.toString(), // Convert InjectionToken to string
            moduleInfo
          )
        }
      }

      if (moduleInfo.routes > 0) {
        this.moduleInfo.set(moduleName, moduleInfo)
      }
    }

    const pages = Array.from(this.discoveredPages.values())
    this.logger.log(`Discovered ${pages.length} pages across ${this.moduleInfo.size} modules`)

    return pages
  }

  /**
   * Get discovered pages by module
   */
  getPagesByModule(moduleName: string): DiscoveredPage[] {
    return Array.from(this.discoveredPages.values()).filter((page) => page.module === moduleName)
  }

  /**
   * Get module statistics
   */
  getModuleStatistics(): Map<string, ModuleInfo> {
    return this.moduleInfo
  }

  /**
   * Search pages by criteria
   */
  searchPages(criteria: {
    path?: string
    method?: string
    module?: string
    controller?: string
    permission?: string
    isPublic?: boolean
  }): DiscoveredPage[] {
    let pages = Array.from(this.discoveredPages.values())

    if (criteria.path) {
      const searchPath = criteria.path.toLowerCase()
      pages = pages.filter(
        (p) =>
          p.path.toLowerCase().includes(searchPath) || p.fullPath.toLowerCase().includes(searchPath)
      )
    }

    if (criteria.method) {
      pages = pages.filter((p) => p.method === criteria.method.toUpperCase())
    }

    if (criteria.module) {
      pages = pages.filter((p) => p.module === criteria.module)
    }

    if (criteria.controller) {
      pages = pages.filter((p) => p.controller === criteria.controller)
    }

    if (criteria.permission) {
      pages = pages.filter((p) => p.metadata.permissions?.includes(criteria.permission))
    }

    if (criteria.isPublic !== undefined) {
      pages = pages.filter((p) => p.metadata.isPublic === criteria.isPublic)
    }

    return pages
  }

  /**
   * Get pages requiring specific permission
   */
  getPagesByPermission(permission: string): DiscoveredPage[] {
    return Array.from(this.discoveredPages.values()).filter((page) =>
      page.metadata.permissions?.includes(permission)
    )
  }

  /**
   * Get public pages
   */
  getPublicPages(): DiscoveredPage[] {
    return Array.from(this.discoveredPages.values()).filter(
      (page) => page.metadata.isPublic || page.metadata.skipAuth
    )
  }

  /**
   * Get protected pages
   */
  getProtectedPages(): DiscoveredPage[] {
    return Array.from(this.discoveredPages.values()).filter(
      (page) => !page.metadata.isPublic && !page.metadata.skipAuth
    )
  }

  /**
   * Get deprecated pages
   */
  getDeprecatedPages(): DiscoveredPage[] {
    return Array.from(this.discoveredPages.values()).filter((page) => page.metadata.deprecated)
  }

  /**
   * Check if instance is a controller
   */
  private isController(wrapper: InstanceWrapper): boolean {
    return wrapper.metatype && Reflect.hasMetadata('__controller__', wrapper.metatype)
  }

  /**
   * Discover routes in a controller
   */
  private async discoverControllerRoutes(
    controller: InstanceWrapper,
    moduleName: string,
    controllerName: string,
    moduleInfo: ModuleInfo
  ): Promise<void> {
    if (!controller.instance || !controller.metatype) {
      return
    }

    const instance = controller.instance
    const prototype = Object.getPrototypeOf(instance)

    // Get controller metadata
    const controllerPath = Reflect.getMetadata('path', controller.metatype) || ''
    const controllerPrefix = Reflect.getMetadata('__prefix__', controller.metatype) || ''

    // Scan all methods in the controller
    const methodNames = this.metadataScanner.getAllMethodNames(prototype)

    for (const methodName of methodNames) {
      const method = prototype[methodName]

      // Skip constructor and non-route methods
      if (methodName === 'constructor' || !this.isRouteHandler(method)) {
        continue
      }

      // Get route metadata
      const routePath = Reflect.getMetadata('path', method) || ''
      const httpMethod = this.getHttpMethod(method)

      if (!httpMethod) {
        continue
      }

      // Build full path
      const fullPath = this.buildFullPath(controllerPrefix, controllerPath, routePath)

      // Extract metadata
      const metadata = this.extractMetadata(controller.metatype, method)

      // Extract parameters
      const parameters = this.extractParameters(method)

      // Create page entry
      const pageId = `${moduleName}:${controllerName}:${methodName}`
      const page: DiscoveredPage = {
        id: pageId,
        module: moduleName,
        controller: controllerName,
        handler: methodName,
        method: httpMethod,
        path: routePath || '/',
        fullPath,
        metadata,
        parameters,
        createdAt: new Date(),
        lastSeen: new Date(),
      }

      this.discoveredPages.set(pageId, page)
      moduleInfo.routes++

      if (metadata.isPublic || metadata.skipAuth) {
        moduleInfo.publicRoutes++
      } else {
        moduleInfo.protectedRoutes++
      }

      if (metadata.permissions) {
        metadata.permissions.forEach((p) => moduleInfo.permissions.add(p))
      }
    }
  }

  /**
   * Check if method is a route handler
   */
  private isRouteHandler(method: Function): boolean {
    return !!(
      Reflect.getMetadata('method', method) ||
      Reflect.getMetadata('path', method) ||
      Reflect.hasMetadata('__route__', method)
    )
  }

  /**
   * Get HTTP method from route handler
   */
  private getHttpMethod(method: Function): string | null {
    const httpMethod = Reflect.getMetadata('method', method)

    if (httpMethod) {
      return httpMethod.toUpperCase()
    }

    // Check for specific decorators
    const decorators = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'all']
    for (const decorator of decorators) {
      if (Reflect.hasMetadata(`__${decorator}__`, method)) {
        return decorator.toUpperCase()
      }
    }

    return null
  }

  /**
   * Build full path from parts
   */
  private buildFullPath(prefix: string, controllerPath: string, routePath: string): string {
    const parts = [prefix, controllerPath, routePath]
      .filter(Boolean)
      .map((part) => (part.startsWith('/') ? part.slice(1) : part))
      .filter(Boolean)

    return `/${parts.join('/')}`
  }

  /**
   * Extract metadata from controller and method
   */
  private extractMetadata(controller: any, method: Function): DiscoveredPage['metadata'] {
    const metadata: DiscoveredPage['metadata'] = {}

    // Get roles
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [method, controller])
    if (roles) {
      metadata.roles = roles
    }

    // Get permissions
    const permissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      method,
      controller,
    ])
    if (permissions) {
      metadata.permissions = permissions
    }

    // Check if public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [method, controller])
    if (isPublic) {
      metadata.isPublic = true
    }

    // Check if auth should be skipped
    const skipAuth = this.reflector.getAllAndOverride<boolean>('skipAuth', [method, controller])
    if (skipAuth) {
      metadata.skipAuth = true
    }

    // Get resource
    const resource = this.reflector.getAllAndOverride<string>('resource', [method, controller])
    if (resource) {
      metadata.resource = resource
    }

    // Get action
    const action = this.reflector.getAllAndOverride<string>('action', [method, controller])
    if (action) {
      metadata.action = action
    }

    // Get description
    const description = this.reflector.getAllAndOverride<string>('description', [
      method,
      controller,
    ])
    if (description) {
      metadata.description = description
    }

    // Check if deprecated
    const deprecated = this.reflector.getAllAndOverride<boolean>('deprecated', [method, controller])
    if (deprecated) {
      metadata.deprecated = true
    }

    return metadata
  }

  /**
   * Extract parameters from method
   */
  private extractParameters(method: Function): DiscoveredPage['parameters'] {
    const parameters: DiscoveredPage['parameters'] = []

    // Get parameter types
    const paramTypes = Reflect.getMetadata('design:paramtypes', method) || []

    // Get parameter metadata
    const paramMetadata = Reflect.getMetadata('__routeArguments__', method) || {}

    Object.keys(paramMetadata).forEach((key) => {
      const param = paramMetadata[key]
      const index = parseInt(key)
      const type = paramTypes[index]

      if (param) {
        parameters.push({
          name: param.data || `param${index}`,
          type: type?.name || 'unknown',
          source: this.getParamSource(param.type),
          required: !param.optional,
        })
      }
    })

    return parameters
  }

  /**
   * Get parameter source from type
   */
  private getParamSource(type: number): 'params' | 'query' | 'body' | 'headers' {
    // NestJS parameter type constants
    const PARAM_TYPES = {
      BODY: 6,
      QUERY: 5,
      PARAM: 4,
      HEADERS: 3,
    }

    switch (type) {
      case PARAM_TYPES.BODY:
        return 'body'
      case PARAM_TYPES.QUERY:
        return 'query'
      case PARAM_TYPES.PARAM:
        return 'params'
      case PARAM_TYPES.HEADERS:
        return 'headers'
      default:
        return 'body'
    }
  }

  /**
   * Export discovered pages to JSON
   */
  exportToJson(): string {
    const data = {
      discoveryDate: new Date().toISOString(),
      totalPages: this.discoveredPages.size,
      modules: Array.from(this.moduleInfo.entries()).map(([name, info]) => ({
        name,
        ...info,
        permissions: Array.from(info.permissions),
      })),
      pages: Array.from(this.discoveredPages.values()),
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * Generate route documentation
   */
  generateDocumentation(): string {
    const lines: string[] = []

    lines.push('# API Routes Documentation')
    lines.push(`Generated on: ${new Date().toISOString()}`)
    lines.push(`Total routes: ${this.discoveredPages.size}`)
    lines.push('')

    // Group by module
    for (const [moduleName, moduleInfo] of this.moduleInfo.entries()) {
      lines.push(`## Module: ${moduleName}`)
      lines.push(`- Controllers: ${moduleInfo.controllers}`)
      lines.push(`- Routes: ${moduleInfo.routes}`)
      lines.push(`- Public: ${moduleInfo.publicRoutes}`)
      lines.push(`- Protected: ${moduleInfo.protectedRoutes}`)
      lines.push('')

      const modulePages = this.getPagesByModule(moduleName)

      // Group by controller
      const controllers = new Map<string, DiscoveredPage[]>()
      modulePages.forEach((page) => {
        const pages = controllers.get(page.controller) || []
        pages.push(page)
        controllers.set(page.controller, pages)
      })

      for (const [controllerName, pages] of controllers.entries()) {
        lines.push(`### Controller: ${controllerName}`)
        lines.push('')

        for (const page of pages) {
          lines.push(`#### ${page.method} ${page.fullPath}`)
          lines.push(`- Handler: ${page.handler}`)

          if (page.metadata.description) {
            lines.push(`- Description: ${page.metadata.description}`)
          }

          if (page.metadata.permissions?.length) {
            lines.push(`- Permissions: ${page.metadata.permissions.join(', ')}`)
          }

          if (page.metadata.roles?.length) {
            lines.push(`- Roles: ${page.metadata.roles.join(', ')}`)
          }

          if (page.metadata.isPublic) {
            lines.push(`- Access: Public`)
          } else if (page.metadata.skipAuth) {
            lines.push(`- Access: No Auth Required`)
          } else {
            lines.push(`- Access: Protected`)
          }

          if (page.metadata.deprecated) {
            lines.push(`- **DEPRECATED**`)
          }

          if (page.parameters.length > 0) {
            lines.push(`- Parameters:`)
            page.parameters.forEach((param) => {
              lines.push(
                `  - ${param.name} (${param.source}): ${param.type} ${param.required ? '[required]' : '[optional]'}`
              )
            })
          }

          lines.push('')
        }
      }
    }

    return lines.join('\n')
  }
}
