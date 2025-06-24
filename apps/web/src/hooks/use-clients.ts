import { useState, useEffect } from 'react'

export interface Client {
  id: string
  nom: string
  email: string
  telephone: string
  type: string
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des clients
    setTimeout(() => {
      setClients([
        { id: '1', nom: 'Client A', email: 'a@test.fr', telephone: '0123456789', type: 'PROFESSIONNEL' },
        { id: '2', nom: 'Client B', email: 'b@test.fr', telephone: '0123456790', type: 'PARTICULIER' },
      ])
      setLoading(false)
    }, 500)
  }, [])

  return { clients, loading }
}
