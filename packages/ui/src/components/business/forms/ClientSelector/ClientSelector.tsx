'use client'
import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, Search, Plus, Building2, User, AlertCircle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Button } from '../../../primitives/button/Button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../../../navigation'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../primitives'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
export interface Client {
  id: string
  code: string
  name: string
  type: 'company' | 'individual'
  email?: string
  phone?: string
  vatNumber?: string
  status: 'active' | 'inactive' | 'suspended'
  creditLimit?: number
  outstandingBalance?: number
  tags?: string[]
  lastOrderDate?: Date
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}
interface ClientSelectorProps {
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  onClientCreate?: () => void
  clients?: Client[]
  loading?: boolean
  error?: string
  multiple?: boolean
  required?: boolean
  disabled?: boolean
  placeholder?: string
  label?: string
  helperText?: string
  showStatus?: boolean
  showBalance?: boolean
  showCreateButton?: boolean
  filterByStatus?: Client['status'][]
  filterByType?: Client['type'][]
  maxSelections?: number
  className?: string
}
export function ClientSelector({
  value,
  onChange,
  onClientCreate,
  clients = [],
  loading = false,
  error,
  multiple = false,
  required = false,
  disabled = false,
  placeholder = "Sélectionner un client...",
  label,
  helperText,
  showStatus = true,
  showBalance = false,
  showCreateButton = true,
  filterByStatus,
  filterByType,
  maxSelections,
  className,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClients, setSelectedClients] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  )
  useEffect(() => {
    if (multiple && Array.isArray(value)) {
      setSelectedClients(value)
    } else if (!multiple && typeof value === 'string') {
      setSelectedClients(value ? [value] : [])
    }
  }, [value, multiple])
  const filteredClients = clients.filter(client => {
    if (filterByStatus && !filterByStatus.includes(client.status)) return false
    if (filterByType && !filterByType.includes(client.type)) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(query) ||
      client.code.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.vatNumber?.toLowerCase().includes(query)
    )
  })
  const handleSelect = useCallback((clientId: string) => {
    if (multiple) {
      const newSelection = selectedClients.includes(clientId)
        ? selectedClients.filter(id => id !== clientId)
        : [...selectedClients, clientId]
      if (maxSelections && newSelection.length > maxSelections) {
        return
      }
      setSelectedClients(newSelection)
      onChange?.(newSelection)
    } else {
      setSelectedClients([clientId])
      onChange?.(clientId)
      setOpen(false)
    }
  }, [selectedClients, multiple, maxSelections, onChange])
  const getSelectedClientsDisplay = () => {
    if (selectedClients.length === 0) return placeholder
    if (multiple) {
      if (selectedClients.length === 1) {
        const client = clients.find(c => c.id === selectedClients[0])
        return client?.name || 'Client sélectionné'
      }
      return `${selectedClients.length} clients sélectionnés`
    } else {
      const client = clients.find(c => c.id === selectedClients[0])
      return client?.name || 'Client sélectionné'
    }
  }
  const getStatusBadge = (status: Client['status']) => {
    const variants = {
      active: { label: 'Actif', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-800' },
      suspended: { label: 'Suspendu', className: 'bg-red-100 text-red-800' },
    }
    const variant = variants[status]
    return <Badge className={`${variant.className} text-xs`}>{variant.label}</Badge>
  }
  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="client-selector">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="client-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              'w-full justify-between',
              error && 'border-red-500',
              !selectedClients.length && 'text-muted-foreground'
            )}
          >
            <span className="truncate">{getSelectedClientsDisplay()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm">
                Aucun client trouvé.
                {showCreateButton && onClientCreate && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setOpen(false)
                      onClientCreate()
                    }}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un nouveau client
                  </Button>
                )}
              </CommandEmpty>
              {loading ? (
                <div className="py-6 text-center text-sm">
                  <div className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  <p className="mt-2">Chargement des clients...</p>
                </div>
              ) : (
                <>
                  <CommandGroup heading="Entreprises">
                    {filteredClients
                      .filter(client => client.type === 'company')
                      .map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.id}
                          onSelect={() => handleSelect(client.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{client.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {client.code} {client.vatNumber && `• TVA: ${client.vatNumber}`}
                                </div>
                                {client.address && (
                                  <div className="text-xs text-muted-foreground">
                                    {client.address.city}, {client.address.country}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {showBalance && client.outstandingBalance !== undefined && client.outstandingBalance > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {formatCurrency(client.outstandingBalance)}
                                </Badge>
                              )}
                              {showStatus && getStatusBadge(client.status)}
                              {selectedClients.includes(client.id) && (
                                <Check className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Particuliers">
                    {filteredClients
                      .filter(client => client.type === 'individual')
                      .map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.id}
                          onSelect={() => handleSelect(client.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{client.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {client.code} {client.email && `• ${client.email}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {showBalance && client.outstandingBalance !== undefined && client.outstandingBalance > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {formatCurrency(client.outstandingBalance)}
                                </Badge>
                              )}
                              {showStatus && getStatusBadge(client.status)}
                              {selectedClients.includes(client.id) && (
                                <Check className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            {showCreateButton && onClientCreate && (
              <div className="border-t p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setOpen(false)
                    onClientCreate()
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un nouveau client
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      {helperText && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {multiple && maxSelections && (
        <p className="text-xs text-muted-foreground">
          {selectedClients.length}/{maxSelections} sélections maximum
        </p>
      )}
    </div>
  )
}
