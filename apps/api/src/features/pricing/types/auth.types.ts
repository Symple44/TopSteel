import type { User } from '../../../domains/users/entities/user.entity'

/**
 * Interface pour l'utilisateur authentifié avec le contexte de société
 */
export interface AuthenticatedUser extends User {
  societeId?: string
  currentSocieteId?: string
}
