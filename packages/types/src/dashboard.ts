// packages/types/src/dashboard.ts
export interface DashboardStats {
  projets: {
    total: number
    enCours: number
    termines: number
    enRetard: number
  }
  chiffreAffaires: {
    mensuel: number
    annuel: number
    objectif: number
    progression: number
  }
  production: {
    ordresEnCours: number
    ordresEnRetard: number
    tauxOccupation: number
    efficacite: number
  }
  stocks: {
    alertes: number
    ruptures: number
    valeurTotale: number
    mouvements: number
  }
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    fill?: boolean
  }[]
}