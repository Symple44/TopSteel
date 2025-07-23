'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function QueryBuilderPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/query-builder/new')
  }, [router])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Bienvenue dans Query Builder</h2>
        <p className="text-muted-foreground">
          Sélectionnez un query builder existant ou créez-en un nouveau
        </p>
      </div>
    </div>
  )
}