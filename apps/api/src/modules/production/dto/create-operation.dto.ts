import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { OperationStatut, OperationType } from '../entities/operation.entity'

export class CreateOperationDto {
  @IsString()
  nom!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsEnum(OperationType)
  type!: OperationType

  @IsOptional()
  @IsEnum(OperationStatut)
  statut?: OperationStatut

  @IsInt()
  ordreFabricationId!: number

  @IsOptional()
  @IsInt()
  @Min(1)
  ordreExecution?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  dureeEstimee?: number

  @IsOptional()
  @IsInt()
  machineId?: number

  @IsOptional()
  @IsInt()
  technicienId?: number

  @IsOptional()
  @IsString()
  notes?: string
}
