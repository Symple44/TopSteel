import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { MenuItem } from './menu-item.entity'

/**
 * Menu item action entity
 */
@Entity('menu_item_actions')
@Index(['menuItemId'])
export class MenuItemAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  menuItemId!: string

  @Column({
    type: 'enum',
    enum: ['click', 'hover', 'context', 'shortcut'],
    default: 'click',
  })
  actionType!: 'click' | 'hover' | 'context' | 'shortcut'

  @Column({ type: 'varchar', length: 255 })
  action!: string

  @Column({ type: 'jsonb', nullable: true })
  actionParams?: Record<string, unknown>

  @Column({ type: 'varchar', length: 50, nullable: true })
  shortcutKeys?: string

  @Column({ type: 'boolean', default: false })
  confirmationRequired!: boolean

  @Column({ type: 'text', nullable: true })
  confirmationMessage?: string

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Relations
  @ManyToOne(
    () => MenuItem,
    (menuItem) => menuItem.actions,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'menu_item_id' })
  menuItem!: MenuItem

  // Utility methods

  /**
   * Execute the action
   */
  async execute(context?: Record<string, unknown>): Promise<unknown> {
    // This would be implemented based on the action type
    // For now, return action details
    return {
      action: this.action,
      params: { ...this.actionParams, ...context },
      type: this.actionType,
    }
  }

  /**
   * Check if confirmation is needed
   */
  needsConfirmation(): boolean {
    return this.confirmationRequired && !!this.confirmationMessage
  }

  /**
   * Get formatted shortcut keys
   */
  getFormattedShortcut(): string | null {
    if (!this.shortcutKeys) {
      return null
    }

    // Format shortcut keys for display
    return this.shortcutKeys
      .split('+')
      .map((key) => key.trim())
      .map((key) => {
        // Capitalize modifier keys
        if (['ctrl', 'alt', 'shift', 'cmd', 'meta'].includes(key.toLowerCase())) {
          return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
        }
        return key.toUpperCase()
      })
      .join(' + ')
  }

  /**
   * Check if shortcut matches keyboard event
   */
  matchesKeyboardEvent(event: {
    key: string
    ctrlKey?: boolean
    altKey?: boolean
    shiftKey?: boolean
    metaKey?: boolean
  }): boolean {
    if (!this.shortcutKeys) {
      return false
    }

    const parts = this.shortcutKeys
      .toLowerCase()
      .split('+')
      .map((p) => p.trim())

    // Check modifiers
    if (parts.includes('ctrl') && !event.ctrlKey) return false
    if (parts.includes('alt') && !event.altKey) return false
    if (parts.includes('shift') && !event.shiftKey) return false
    if ((parts.includes('cmd') || parts.includes('meta')) && !event.metaKey) return false

    // Get the main key (non-modifier)
    const mainKey = parts.find((p) => !['ctrl', 'alt', 'shift', 'cmd', 'meta'].includes(p))

    if (mainKey) {
      // Check if the pressed key matches
      return event.key.toLowerCase() === mainKey.toLowerCase()
    }

    return false
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      actionType: this.actionType,
      action: this.action,
      actionParams: this.actionParams,
      shortcutKeys: this.shortcutKeys,
      formattedShortcut: this.getFormattedShortcut(),
      confirmationRequired: this.confirmationRequired,
      confirmationMessage: this.confirmationMessage,
      isActive: this.isActive,
    }
  }
}
