import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { 
  DatatableHierarchicalPreferences, 
  HierarchyConfig, 
  ReorderConfig, 
  DisplayConfig, 
  HierarchyFilters 
} from '../entities/datatable-hierarchical-preferences.entity'
import { DatatableHierarchyOrder } from '../entities/datatable-hierarchy-order.entity'

export interface CreateHierarchicalPreferencesDto {
  user_id: string
  table_id: string
  hierarchy_config?: Partial<HierarchyConfig>
  reorder_config?: Partial<ReorderConfig>
  display_config?: Partial<DisplayConfig>
  hierarchy_filters?: Partial<HierarchyFilters>
}

export interface UpdateHierarchicalPreferencesDto {
  hierarchy_config?: Partial<HierarchyConfig>
  reorder_config?: Partial<ReorderConfig>
  display_config?: Partial<DisplayConfig>
  hierarchy_filters?: Partial<HierarchyFilters>
}

export interface CreateHierarchyOrderDto {
  user_id: string
  table_id: string
  item_id: string
  parent_id?: string | null
  display_order: number
  level: number
  path?: string | null
}

export interface UpdateHierarchyOrderDto {
  parent_id?: string | null
  display_order?: number
  level?: number
  path?: string | null
}

@Injectable()
export class DatatableHierarchicalPreferencesService {
  constructor(
    @InjectRepository(DatatableHierarchicalPreferences)
    private preferencesRepository: Repository<DatatableHierarchicalPreferences>,
    @InjectRepository(DatatableHierarchyOrder)
    private orderRepository: Repository<DatatableHierarchyOrder>
  ) {}

  // Préférences hiérarchiques
  async createPreferences(dto: CreateHierarchicalPreferencesDto): Promise<DatatableHierarchicalPreferences> {
    try {
      const preferences = this.preferencesRepository.create({
        user_id: dto.user_id,
        table_id: dto.table_id,
        hierarchy_config: { ...this.getDefaultHierarchyConfig(), ...dto.hierarchy_config },
        reorder_config: { ...this.getDefaultReorderConfig(), ...dto.reorder_config },
        display_config: { ...this.getDefaultDisplayConfig(), ...dto.display_config },
        hierarchy_filters: { ...this.getDefaultHierarchyFilters(), ...dto.hierarchy_filters }
      })

      return await this.preferencesRepository.save(preferences)
    } catch (error: any) {
      if (error.code === '23505') { // Violation contrainte unique
        throw new BadRequestException('Des préférences existent déjà pour cet utilisateur et cette table')
      }
      throw error
    }
  }

  async getPreferences(user_id: string, table_id: string): Promise<DatatableHierarchicalPreferences | null> {
    return await this.preferencesRepository.findOne({
      where: { user_id, table_id }
    })
  }

  async getOrCreatePreferences(user_id: string, table_id: string): Promise<DatatableHierarchicalPreferences> {
    let preferences = await this.getPreferences(user_id, table_id)
    
    if (!preferences) {
      preferences = await this.createPreferences({ user_id, table_id })
    }
    
    return preferences
  }

  async updatePreferences(
    user_id: string, 
    table_id: string, 
    dto: UpdateHierarchicalPreferencesDto
  ): Promise<DatatableHierarchicalPreferences> {
    const preferences = await this.getPreferences(user_id, table_id)
    
    if (!preferences) {
      throw new NotFoundException('Préférences introuvables')
    }

    if (dto.hierarchy_config) {
      preferences.hierarchy_config = { ...preferences.hierarchy_config, ...dto.hierarchy_config }
    }
    if (dto.reorder_config) {
      preferences.reorder_config = { ...preferences.reorder_config, ...dto.reorder_config }
    }
    if (dto.display_config) {
      preferences.display_config = { ...preferences.display_config, ...dto.display_config }
    }
    if (dto.hierarchy_filters) {
      preferences.hierarchy_filters = { ...preferences.hierarchy_filters, ...dto.hierarchy_filters }
    }

    return await this.preferencesRepository.save(preferences)
  }

  async deletePreferences(user_id: string, table_id: string): Promise<void> {
    const result = await this.preferencesRepository.delete({ user_id, table_id })
    
    if (result.affected === 0) {
      throw new NotFoundException('Préférences introuvables')
    }
  }

