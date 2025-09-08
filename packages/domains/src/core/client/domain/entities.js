/**
 * 🏢 ENTITÉS MÉTIER - DOMAINE CLIENT
 * Logique métier pure pour les clients
 */
// ===== ENUMS MÉTIER =====
export var ClientType
;((ClientType) => {
  ClientType['PARTICULIER'] = 'PARTICULIER'
  ClientType['PROFESSIONNEL'] = 'PROFESSIONNEL'
  ClientType['COLLECTIVITE'] = 'COLLECTIVITE'
})(ClientType || (ClientType = {}))
export var ClientStatut
;((ClientStatut) => {
  ClientStatut['ACTIF'] = 'ACTIF'
  ClientStatut['INACTIF'] = 'INACTIF'
  ClientStatut['SUSPENDU'] = 'SUSPENDU'
  ClientStatut['ARCHIVE'] = 'ARCHIVE'
})(ClientStatut || (ClientStatut = {}))
export var ClientPriorite
;((ClientPriorite) => {
  ClientPriorite['BASSE'] = 'BASSE'
  ClientPriorite['NORMALE'] = 'NORMALE'
  ClientPriorite['HAUTE'] = 'HAUTE'
  ClientPriorite['VIP'] = 'VIP'
})(ClientPriorite || (ClientPriorite = {}))
//# sourceMappingURL=entities.js.map
