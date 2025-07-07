import { PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateOrdreFabricationDto } from './create-ordre-fabrication.dto';

/**
 * DTO de mise à jour d'un ordre de fabrication
 * 
 * Hérite automatiquement de toutes les propriétés de CreateOrdreFabricationDto
 * en version optionnelle grâce à PartialType.
 * 
 * Ajoute les propriétés spécifiques à la mise à jour qui ne sont pas
 * présentes dans CreateOrdreFabricationDto :
 * - dateDebutReelle : date de début réelle (enregistrée lors du démarrage)
 * - dateFinReelle : date de fin réelle (enregistrée lors de la finalisation)
 */
export class UpdateOrdreFabricationDto extends PartialType(CreateOrdreFabricationDto) {
  
  // === PROPRIÉTÉS SPÉCIFIQUES À LA MISE À JOUR ===
  // Ces propriétés ne sont pas dans CreateOrdreFabricationDto car elles
  // sont enregistrées uniquement lors de l'exécution de l'ordre
  
  @IsOptional()
  @IsDateString()
  dateDebutReelle?: string;

  @IsOptional()
  @IsDateString()
  dateFinReelle?: string;
  
  // Note: Toutes les autres propriétés (numero, statut, projet, description, 
  // priorite, dateDebutPrevue, dateFinPrevue, avancement, responsableId, notes)
  // sont automatiquement héritées de CreateOrdreFabricationDto via PartialType
}