  // Ordre hiérarchique
  async createHierarchyOrder(dto: CreateHierarchyOrderDto): Promise<DatatableHierarchyOrder> {
    try {
      // Vérifier que les préférences existent
      await this.getOrCreatePreferences(dto.user_id, dto.table_id)
      
      const order = this.orderRepository.create(dto)
      return await this.orderRepository.save(order)
    } catch (error: any) {
      if (error.code === '23505') { // Violation contrainte unique
        throw new BadRequestException('Un ordre existe déjà pour cet élément')
      }
      throw error
    }
  }

  async getHierarchyOrder(user_id: string, table_id: string, item_id: string): Promise<DatatableHierarchyOrder | null> {
    return await this.orderRepository.findOne({
      where: { user_id, table_id, item_id }
    })
  }

  async getHierarchyOrdersByTable(user_id: string, table_id: string): Promise<DatatableHierarchyOrder[]> {
    return await this.orderRepository.find({
      where: { user_id, table_id },
      order: { level: 'ASC', display_order: 'ASC' }
    })
  }

  async updateHierarchyOrder(
    user_id: string, 
    table_id: string, 
    item_id: string, 
    dto: UpdateHierarchyOrderDto
  ): Promise<DatatableHierarchyOrder> {
    const order = await this.getHierarchyOrder(user_id, table_id, item_id)
    
    if (!order) {
      throw new NotFoundException('Ordre hiérarchique introuvable')
    }

    Object.assign(order, dto)
    return await this.orderRepository.save(order)
  }

  async deleteHierarchyOrder(user_id: string, table_id: string, item_id: string): Promise<void> {
    const result = await this.orderRepository.delete({ user_id, table_id, item_id })
    
    if (result.affected === 0) {
      throw new NotFoundException('Ordre hiérarchique introuvable')
    }
  }

  async bulkUpdateHierarchyOrder(
    user_id: string, 
    table_id: string, 
    orders: Array<{ item_id: string; parent_id?: string | null; display_order: number; level: number; path?: string | null }>
  ): Promise<void> {
    await this.orderRepository.manager.transaction(async transactionalEntityManager => {
      for (const orderData of orders) {
        const existingOrder = await transactionalEntityManager.findOne(DatatableHierarchyOrder, {
          where: { user_id, table_id, item_id: orderData.item_id }
        })

        if (existingOrder) {
          await transactionalEntityManager.update(DatatableHierarchyOrder, 
            { user_id, table_id, item_id: orderData.item_id },
            {
              parent_id: orderData.parent_id,
              display_order: orderData.display_order,
              level: orderData.level,
              path: orderData.path
            }
          )
        } else {
          await transactionalEntityManager.save(DatatableHierarchyOrder, {
            user_id,
            table_id,
            item_id: orderData.item_id,
            parent_id: orderData.parent_id,
            display_order: orderData.display_order,
            level: orderData.level,
            path: orderData.path
          })
        }
      }
    })
  }

  // Helpers pour valeurs par défaut
  private getDefaultHierarchyConfig(): HierarchyConfig {
    return {
      parentField: 'parent_id',
      childrenField: 'children',
      levelField: 'level',
      orderField: 'display_order',
      maxDepth: 10,
      allowNesting: true,
      defaultExpanded: true,
      expandedNodes: []
    }
  }

  private getDefaultReorderConfig(): ReorderConfig {
    return {
      enableDragDrop: true,
      allowLevelChange: true,
      preserveHierarchy: true,
      autoExpand: true,
      dragHandleVisible: true,
      dropIndicatorStyle: 'line'
    }
  }

  private getDefaultDisplayConfig(): DisplayConfig {
    return {
      showLevelIndicators: true,
      showConnectionLines: true,
      indentSize: 24,
      levelColors: [],
      compactMode: false,
      collapsibleGroups: true
    }
  }

  private getDefaultHierarchyFilters(): HierarchyFilters {
    return {
      showOnlyLevels: [],
      hideEmptyParents: false,
      filterPreservesHierarchy: true,
      searchInChildren: true
    }
  }
}