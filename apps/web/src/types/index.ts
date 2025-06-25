// Types globaux pour l'application ERP TopSteel

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'manager' | 'user'
  createdAt: Date
  updatedAt: Date
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  startDate: Date
  endDate?: Date
  clientId: string
  estimatedValue: number
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}
