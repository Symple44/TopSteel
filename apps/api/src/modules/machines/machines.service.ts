// apps/api/src/modules/machines/machines.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Machine } from './entities/machine.entity';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private repository: Repository<Machine>
  ) {}

  async findAll(): Promise<Machine[]> {
    return this.repository.find({
      where: { actif: true },
      order: { createdAt: "DESC" } // ✅ CORRIGÉ : camelCase cohérent
    });
  }

  async findOne(id: string): Promise<Machine | null> {
    return this.repository.findOne({ where: { id, actif: true } });
  }

  async create(data: Partial<Machine>, userId?: string): Promise<Machine> {
    const entity = this.repository.create({
      ...data,
      createdBy: userId, // ✅ CORRIGÉ : camelCase cohérent
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity); // ✅ CORRIGÉ : retourne Machine, pas Machine[]
  }

  async update(id: string, data: Partial<Machine>, userId?: string): Promise<Machine | null> {
    const { metadata, ...updateData } = data;
    
    await this.repository.update(id, {
      ...updateData,
      updatedBy: userId // ✅ CORRIGÉ : camelCase cohérent
    });
    return this.findOne(id);
  }

  async delete(id: string, userId?: string): Promise<void> {
    await this.repository.update(id, {
      actif: false,
      updatedBy: userId // ✅ CORRIGÉ : camelCase cohérent
    });
  }

  async findByStatus(status: string): Promise<Machine[]> {
    return this.repository.find({
      where: { statut: status, actif: true }
    });
  }

  async findRecent(): Promise<Machine[]> {
    return this.repository.find({
      where: {
        actif: true,
        createdAt: MoreThanOrEqual(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // ✅ CORRIGÉ : camelCase cohérent
      }
    });
  }

  // ✅ AJOUTÉ : Méthodes manquantes pour le contrôleur
  async getStatistics() {
    const total = await this.repository.count({ where: { actif: true } });
    const enService = await this.repository.count({ 
      where: { actif: true, statut: 'EN_SERVICE' } 
    });
    const enMaintenance = await this.repository.count({ 
      where: { actif: true, statut: 'EN_MAINTENANCE' } 
    });
    const horsService = await this.repository.count({ 
      where: { actif: true, statut: 'HORS_SERVICE' } 
    });

    return {
      total,
      enService,
      enMaintenance,
      horsService,
      disponibilite: total > 0 ? (enService / total) * 100 : 0,
      tauxMaintenance: total > 0 ? (enMaintenance / total) * 100 : 0
    };
  }

  async remove(id: string, userId?: string): Promise<void> {
    // Soft delete - marquer comme inactif au lieu de supprimer
    await this.repository.update(id, {
      actif: false,
      updatedBy: userId
    });
  }

  // ✅ BONUS : Méthodes utiles supplémentaires
  async getStats() {
    return this.getStatistics(); // Alias pour compatibilité
  }

  async findByType(typeMachine: string): Promise<Machine[]> {
    return this.repository.find({
      where: { typeMachine, actif: true },
      order: { createdAt: "DESC" }
    });
  }

  async findByMarque(marque: string): Promise<Machine[]> {
    return this.repository.find({
      where: { marque, actif: true },
      order: { createdAt: "DESC" }
    });
  }
}