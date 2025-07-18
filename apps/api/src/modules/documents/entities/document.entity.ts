import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 255 })
  nom!: string

  @Column({ type: 'varchar', length: 500 })
  chemin!: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  type?: string

  @Column({ type: 'bigint', nullable: true })
  taille?: number

  @Column({ type: 'int', nullable: true })
  projet?: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
