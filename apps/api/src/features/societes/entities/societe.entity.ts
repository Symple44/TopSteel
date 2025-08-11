import { Entity, OneToMany, OneToOne } from 'typeorm'
import { Site } from './site.entity'
import { SocieteLicense } from './societe-license.entity'

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

  // Relation avec la licence
  @OneToOne(
    () => SocieteLicense,
    (license) => license.societe,
    { nullable: true }
  )
  license?: SocieteLicense
}
