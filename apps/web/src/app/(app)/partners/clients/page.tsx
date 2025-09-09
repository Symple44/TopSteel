'use client'

import type { Partner, PartnerFilters, PartnerStatistics, PartnerStatus } from '@erp/types'
import { PartnerType } from '@erp/types'
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
import type { ColumnConfig } from '@erp/ui/components/data-display/datatable/types'
import { Briefcase, Download, Plus, Upload } from 'lucide-react'
import { useState } from 'react'
import { PartnerDetailDialog } from '@/components/partners/partner-detail-dialog'
import { PartnerFormDialog } from '@/components/partners/partner-form-dialog'
import { useDeletePartner, usePartnerStatistics, usePartners } from '@/hooks/use-partners'
import { formatCurrency } from '@/lib/utils'

export default function ClientsPage() {
  const [filters, setFilters] = useState<PartnerFilters>({ type: [PartnerType.CLIENT] })
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)

  const partnersQuery = usePartners(filters)
  const { data: partnersResponse, isLoading } = partnersQuery
  const partners = partnersResponse?.items ?? []
  const statisticsQuery = usePartnerStatistics()
  const { data: statistics }: { data: PartnerStatistics | undefined } = statisticsQuery
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
      await deletePartner?.mutateAsync(partner.id)
    }
  }

  const columns: ColumnConfig<Partner>[] = [
    {
      id: 'code',
      key: 'code',
      title: 'Code',
      sortable: true,
      width: 120,
      type: 'text',
    },
    {
      id: 'denomination',
      key: 'denomination',
      title: 'Dénomination',
      sortable: true,
      type: 'text',
    },
    {
      id: 'category',
      key: 'category',
      title: 'Catégorie',
      width: 150,
      type: 'text',
    },
    {
      id: 'ville',
      key: 'ville',
      title: 'Ville',
      sortable: true,
      type: 'text',
    },
    {
      id: 'telephone',
      key: 'telephone',
      title: 'Téléphone',
      width: 150,
      type: 'text',
    },
    {
      id: 'email',
      key: 'email',
      title: 'Email',
      width: 200,
      type: 'text',
    },
    {
      id: 'plafondCredit',
      key: 'plafondCredit',
      title: 'Plafond crédit',
      width: 150,
      type: 'text',
      render: (_value: unknown, partner: Partner, _column: ColumnConfig<Partner>) =>
        partner.plafondCredit ? formatCurrency(partner.plafondCredit) : '-',
    },
    {
      id: 'status',
      key: 'status',
      title: 'Statut',
      width: 120,
      type: 'text',
      render: (_value: unknown, partner: Partner, _column: ColumnConfig<Partner>) => (
        <Badge variant={partner.status === 'ACTIF' ? 'default' : 'secondary'}>
          {partner.status}
        </Badge>
      ),
    },
    {
      id: 'group',
      key: 'group',
      title: 'Groupe',
      width: 150,
      type: 'text',
      render: (_value: unknown, partner: Partner, _column: ColumnConfig<Partner>) =>
        partner.group?.name || '-',
    },
  ]

  // const _actions = [...] removed - unused actions array

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Gérez vos clients et prospects</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Importer
          </Button>
          <Button type="button" variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button type="button" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalClients}</div>
              <p className="text-xs text-muted-foreground">Clients enregistrés</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prospects</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalProspects}</div>
              <p className="text-xs text-muted-foreground">En cours de conversion</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Groupes tarifaires</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(statistics.repartitionParGroupe || {}).length}
              </div>
              <p className="text-xs text-muted-foreground">Groupes actifs</p>
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
              onValueChange={(value: string) =>
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
                <SelectItem value="PROSPECT">Prospect</SelectItem>
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
            data={partners as any}
            columns={columns as any}
            keyField="id"
            loading={isLoading}
            searchable
            sortable
            selectable
            actions={[
              {
                label: 'Voir',
                onClick: handleView as any,
              },
              {
                label: 'Modifier',
                onClick: handleEdit as any,
              },
              {
                label: 'Supprimer',
                onClick: handleDelete as any,
                variant: 'destructive' as const,
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      {isFormOpen && (
        <PartnerFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          partner={editingPartner}
          defaultType="CLIENT"
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
