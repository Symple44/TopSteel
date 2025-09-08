/**
 * 🏢 ENTITÉS MÉTIER - DOMAINE ORGANIZATION
 * Logique métier pure pour l'organisation
 */
// ===== ENUMS MÉTIER =====
export var DepartementType
;((DepartementType) => {
  DepartementType['PRODUCTION'] = 'PRODUCTION'
  DepartementType['COMMERCIAL'] = 'COMMERCIAL'
  DepartementType['COMPTABILITE'] = 'COMPTABILITE'
  DepartementType['DIRECTION'] = 'DIRECTION'
  DepartementType['QUALITE'] = 'QUALITE'
  DepartementType['MAINTENANCE'] = 'MAINTENANCE'
  DepartementType['LOGISTIQUE'] = 'LOGISTIQUE'
})(DepartementType || (DepartementType = {}))
export var SiteType
;((SiteType) => {
  SiteType['SIEGE'] = 'SIEGE'
  SiteType['ATELIER'] = 'ATELIER'
  SiteType['DEPOT'] = 'DEPOT'
  SiteType['BUREAU'] = 'BUREAU'
})(SiteType || (SiteType = {}))
//# sourceMappingURL=entities.js.map
