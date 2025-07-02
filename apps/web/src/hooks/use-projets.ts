// apps/web/src/hooks/use-projets.ts - SANS ZUSTAND
import { useState, useEffect, useCallback } from 'react'

// Mock data pour éviter les erreurs API
const mockProjets = [
  {
    id: '1',
    reference: 'PROJ-2024-001',
    titre: 'Hangar Industriel A',
    description: 'Construction hangar 1200m²',
    statut: 'En cours',
    montantHT: 150000,
    dateDebut: new Date('2024-01-15'),
    dateFin: new Date('2024-06-30'),
    avancement: 65,
    client: {
      id: '1',
      nom: 'Industrie Corp',
      email: 'contact@industrie.com'
    }
  },
  {
    id: '2',
    reference: 'PROJ-2024-002',
    titre: 'Rénovation Usine B',
    description: 'Rénovation structure métallique',
    statut: 'Planifié',
    montantHT: 89000,
    dateDebut: new Date('2024-03-01'),
    dateFin: new Date('2024-08-15'),
    avancement: 25,
    client: {
      id: '2',
      nom: 'Metal Works',
      email: 'info@metalworks.com'
    }
  },
  {
    id: '3',
    reference: 'PROJ-2024-003',
    titre: 'Charpente Centre Commercial',
    description: 'Charpente métallique 2500m²',
    statut: 'Terminé',
    montantHT: 320000,
    dateDebut: new Date('2023-09-01'),
    dateFin: new Date('2024-02-28'),
    avancement: 100,
    client: {
      id: '3',
      nom: 'Commercial Center SA',
      email: 'projets@commercial-center.fr'
    }
  }
]

export const useProjets = () => {
  const [projets, setProjets] = useState(mockProjets)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Simulation fetch (pour éviter erreurs API)
  const fetchProjets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    // Simuler délai API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      // Ici on pourrait appeler l'API réelle
      // const response = await projetService.getAll()
      // setProjets(response.data)
      
      setProjets(mockProjets)
    } catch (err) {
      setError('Erreur lors du chargement des projets')
      console.error('Fetch projets error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-fetch au montage
  useEffect(() => {
    fetchProjets()
  }, [fetchProjets])

  const refetchWithFilters = useCallback(() => {
    return fetchProjets()
  }, [fetchProjets])

  return {
    projets,
    isLoading,
    error,
    fetchProjets,
    refetchWithFilters,
    refetch: fetchProjets
  }
}

export const useProjet = (id?: string) => {
  const [projet, setProjet] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setProjet(null)
      return
    }

    setIsLoading(true)
    
    // Simuler fetch projet spécifique
    setTimeout(() => {
      const foundProjet = mockProjets.find(p => p.id === id)
      setProjet(foundProjet || null)
      setIsLoading(false)
      
      if (!foundProjet) {
        setError('Projet non trouvé')
      }
    }, 300)
  }, [id])

  return {
    projet,
    data: projet,
    isLoading,
    error
  }
}
