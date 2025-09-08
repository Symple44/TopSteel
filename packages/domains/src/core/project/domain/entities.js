/**
 * 🏗️ ENTITÉS MÉTIER - DOMAINE PROJECT
 * Logique métier pure pour les projets
 */
// ===== ENUMS MÉTIER =====
export var ProjetStatut
;((ProjetStatut) => {
  ProjetStatut['BROUILLON'] = 'BROUILLON'
  ProjetStatut['DEVIS'] = 'DEVIS'
  ProjetStatut['EN_ATTENTE'] = 'EN_ATTENTE'
  ProjetStatut['ACCEPTE'] = 'ACCEPTE'
  ProjetStatut['EN_COURS'] = 'EN_COURS'
  ProjetStatut['EN_PAUSE'] = 'EN_PAUSE'
  ProjetStatut['TERMINE'] = 'TERMINE'
  ProjetStatut['FACTURE'] = 'FACTURE'
  ProjetStatut['ANNULE'] = 'ANNULE'
})(ProjetStatut || (ProjetStatut = {}))
export var ProjetType
;((ProjetType) => {
  ProjetType['STANDARD'] = 'STANDARD'
  ProjetType['EXPRESS'] = 'EXPRESS'
  ProjetType['MAINTENANCE'] = 'MAINTENANCE'
  ProjetType['CONCEPTION'] = 'CONCEPTION'
  ProjetType['FABRICATION'] = 'FABRICATION'
  ProjetType['INSTALLATION'] = 'INSTALLATION'
})(ProjetType || (ProjetType = {}))
export var ProjetPriorite
;((ProjetPriorite) => {
  ProjetPriorite['BASSE'] = 'BASSE'
  ProjetPriorite['NORMALE'] = 'NORMALE'
  ProjetPriorite['HAUTE'] = 'HAUTE'
  ProjetPriorite['URGENTE'] = 'URGENTE'
})(ProjetPriorite || (ProjetPriorite = {}))
//# sourceMappingURL=entities.js.map
