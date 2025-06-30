import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ordre_fabrication')
export class OrdreFabrication {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  numero!: string;

  @Column()
  statut!: string;

  @Column({ nullable: true })
  projet?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
