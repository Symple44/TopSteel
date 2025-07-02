import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operation, OperationStatut } from './entities/operation.entity';
import { CreateOperationDto } from './dto/create-operation.dto';
import { UpdateOperationDto } from './dto/update-operation.dto';

@Injectable()
export class OperationService {
  constructor(
    @InjectRepository(Operation)
    private readonly repository: Repository<Operation>,
  ) {}

  async create(createDto: CreateOperationDto): Promise<Operation> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll(): Promise<Operation[]> {
    return this.repository.find({
      relations: ['ordre'],
      order: { ordreExecution: 'ASC' },
    });
  }

  async findByOrdre(ordreFabricationId: number): Promise<Operation[]> {
    return this.repository.find({
      where: { ordreFabricationId },
      order: { ordreExecution: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Operation> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['ordre'],
    });
    if (!entity) {
      throw new NotFoundException(`Opération avec l'ID ${id} non trouvée`);
    }
    return entity;
  }

  async update(id: number, updateDto: UpdateOperationDto): Promise<Operation> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
  }

  async changeStatut(id: number, statut: OperationStatut): Promise<Operation> {
    const operation = await this.findOne(id);
    
    if (statut === OperationStatut.EN_COURS && !operation.dateDebut) {
      await this.repository.update(id, { 
        statut, 
        dateDebut: new Date() 
      });
    } else if (statut === OperationStatut.TERMINE && !operation.dateFin) {
      await this.repository.update(id, { 
        statut, 
        dateFin: new Date() 
      });
    } else {
      await this.repository.update(id, { statut });
    }
    
    return this.findOne(id);
  }

  async getStats(): Promise<{
    total: number;
    enAttente: number;
    enCours: number;
    terminees: number;
  }> {
    const total = await this.repository.count();
    const enAttente = await this.repository.countBy({ statut: OperationStatut.EN_ATTENTE });
    const enCours = await this.repository.countBy({ statut: OperationStatut.EN_COURS });
    const terminees = await this.repository.countBy({ statut: OperationStatut.TERMINE });

    return { total, enAttente, enCours, terminees };
  }
}
