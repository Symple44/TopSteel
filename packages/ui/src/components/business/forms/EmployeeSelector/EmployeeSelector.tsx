'use client'
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Clock,
  Crown,
  Plus,
  Search,
  User,
  UserCheck,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useFormFieldIds } from '../../../../hooks/useFormFieldIds'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../navigation/dropdown-menu'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
export interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'admin' | 'manager' | 'supervisor' | 'operator' | 'technician' | 'engineer' | 'apprentice'
  department:
    | 'production'
    | 'quality'
    | 'logistics'
    | 'sales'
    | 'admin'
    | 'maintenance'
    | 'engineering'
  status: 'active' | 'inactive' | 'vacation' | 'sick' | 'busy'
  availability: 'available' | 'busy' | 'offline'
  skills?: string[]
  shift: 'morning' | 'afternoon' | 'night' | 'flexible'
  contractType: 'permanent' | 'temporary' | 'intern' | 'contractor'
  hireDate: Date
  supervisor?: {
    id: string
    name: string
  }
  certifications?: string[]
  workStation?: string
  hourlyRate?: number
  profileImage?: string
}
interface EmployeeSelectorProps {
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  onEmployeeCreate?: () => void
  employees?: Employee[]
  loading?: boolean
  error?: string
  multiple?: boolean
  required?: boolean
  disabled?: boolean
  placeholder?: string
  label?: string
  helperText?: string
  showRole?: boolean
  showDepartment?: boolean
  showStatus?: boolean
  showAvailability?: boolean
  showSkills?: boolean
  showCreateButton?: boolean
  filterByRole?: Employee['role'][]
  filterByDepartment?: Employee['department'][]
  filterByStatus?: Employee['status'][]
  filterByAvailability?: Employee['availability'][]
  filterByShift?: Employee['shift'][]
  maxSelections?: number
  excludeIds?: string[]
  className?: string
}
export function EmployeeSelector({
  value,
  onChange,
  onEmployeeCreate,
  employees = [],
  loading = false,
  error,
  multiple = false,
  required = false,
  disabled = false,
  placeholder = 'Sélectionner un employé...',
  label,
  helperText,
  showRole = true,
  showDepartment = false,
  showStatus = true,
  showAvailability = true,
  showSkills = false,
  showCreateButton = false,
  filterByRole,
  filterByDepartment,
  filterByStatus,
  filterByAvailability,
  filterByShift,
  maxSelections,
  excludeIds = [],
  className,
}: EmployeeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  )
  const ids = useFormFieldIds(['employeeSelector'])
  useEffect(() => {
    if (multiple && Array.isArray(value)) {
      setSelectedEmployees(value)
    } else if (!multiple && typeof value === 'string') {
      setSelectedEmployees(value ? [value] : [])
    }
  }, [value, multiple])
  const filteredEmployees = employees
    .filter((employee) => !excludeIds.includes(employee.id))
    .filter((employee) => {
      if (filterByRole && !filterByRole.includes(employee.role)) return false
      if (filterByDepartment && !filterByDepartment.includes(employee.department)) return false
      if (filterByStatus && !filterByStatus.includes(employee.status)) return false
      if (filterByAvailability && !filterByAvailability.includes(employee.availability))
        return false
      if (filterByShift && !filterByShift.includes(employee.shift)) return false
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        employee.firstName.toLowerCase().includes(query) ||
        employee.lastName.toLowerCase().includes(query) ||
        employee.employeeNumber.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.skills?.some((skill) => skill.toLowerCase().includes(query)) ||
        employee.workStation?.toLowerCase().includes(query)
      )
    })
  const handleSelect = useCallback(
    (employeeId: string) => {
      if (multiple) {
        const newSelection = selectedEmployees.includes(employeeId)
          ? selectedEmployees.filter((id) => id !== employeeId)
          : [...selectedEmployees, employeeId]
        if (maxSelections && newSelection.length > maxSelections) {
          return
        }
        setSelectedEmployees(newSelection)
        onChange?.(newSelection)
      } else {
        setSelectedEmployees([employeeId])
        onChange?.(employeeId)
        setOpen(false)
      }
    },
    [selectedEmployees, multiple, maxSelections, onChange]
  )
  const getSelectedEmployeesDisplay = () => {
    if (selectedEmployees.length === 0) return placeholder
    if (multiple) {
      if (selectedEmployees.length === 1) {
        const employee = employees.find((e) => e.id === selectedEmployees[0])
        return employee ? `${employee.firstName} ${employee.lastName}` : 'Employé sélectionné'
      }
      return `${selectedEmployees.length} employés sélectionnés`
    } else {
      const employee = employees.find((e) => e.id === selectedEmployees[0])
      return employee ? `${employee.firstName} ${employee.lastName}` : 'Employé sélectionné'
    }
  }
  const getRoleBadge = (role: Employee['role']) => {
    const variants = {
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800', icon: Crown },
      manager: { label: 'Manager', className: 'bg-blue-100 text-blue-800', icon: UserCheck },
      supervisor: {
        label: 'Superviseur',
        className: 'bg-green-100 text-green-800',
        icon: UserCheck,
      },
      operator: { label: 'Opérateur', className: 'bg-gray-100 text-gray-800', icon: User },
      technician: { label: 'Technicien', className: 'bg-yellow-100 text-yellow-800', icon: User },
      engineer: { label: 'Ingénieur', className: 'bg-indigo-100 text-indigo-800', icon: User },
      apprentice: { label: 'Apprenti', className: 'bg-orange-100 text-orange-800', icon: User },
    }
    const variant = variants[role]
    const IconComponent = variant.icon
    return (
      <Badge className={`${variant.className} text-xs flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {variant.label}
      </Badge>
    )
  }
  const getDepartmentBadge = (department: Employee['department']) => {
    const variants = {
      production: { label: 'Production', className: 'bg-red-100 text-red-800' },
      quality: { label: 'Qualité', className: 'bg-green-100 text-green-800' },
      logistics: { label: 'Logistique', className: 'bg-blue-100 text-blue-800' },
      sales: { label: 'Commercial', className: 'bg-purple-100 text-purple-800' },
      admin: { label: 'Admin', className: 'bg-gray-100 text-gray-800' },
      maintenance: { label: 'Maintenance', className: 'bg-yellow-100 text-yellow-800' },
      engineering: { label: 'Ingénierie', className: 'bg-indigo-100 text-indigo-800' },
    }
    const variant = variants[department]
    return <Badge className={`${variant.className} text-xs`}>{variant.label}</Badge>
  }
  const getStatusBadge = (status: Employee['status']) => {
    const variants = {
      active: { label: 'Actif', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-800' },
      vacation: { label: 'Congés', className: 'bg-blue-100 text-blue-800' },
      sick: { label: 'Arrêt maladie', className: 'bg-red-100 text-red-800' },
      busy: { label: 'Occupé', className: 'bg-yellow-100 text-yellow-800' },
    }
    const variant = variants[status]
    return <Badge className={`${variant.className} text-xs`}>{variant.label}</Badge>
  }
  const getAvailabilityBadge = (availability: Employee['availability']) => {
    const variants = {
      available: { label: 'Disponible', className: 'bg-green-100 text-green-800' },
      busy: { label: 'Occupé', className: 'bg-yellow-100 text-yellow-800' },
      offline: { label: 'Hors ligne', className: 'bg-gray-100 text-gray-800' },
    }
    const variant = variants[availability]
    return (
      <Badge className={`${variant.className} text-xs flex items-center gap-1`}>
        <div
          className={`h-2 w-2 rounded-full ${availability === 'available' ? 'bg-green-500' : availability === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'}`}
        />
        {variant.label}
      </Badge>
    )
  }
  // Group employees by department
  const employeesByDepartment = filteredEmployees.reduce(
    (acc, employee) => {
      if (!acc[employee.department]) {
        acc[employee.department] = []
      }
      acc[employee.department].push(employee)
      return acc
    },
    {} as Record<Employee['department'], Employee[]>
  )
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={ids.employeeSelector}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            id={ids.employeeSelector}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              'w-full justify-between',
              error && 'border-red-500',
              !selectedEmployees.length && 'text-muted-foreground'
            )}
          >
            <span className="truncate">{getSelectedEmployeesDisplay()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[500px] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="max-h-[400px] overflow-auto">
            {loading ? (
              <div className="py-6 text-center text-sm">
                <div className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                <p className="mt-2">Chargement des employés...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="py-6 text-center text-sm">
                Aucun employé trouvé.
                {showCreateButton && onEmployeeCreate && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setOpen(false)
                      onEmployeeCreate()
                    }}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un nouvel employé
                  </Button>
                )}
              </div>
            ) : (
              Object.entries(employeesByDepartment).map(([department, employees], index) => (
                <div key={department}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuGroup>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {getDepartmentBadge(department as Employee['department'])}
                    </div>
                    {employees.map((employee) => (
                      <DropdownMenuItem
                        key={employee.id}
                        onSelect={() => handleSelect(employee.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              {employee.profileImage ? (
                                <img
                                  src={employee.profileImage}
                                  alt={`${employee.firstName} ${employee.lastName}`}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {employee.firstName} {employee.lastName}
                                </span>
                                {selectedEmployees.includes(employee.id) && (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                #{employee.employeeNumber} • {employee.email}
                              </div>
                              {employee.workStation && (
                                <div className="text-xs text-muted-foreground">
                                  Poste: {employee.workStation}
                                </div>
                              )}
                              {showSkills && employee.skills && employee.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {employee.skills.slice(0, 3).map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {employee.skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{employee.skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              {showRole && getRoleBadge(employee.role)}
                              {showStatus && getStatusBadge(employee.status)}
                            </div>
                            {showAvailability && (
                              <div className="flex items-center gap-2">
                                {getAvailabilityBadge(employee.availability)}
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground capitalize">
                                  {employee.shift}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </div>
              ))
            )}
          </div>
          {showCreateButton && onEmployeeCreate && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setOpen(false)
                    onEmployeeCreate()
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un nouvel employé
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {multiple && maxSelections && (
        <p className="text-xs text-muted-foreground">
          {selectedEmployees.length}/{maxSelections} sélections maximum
        </p>
      )}
      {/* Selected employees summary for multiple selection */}
      {multiple && selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedEmployees.map((id) => {
            const employee = employees.find((e) => e.id === id)
            return employee ? (
              <Badge key={id} variant="secondary" className="text-xs">
                {employee.firstName} {employee.lastName}
                <button
                  onClick={() => handleSelect(id)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                >
                  ×
                </button>
              </Badge>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}
