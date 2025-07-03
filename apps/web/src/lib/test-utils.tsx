import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'

/**
 * ✅ TEST UTILITIES ENTERPRISE
 * 
 * Fonctionnalités:
 * - Renders avec providers automatiques
 * - Mocks intelligents
 * - Helpers pour tests async
 * - Assertions personnalisées
 * - Générateurs de données de test
 */

// ✅ WRAPPER AVEC PROVIDERS
export function renderWithProviders(ui: ReactElement) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider defaultTheme="light" storageKey="test-theme">
      {children}
    </ThemeProvider>
  )
  
  return render(ui, { wrapper: Wrapper })
}

// ✅ USER EVENT SETUP
export function setupUserEvent() {
  return userEvent.setup()
}

// ✅ HELPERS ASYNC
export const asyncHelpers = {
  waitForElement: async (testId: string, timeout = 5000) => {
    return await waitFor(
      () => {
        const element = screen.getByTestId(testId)
        expect(element).toBeInTheDocument()
        return element
      },
      { timeout }
    )
  },
  
  waitForElementToDisappear: async (testId: string, timeout = 5000) => {
    return await waitFor(
      () => {
        expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
      },
      { timeout }
    )
  },
  
  waitForLoadingToFinish: async () => {
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
  }
}

// ✅ MOCKS AVANCÉS
export const createMockStore = <T>(initialState: Partial<T>) => ({
  getState: jest.fn(() => initialState),
  subscribe: jest.fn(),
  dispatch: jest.fn()
})

export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response)
  })
}

export const mockLocalStorage = () => {
  const storage: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key]
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    })
  }
}

// ✅ GÉNÉRATEURS DE DONNÉES DE TEST
export const testDataGenerators = {
  user: (overrides = {}) => ({
    id: Math.random().toString(36).substring(7),
    email: 'test@topsteel.com',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  project: (overrides = {}) => ({
    id: Math.random().toString(36).substring(7),
    name: 'Projet Test',
    description: 'Description du projet de test',
    status: 'EN_COURS',
    clientId: '1',
    startDate: new Date().toISOString(),
    ...overrides
  }),
  
  order: (overrides = {}) => ({
    id: Math.random().toString(36).substring(7),
    numero: `OF-${Date.now()}`,
    statut: 'EN_ATTENTE',
    priorite: 'NORMALE',
    description: 'Ordre de fabrication test',
    avancement: 0,
    ...overrides
  })
}

// ✅ ASSERTIONS PERSONNALISÉES
export const customAssertions = {
  toBeAccessible: async (element: HTMLElement) => {
    // Vérifications d'accessibilité basiques
    expect(element).toBeInTheDocument()
    
    if (element.tagName === 'BUTTON') {
      expect(element).not.toHaveAttribute('disabled', 'true')
    }
    
    if (element.tagName === 'IMG') {
      expect(element).toHaveAttribute('alt')
    }
    
    if (element.tagName === 'INPUT') {
      const label = screen.queryByLabelText(element.getAttribute('name') || '')
      expect(label || element.getAttribute('aria-label')).toBeTruthy()
    }
  },
  
  toHaveErrorMessage: (formElement: HTMLElement, message: string) => {
    const errorElement = formElement.querySelector('[role="alert"]')
    expect(errorElement).toBeInTheDocument()
    expect(errorElement).toHaveTextContent(message)
  },
  
  toBeLoading: (element: HTMLElement) => {
    expect(
      element.querySelector('[data-testid="loading"]') ||
      element.querySelector('.animate-spin') ||
      screen.queryByText(/chargement/i)
    ).toBeInTheDocument()
  }
}

// ✅ HELPERS POUR TESTS D'INTÉGRATION
export const integrationHelpers = {
  loginUser: async (email = 'test@topsteel.com', password = 'password123') => {
    const user = setupUserEvent()
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /connexion/i })
    
    await user.type(emailInput, email)
    await user.type(passwordInput, password)
    await user.click(submitButton)
    
    await asyncHelpers.waitForLoadingToFinish()
  },
  
  navigateToPage: async (pageName: string) => {
    const user = setupUserEvent()
    const link = screen.getByRole('link', { name: new RegExp(pageName, 'i') })
    await user.click(link)
    await asyncHelpers.waitForLoadingToFinish()
  },
  
  fillForm: async (fields: Record<string, string>) => {
    const user = setupUserEvent()
    
    for (const [label, value] of Object.entries(fields)) {
      const input = screen.getByLabelText(new RegExp(label, 'i'))
      await user.clear(input)
      await user.type(input, value)
    }
  }
}

// ✅ RE-EXPORTS POUR FACILITÉ
export {
  render,
  screen,
  fireEvent,
  waitFor,
  userEvent
}
