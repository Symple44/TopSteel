import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('produits')
export class Produit {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 255 })
  nom!: string

  @Column({ type: 'varchar', length: 100 })
  reference!: string

  @Column('decimal', { precision: 10, scale: 2 })
  prix!: number

  @Column({ type: 'int', nullable: true })
  fournisseurPrincipal?: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
