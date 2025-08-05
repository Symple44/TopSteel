import { Entity, OneToMany } from 'typeorm'
import { Site } from './site.entity'

// Re-export shared entities from the @erp/entities package
export {
  SocietePlan,
  SocieteStatus,
} from '@erp/entities'

// Import the base class for extending with relationships
import { Societe as BaseSociete } from '@erp/entities'

// Extended Societe entity with local relationships
@Entity('societes')
export class Societe extends BaseSociete {
  // Relations
  @OneToMany(
    () => Site,
    (site) => site.societe
  )
  sites!: Site[]
}
