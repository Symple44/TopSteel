'use client'
import { Building, Check, Mail, MapPin, Phone, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar, AvatarFallback } from '../../../data-display/avatar'
import { Badge } from '../../../data-display/badge'
import { Card, CardContent } from '../../../layout/card/Card'
import { ScrollArea } from '../../../layout/scroll-area/ScrollArea'
import { Separator } from '../../../layout/separator'
import { Button } from '../../../primitives/button/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../primitives/dialog/Dialog'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
// Client type for selection
export interface SelectableClient {
  id: string
  companyName: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  contactPhone: string
  contactPosition?: string
  address: string
  city: string
  postalCode: string
  country: string
  sector?: string
  companyType: 'SARL' | 'SAS' | 'SA' | 'EI' | 'EURL' | 'SCI' | 'Autre'
  isActive: boolean
  creditLimit: number
  creditUsed: number
  lastOrderDate?: Date
  totalOrders?: number
}
interface ClientSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (selectedClient: SelectableClient) => void
  clients?: SelectableClient[] // List of available clients
  excludeIds?: string[] // Clients to exclude from selection
  title?: string // Custom title
  multiple?: boolean // Allow multiple selection (future feature)
}
export function ClientSelectorDialog({
  open,
  onOpenChange,
  onSubmit,
  clients = [],
  excludeIds = [],
  title = 'Sélectionner un client',
}: ClientSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<SelectableClient | null>(null)
  const [loading, setLoading] = useState(false)
  // Filters
  const [sectorFilter, setSectorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>('all')
  // Filter and search clients
  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => !excludeIds.includes(client.id))
      .filter((client) => {
        // Search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase()
          return (
            client.companyName.toLowerCase().includes(search) ||
            client.contactFirstName.toLowerCase().includes(search) ||
            client.contactLastName.toLowerCase().includes(search) ||
            client.contactEmail.toLowerCase().includes(search) ||
            client.city.toLowerCase().includes(search) ||
            client.sector?.toLowerCase().includes(search)
          )
        }
        return true
      })
      .filter((client) => {
        // Sector filter
        if (sectorFilter !== 'all') {
          return client.sector === sectorFilter
        }
        return true
      })
      .filter((client) => {
        // Status filter
        if (statusFilter === 'active') return client.isActive
        if (statusFilter === 'inactive') return !client.isActive
        return true
      })
      .filter((client) => {
        // Company type filter
        if (companyTypeFilter !== 'all') {
          return client.companyType === companyTypeFilter
        }
        return true
      })
      .sort((a, b) => a.companyName.localeCompare(b.companyName))
  }, [clients, excludeIds, searchTerm, sectorFilter, statusFilter, companyTypeFilter])
  // Get unique sectors for filter dropdown
  const availableSectors = useMemo(() => {
    const sectors = clients
      .map((client) => client.sector)
      .filter((sector): sector is string => !!sector)
    return Array.from(new Set(sectors)).sort()
  }, [clients])
  const handleClientSelect = (client: SelectableClient) => {
    setSelectedClient(client)
  }
  const handleSubmit = async () => {
    if (!selectedClient) return
    try {
      setLoading(true)
      await onSubmit?.(selectedClient)
      onOpenChange(false)
      setSelectedClient(null)
      setSearchTerm('')
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }
  const handleClose = () => {
    setSelectedClient(null)
    setSearchTerm('')
    setSectorFilter('all')
    setStatusFilter('all')
    setCompanyTypeFilter('all')
    onOpenChange(false)
  }
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }
  const getCreditStatus = (limit: number, used: number) => {
    if (limit === 0) return { status: 'none', percentage: 0 }
    const percentage = (used / limit) * 100
    if (percentage >= 90) return { status: 'danger', percentage }
    if (percentage >= 75) return { status: 'warning', percentage }
    return { status: 'good', percentage }
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, contact, email, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
              <Select value={companyTypeFilter} onValueChange={setCompanyTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="SARL">SARL</SelectItem>
                  <SelectItem value="SAS">SAS</SelectItem>
                  <SelectItem value="SA">SA</SelectItem>
                  <SelectItem value="EI">EI</SelectItem>
                  <SelectItem value="EURL">EURL</SelectItem>
                  <SelectItem value="SCI">SCI</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              {availableSectors.length > 0 && (
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous secteurs</SelectItem>
                    {availableSectors.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          {/* Results count */}
          <div className="text-sm text-gray-500">
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} trouvé
            {filteredClients.length !== 1 ? 's' : ''}
          </div>
          {/* Client List */}
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {filteredClients.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Aucun client trouvé</p>
                  <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const creditStatus = getCreditStatus(client.creditLimit, client.creditUsed)
                  const isSelected = selectedClient?.id === client.id
                  return (
                    <Card
                      key={client.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      } ${client.isActive ? '' : 'opacity-60'}`}
                      onClick={() => handleClientSelect(client)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getInitials(client.contactFirstName, client.contactLastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{client.companyName}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {client.companyType}
                                </Badge>
                                {!client.isActive && (
                                  <Badge variant="destructive" className="text-xs">
                                    Inactif
                                  </Badge>
                                )}
                                {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                              </div>
                              <div className="text-sm text-gray-600">
                                <p className="font-medium">
                                  {client.contactFirstName} {client.contactLastName}
                                  {client.contactPosition && (
                                    <span className="text-gray-500">
                                      {' '}
                                      • {client.contactPosition}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {client.contactEmail}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {client.contactPhone}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {client.city} ({client.postalCode})
                                </div>
                              </div>
                              {client.sector && (
                                <Badge variant="secondary" className="text-xs w-fit">
                                  {client.sector}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            {client.creditLimit > 0 && (
                              <div className="text-xs">
                                <div
                                  className={`font-medium ${
                                    creditStatus.status === 'danger'
                                      ? 'text-red-600'
                                      : creditStatus.status === 'warning'
                                        ? 'text-orange-600'
                                        : 'text-green-600'
                                  }`}
                                >
                                  Crédit: {creditStatus.percentage.toFixed(0)}%
                                </div>
                                <div className="text-gray-500">
                                  {client.creditUsed.toLocaleString()}€ /{' '}
                                  {client.creditLimit.toLocaleString()}€
                                </div>
                              </div>
                            )}
                            {client.lastOrderDate && (
                              <div className="text-xs text-gray-500">
                                Dernière commande:
                                <br />
                                {client.lastOrderDate.toLocaleDateString('fr-FR')}
                              </div>
                            )}
                            {client.totalOrders && (
                              <div className="text-xs text-gray-500">
                                {client.totalOrders} commande{client.totalOrders > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </ScrollArea>
          <Separator />
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {selectedClient && (
                <span>
                  Client sélectionné: <strong>{selectedClient.companyName}</strong>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={!selectedClient || loading}>
                {loading ? 'Sélection...' : 'Sélectionner ce client'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
