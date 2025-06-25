import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fournisseur } from './entities/fournisseur.entity';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';

@Injectable()
export class FournisseursService {
  constructor(
    @InjectRepository(Fournisseur)
    private fournisseurRepository: Repository<Fournisseur>,
  ) {}

  async create(createFournisseurDto: CreateFournisseurDto): Promise<Fournisseur> {
    const existingFournisseur = await this.fournisseurRepository.findOne({
      where: { email: createFournisseurDto.email },
    });

    if (existingFournisseur) {
      throw new ConflictException('Un fournisseur avec cet email existe déjà');
    }

    const fournisseurData = {
      nom: createFournisseurDto.nom,
      email: createFournisseurDto.email,
      telephone: createFournisseurDto.telephone,
      adresse: createFournisseurDto.adresse,
      siret: createFournisseurDto.siret,
      actif: true
    };

    const fournisseur = this.fournisseurRepository.create(fournisseurData);
    return this.fournisseurRepository.save(fournisseur);
  }

  async findAll(): Promise<Fournisseur[]> {
    return this.fournisseurRepository.find({
      where: { actif: true },
    });
  }

  async findOne(id: string | number): Promise<Fournisseur> {
    const fournisseurId = typeof id === 'string' ? parseInt(id, 10) : id;
    const fournisseur = await this.fournisseurRepository.findOne({
      where: { id: fournisseurId },
    });

    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur avec l'ID ${fournisseurId} introuvable`);
    }

    return fournisseur;
  }

  async update(id: string | number, updateFournisseurDto: UpdateFournisseurDto): Promise<Fournisseur> {
    const fournisseurId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    await this.fournisseurRepository.update(fournisseurId, updateFournisseurDto);
    return this.findOne(fournisseurId);
  }

  async remove(id: string | number): Promise<void> {
    const fournisseurId = typeof id === 'string' ? parseInt(id, 10) : id;
    const fournisseur = await this.findOne(fournisseurId);
    
    fournisseur.actif = false;
    await this.fournisseurRepository.save(fournisseur);
  }

  async toggleActif(id: string | number): Promise<Fournisseur> {
    const fournisseurId = typeof id === 'string' ? parseInt(id, 10) : id;
    const fournisseur = await this.findOne(fournisseurId);
    
    fournisseur.actif = !fournisseur.actif;
    return this.fournisseurRepository.save(fournisseur);
  }

  async findActifs(): Promise<Fournisseur[]> {
    return this.fournisseurRepository.find({
      where: { actif: true },
    });
  }

  async getProduits(id: string | number): Promise<any[]> {
    return [];
  }

  async getCommandes(id: string | number): Promise<any[]> {
    return [];
  }
}
