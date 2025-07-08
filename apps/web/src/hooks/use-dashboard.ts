import { useEffect, useState } from 'react'

export interface DashboardStats {
  totalClients: number
  totalProjets: number
  chiffreAffaires: number
  ordresFabrication: number
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalProjets: 0,
    chiffreAffaires: 0,
    ordresFabrication: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setStats({
        totalClients: 25,
        totalProjets: 48,
        chiffreAffaires: 1250000,
        ordresFabrication: 12,
      })
      setLoading(false)
    }, 1000)
  }, [])

  return { stats, loading }
}




