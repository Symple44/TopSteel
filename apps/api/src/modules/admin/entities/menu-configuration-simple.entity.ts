import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'

@Entity('menu_configurations')
export class MenuConfigurationSimple {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'boolean', default: false, name: 'isactive' })
  isActive: boolean

  @Column({ type: 'boolean', default: false, name: 'issystem' })
  isSystem: boolean

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn({ name: 'createdat' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updatedat' })
  updatedAt: Date

  @Column({ type: 'uuid', nullable: true, name: 'createdby' })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true, name: 'updatedby' })
  updatedBy?: string
}