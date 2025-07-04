// apps/api/src/common/utils/entity.utils.ts
export class EntityIdConverter {
  /**
   * Convertit un ID numérique en UUID avec préfixe
   */
  static toUUID(numericId: number, entityType: string): string {
    return `${entityType.toLowerCase()}-${numericId.toString().padStart(8, '0')}`;
  }

  /**
   * Extrait le type et ID numérique depuis un UUID
   */
  static fromUUID(uuid: string): { type: string; id: number } {
    const [type, numericPart] = uuid.split('-');
    return { 
      type: type.toUpperCase(), 
      id: parseInt(numericPart, 10) 
    };
  }

  /**
   * Valide le format UUID avec préfixe
   */
  static isValidEntityUUID(uuid: string): boolean {
    const pattern = /^[a-z]+-(\\d{8})$/;
    return pattern.test(uuid);
  }

  /**
   * Génère un UUID temporaire pour nouvelles entités
   */
  static generateTempUUID(entityType: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${entityType.toLowerCase()}-temp-${timestamp}-${random}`;
  }
}

export interface IBaseEntity {
  id: string | number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILegacyEntity extends IBaseEntity {
  legacyId?: number; // Pour compatibilité descendante
}

