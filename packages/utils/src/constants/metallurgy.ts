// packages/utils/src/constants/metallurgy.ts
export const MATERIAUX_ACIER = {
  S235: { designation: 'Acier de construction S235', densite: 7.85, limite_elastique: 235 },
  S355: { designation: 'Acier de construction S355', densite: 7.85, limite_elastique: 355 },
  INOX_304: { designation: 'Inox 304', densite: 8.0, limite_elastique: 200 },
  INOX_316: { designation: 'Inox 316', densite: 8.0, limite_elastique: 200 },
  ALUMINIUM: { designation: 'Aluminium 6060', densite: 2.7, limite_elastique: 160 },
} as const

export const PROFILES_STANDARD = {
  // Tubes rectangulaires
  TUBE_RECT_40X20X2: { designation: 'Tube rectangle 40x20x2', section: 2.26, poids_metre: 1.77 },
  TUBE_RECT_50X30X2: { designation: 'Tube rectangle 50x30x2', section: 2.86, poids_metre: 2.25 },
  TUBE_RECT_60X40X3: { designation: 'Tube rectangle 60x40x3', section: 5.13, poids_metre: 4.03 },

  // Tubes carrés
  TUBE_CARRE_20X20X2: { designation: 'Tube carré 20x20x2', section: 1.46, poids_metre: 1.15 },
  TUBE_CARRE_30X30X2: { designation: 'Tube carré 30x30x2', section: 2.26, poids_metre: 1.77 },
  TUBE_CARRE_40X40X3: { designation: 'Tube carré 40x40x3', section: 4.33, poids_metre: 3.4 },

  // Plats
  PLAT_30X3: { designation: 'Plat 30x3', section: 0.9, poids_metre: 0.71 },
  PLAT_40X4: { designation: 'Plat 40x4', section: 1.6, poids_metre: 1.26 },
  PLAT_50X5: { designation: 'Plat 50x5', section: 2.5, poids_metre: 1.96 },
} as const

export const UNITES_MESURE = {
  longueur: ['mm', 'cm', 'm'],
  poids: ['g', 'kg', 't'],
  surface: ['mm²', 'cm²', 'm²'],
  volume: ['mm³', 'cm³', 'm³', 'l'],
  angle: ['°', 'rad'],
  temps: ['min', 'h', 'j'],
} as const
