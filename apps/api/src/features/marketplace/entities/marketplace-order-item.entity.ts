import { Article } from '@erp/entities'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// Removed import to avoid circular dependencies
// import { MarketplaceOrder } from './marketplace-order.entity'
import type { SafeObject } from '../../../../../../packages/ui/src/types/common'

@Entity('marketplace_order_items')
export class MarketplaceOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id' })
  orderId: string

  @ManyToOne('MarketplaceOrder', 'items', { onDelete: 'CASCADE', lazy: true })
  @JoinColumn({ name: 'order_id' })
  order: Promise<import('./marketplace-order.entity').MarketplaceOrder>

  @Column({ name: 'product_id' })
  productId: string // Référence vers Article.id ERP

  @ManyToOne(() => Article, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Article // Article ERP au lieu de MarketplaceProduct

  @Column()
  quantity: number

  @Column('decimal', { precision: 10, scale: 2 })
  price: number // Prix unitaire au moment de la commande

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number // Prix total de la ligne

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number

  @Column('jsonb', { nullable: true })
  customizations: SafeObject

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
