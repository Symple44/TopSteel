/**
 * 💰 ENTITÉS MÉTIER - DOMAINE QUOTES (DEVIS)
 * Logique métier pure pour les devis
 */
// ===== ENUMS MÉTIER =====
export var QuoteStatut
;((QuoteStatut) => {
  QuoteStatut['BROUILLON'] = 'BROUILLON'
  QuoteStatut['EN_ATTENTE'] = 'EN_ATTENTE'
  QuoteStatut['ENVOYE'] = 'ENVOYE'
  QuoteStatut['ACCEPTE'] = 'ACCEPTE'
  QuoteStatut['REFUSE'] = 'REFUSE'
  QuoteStatut['EXPIRE'] = 'EXPIRE'
  QuoteStatut['ANNULE'] = 'ANNULE'
})(QuoteStatut || (QuoteStatut = {}))
export var QuoteType
;((QuoteType) => {
  QuoteType['STANDARD'] = 'STANDARD'
  QuoteType['EXPRESS'] = 'EXPRESS'
  QuoteType['SUR_MESURE'] = 'SUR_MESURE'
  QuoteType['MAINTENANCE'] = 'MAINTENANCE'
})(QuoteType || (QuoteType = {}))
//# sourceMappingURL=entities.js.map
