import { Module } from '@nestjs/common'

/**
 * Module central pour tous les domaines métier
 *
 * ⚠️ CLEANUP: Domaines métier retirés vers applications dédiées
 * - Partners → Supprimé (branche cleanup/remove-business-logic)
 * - Inventory → Supprimé (branche cleanup/remove-business-logic)
 * - Materials → Supprimé (branche cleanup/remove-business-logic)
 *
 * TopSteel = Infrastructure uniquement (Auth, Users, Societes, Licensing, etc.)
 */
@Module({
  imports: [],
  exports: [],
})
export class BusinessModule {}
