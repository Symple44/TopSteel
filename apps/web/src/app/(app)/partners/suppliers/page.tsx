'use client'

import type { Partner, PartnerFilters, PartnerStatus } from '@erp/types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@erp/ui'
import { Building2, Download, Plus, Upload } from 'lucide-react'
import { useState } from 'react'
import { PartnerDetailDialog } from '@/components/partners/partner-detail-dialog'
import { PartnerFormDialog } from '@/components/partners/partner-form-dialog'
import { useDeletePartner, usePartnerStatistics, usePartners } from '@/hooks/use-partners'

export default function SuppliersPage() {
  const [filters, setFilters] = useState<PartnerFilters>({ type: ['FOURNISSEUR'] })
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)

  const { data: partners = [], isLoading } = usePartners(filters)
  const { data: statistics } = usePartnerStatistics()
  const deletePartner = useDeletePartner()

  const handleCreate = () => {
    setEditingPartner(null)
    setIsFormOpen(true)
  }

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner)
    setIsFormOpen(true)
  }

  const handleView = (partner: Partner) => {
    setSelectedPartner(partner)
    setIsDetailOpen(true)
  }

  const handleDelete = async (partner: Partner) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${partner.denomination} ?`)) {
      await deletePartner.mutateAsync(partner.id)
    }
  }

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: 120,
    },
    {
      key: 'denomination',
      label: 'Dénomination',
      sortable: true,
      searchable: true,
    },
    {
      key: 'category',
      label: 'Catégorie',
      width: 150,
    },
    {
      key: 'ville',
      label: 'Ville',
      sortable: true,
      searchable: true,
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      width: 150,
    },
    {
      key: 'email',
      label: 'Email',
      width: 200,
    },
    {
      key: 'delaiPaiement',
      label: 'Délai paiement',
      width: 150,
      render: (value: number) => (value ? `${value} jours` : '-'),
    },
    {
      key: 'status',
      label: 'Statut',
      width: 120,
      render: (value: PartnerStatus) => {
        const variants: Record<PartnerStatus, 'default' | 'secondary' | 'destructive' | 'outline'> =
          {
            ACTIF: 'default',
            INACTIF: 'secondary',
            PROSPECT: 'outline',
            SUSPENDU: 'destructive',
            ARCHIVE: 'secondary',
          }
        return <Badge variant={variants[value]}>{value}</Badge>
      },
    },
    {
      key: 'group.name',
      label: 'Groupe',
      width: 150,
      render: (_: string | undefined, partner: Partner) => partner.group?.name || '-',
    },
  ]

  const actions = [
    {
      label: 'Voir',
      onClick: handleView,
    },
    {
      label: 'Modifier',
      onClick: handleEdit,
    },
    {
      label: 'Supprimer',
      onClick: handleDelete,
      variant: 'destructive' as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fournisseurs</h1>
          <p className="text-muted-foreground">Gérez vos fournisseurs et partenaires commerciaux</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Importer
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau fournisseur
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fournisseurs actifs</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalFournisseurs}</div>
              <p className="text-xs text-muted-foreground">Fournisseurs enregistrés</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspendus</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.partenairesSuspendus}</div>
              <p className="text-xs text-muted-foreground">Nécessitent une attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catégories</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(statistics.repartitionParGroupe || {}).length}
              </div>
              <p className="text-xs text-muted-foreground">Groupes de fournisseurs</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              value={filters.status?.[0] || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value === 'all' ? undefined : [value as PartnerStatus],
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ACTIF">Actif</SelectItem>
                <SelectItem value="INACTIF">Inactif</SelectItem>
                <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                <SelectItem value="ARCHIVE">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={partners}
            actions={actions}
            loading={isLoading}
            searchable
            selectable
            exportable
            pageSize={20}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      {isFormOpen && (
        <PartnerFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          partner={editingPartner}
          defaultType="FOURNISSEUR"
        />
      )}

      {isDetailOpen && selectedPartner && (
        <PartnerDetailDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          partner={selectedPartner}
          onEdit={() => {
            setIsDetailOpen(false)
            handleEdit(selectedPartner)
          }}
        />
      )}
    </div>
  )
}
