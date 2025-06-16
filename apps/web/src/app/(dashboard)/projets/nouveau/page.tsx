// apps/web/src/app/(dashboard)/projets/nouveau/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader, ProjetForm } from '@erp/ui'
import { useClients } from '@/hooks/use-clients'
import { useCreateProjet } from '@/hooks/use-projets'
import type { ProjetFormData } from '@erp/types'

export default function NouveauProjetPage() {
  const router = useRouter()
  const { data: clients = [] } = useClients()
  const createProjet = useCreateProjet()

  const handleSubmit = async (data: ProjetFormData) => {
    try {
      await createProjet.mutateAsync(data)
      router.push('/projets')
    } catch (error) {
      console.error('Erreur création projet:', error)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau projet"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projets', href: '/projets' },
          { label: 'Nouveau' },
        ]}
        backButton={{
          onClick: handleCancel,
        }}
      />

      <div className="px-6 max-w-4xl">
        <ProjetForm
          clients={clients}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createProjet.isPending}
        />
      </div>
    </div>
  )
}