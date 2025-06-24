import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('stocks')
export class Stocks {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
