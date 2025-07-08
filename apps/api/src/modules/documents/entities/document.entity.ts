import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  nom!: string

  @Column()
  chemin!: string

  @Column({ nullable: true })
  type?: string

  @Column({ nullable: true })
  taille?: number

  @Column({ nullable: true })
  projet?: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
