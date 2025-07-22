'use client'

import { useState, useEffect, useCallback } from 'react'

export interface CompanyInfo {
  id: string
  name: string
  siret?: string
  vat?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  logo?: string // URL du logo
}

export function useCompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCompanyInfo = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/company')
      
      if (!response.ok) {
        // Si l'endpoint n'existe pas encore, utiliser des données par défaut
        if (response.status === 404) {
          setCompanyInfo({
            id: 'main-company',
            name: 'TopSteel',
            siret: '12345678901234',
            vat: 'FR12345678901',
            address: '123 Rue de l\'Industrie',
            city: 'Paris',
            postalCode: '75001',
            country: 'France',
            phone: '+33 1 23 45 67 89',
            email: 'contact@topsteel.tech',
            website: 'https://topsteel.tech',
            logo: undefined // Pas de logo par défaut
          })
          return
        }
        
        throw new Error(`Erreur lors du chargement (${response.status})`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setCompanyInfo(data.data)
      } else {
        throw new Error(data.message || 'Erreur lors du chargement des informations')
      }
    } catch (err) {
      console.error('Erreur lors du chargement des informations entreprise:', err)
      
      // En cas d'erreur, utiliser des données par défaut
      setCompanyInfo({
        id: 'main-company',
        name: 'TopSteel',
        siret: '12345678901234',
        vat: 'FR12345678901',
        address: '123 Rue de l\'Industrie',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        phone: '+33 1 23 45 67 89',
        email: 'contact@topsteel.tech',
        website: 'https://topsteel.tech',
        logo: undefined
      })
      
      // Ne pas afficher d'erreur pour ne pas gêner l'utilisateur
      // setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCompanyInfo = useCallback(async (updates: Partial<CompanyInfo>) => {
    try {
      const response = await fetch('/api/admin/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la mise à jour (${response.status})`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setCompanyInfo(data.data)
        return true
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err)
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
      return false
    }
  }, [])

  useEffect(() => {
    loadCompanyInfo()
  }, [loadCompanyInfo])

  return {
    companyInfo,
    loading,
    error,
    loadCompanyInfo,
    updateCompanyInfo
  }
}