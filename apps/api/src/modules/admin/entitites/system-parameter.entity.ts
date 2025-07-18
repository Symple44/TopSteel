import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum ParameterType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ENUM = 'ENUM',
}

export enum ParameterCategory {
  GENERAL = 'GENERAL',
  COMPTABILITE = 'COMPTABILITE',
  PROJETS = 'PROJETS',
  PRODUCTION = 'PRODUCTION',
  ACHATS = 'ACHATS',
  STOCKS = 'STOCKS',
  NOTIFICATION = 'NOTIFICATION',
  SECURITY = 'SECURITY',
  ELASTICSEARCH = 'ELASTICSEARCH',
}

@Entity('system_parameters')
export class SystemParameter {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  key!: string

  @Column('text')
  value!: string

  @Column({
    type: 'enum',
    enum: ParameterType,
    default: ParameterType.STRING,
  })
  type!: ParameterType

  @Column({
    type: 'enum',
    enum: ParameterCategory,
    default: ParameterCategory.GENERAL,
  })
  category!: ParameterCategory

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'text', nullable: true })
  defaultValue?: string

  @Column({ type: 'boolean', default: true })
  isEditable!: boolean

  @Column({ type: 'boolean', default: false })
  isSecret!: boolean

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}