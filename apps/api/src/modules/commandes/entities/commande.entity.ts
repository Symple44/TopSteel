import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('commandes')
export class Commande {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 100 })
  numero!: string

  @Column('decimal', { precision: 10, scale: 2 })
  montant!: number

  @Column({ type: 'int', nullable: true })
  fournisseur?: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
