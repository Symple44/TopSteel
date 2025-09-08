/**
 * 🏭 ENTITÉS MÉTIER - DOMAINE PRODUCTION
 * Logique métier pure pour la production
 */
// ===== ENUMS MÉTIER =====
export var OrdreStatut
;((OrdreStatut) => {
  OrdreStatut['BROUILLON'] = 'BROUILLON'
  OrdreStatut['PLANIFIE'] = 'PLANIFIE'
  OrdreStatut['EN_COURS'] = 'EN_COURS'
  OrdreStatut['SUSPENDU'] = 'SUSPENDU'
  OrdreStatut['TERMINE'] = 'TERMINE'
  OrdreStatut['ANNULE'] = 'ANNULE'
  OrdreStatut['LIVRE'] = 'LIVRE'
})(OrdreStatut || (OrdreStatut = {}))
export var OrdrePriorite
;((OrdrePriorite) => {
  OrdrePriorite['BASSE'] = 'BASSE'
  OrdrePriorite['NORMALE'] = 'NORMALE'
  OrdrePriorite['HAUTE'] = 'HAUTE'
  OrdrePriorite['URGENTE'] = 'URGENTE'
})(OrdrePriorite || (OrdrePriorite = {}))
export var StatutProduction
;((StatutProduction) => {
  StatutProduction['NON_COMMENCE'] = 'NON_COMMENCE'
  StatutProduction['EN_PREPARATION'] = 'EN_PREPARATION'
  StatutProduction['EN_COURS'] = 'EN_COURS'
  StatutProduction['EN_PAUSE'] = 'EN_PAUSE'
  StatutProduction['CONTROLE_QUALITE'] = 'CONTROLE_QUALITE'
  StatutProduction['TERMINE'] = 'TERMINE'
  StatutProduction['REJETE'] = 'REJETE'
})(StatutProduction || (StatutProduction = {}))
export var TypeOperation
;((TypeOperation) => {
  TypeOperation['DECOUPE'] = 'DECOUPE'
  TypeOperation['SOUDURE'] = 'SOUDURE'
  TypeOperation['ASSEMBLAGE'] = 'ASSEMBLAGE'
  TypeOperation['USINAGE'] = 'USINAGE'
  TypeOperation['PLIAGE'] = 'PLIAGE'
  TypeOperation['PEINTURE'] = 'PEINTURE'
  TypeOperation['FINITION'] = 'FINITION'
  TypeOperation['CONTROLE'] = 'CONTROLE'
})(TypeOperation || (TypeOperation = {}))
export var OperationStatut
;((OperationStatut) => {
  OperationStatut['EN_ATTENTE'] = 'EN_ATTENTE'
  OperationStatut['EN_COURS'] = 'EN_COURS'
  OperationStatut['TERMINEE'] = 'TERMINEE'
  OperationStatut['BLOQUEE'] = 'BLOQUEE'
  OperationStatut['ANNULEE'] = 'ANNULEE'
})(OperationStatut || (OperationStatut = {}))
export var PrioriteProduction
;((PrioriteProduction) => {
  PrioriteProduction['BASSE'] = 'BASSE'
  PrioriteProduction['NORMALE'] = 'NORMALE'
  PrioriteProduction['HAUTE'] = 'HAUTE'
  PrioriteProduction['CRITIQUE'] = 'CRITIQUE'
})(PrioriteProduction || (PrioriteProduction = {}))
export var QualiteStatut
;((QualiteStatut) => {
  QualiteStatut['EN_ATTENTE'] = 'EN_ATTENTE'
  QualiteStatut['EN_COURS'] = 'EN_COURS'
  QualiteStatut['CONFORME'] = 'CONFORME'
  QualiteStatut['NON_CONFORME'] = 'NON_CONFORME'
  QualiteStatut['A_REPRENDRE'] = 'A_REPRENDRE'
})(QualiteStatut || (QualiteStatut = {}))
export var MaterialStatus
;((MaterialStatus) => {
  MaterialStatus['DISPONIBLE'] = 'DISPONIBLE'
  MaterialStatus['COMMANDE'] = 'COMMANDE'
  MaterialStatus['EN_RECEPTION'] = 'EN_RECEPTION'
  MaterialStatus['MANQUANT'] = 'MANQUANT'
  MaterialStatus['RESERVE'] = 'RESERVE'
})(MaterialStatus || (MaterialStatus = {}))
//# sourceMappingURL=entities.js.map
