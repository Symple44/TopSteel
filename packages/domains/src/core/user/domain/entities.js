/**
 * 👤 ENTITÉS MÉTIER - DOMAINE USER
 * Logique métier pure pour les utilisateurs
 */
// ===== ENUMS MÉTIER =====
export var UserRole
;((UserRole) => {
  UserRole['ADMIN'] = 'ADMIN'
  UserRole['MANAGER'] = 'MANAGER'
  UserRole['TECHNICIEN'] = 'TECHNICIEN'
  UserRole['COMMERCIAL'] = 'COMMERCIAL'
  UserRole['COMPTABLE'] = 'COMPTABLE'
  UserRole['VIEWER'] = 'VIEWER'
})(UserRole || (UserRole = {}))
export var UserStatut
;((UserStatut) => {
  UserStatut['ACTIF'] = 'ACTIF'
  UserStatut['INACTIF'] = 'INACTIF'
  UserStatut['SUSPENDU'] = 'SUSPENDU'
  UserStatut['EN_ATTENTE'] = 'EN_ATTENTE'
})(UserStatut || (UserStatut = {}))
export var Competence
;((Competence) => {
  Competence['SOUDURE'] = 'SOUDURE'
  Competence['DECOUPE'] = 'DECOUPE'
  Competence['ASSEMBLAGE'] = 'ASSEMBLAGE'
  Competence['FINITION'] = 'FINITION'
  Competence['CONTROLE_QUALITE'] = 'CONTROLE_QUALITE'
  Competence['CONCEPTION'] = 'CONCEPTION'
  Competence['GESTION_PROJET'] = 'GESTION_PROJET'
  Competence['COMMERCIAL'] = 'COMMERCIAL'
  Competence['COMPTABILITE'] = 'COMPTABILITE'
})(Competence || (Competence = {}))
//# sourceMappingURL=entities.js.map
