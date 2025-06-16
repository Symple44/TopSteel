import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { AuthSlice, createAuthSlice } from './slices/auth.slice'
import { UISlice, createUISlice } from './slices/ui.slice'
import { ProjetSlice, createProjetSlice } from './slices/projet.slice'
import { StockSlice, createStockSlice } from './slices/stock.slice'

export type StoreState = AuthSlice & UISlice & ProjetSlice & StockSlice

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...args) => ({
        ...createAuthSlice(...args),
        ...createUISlice(...args),
        ...createProjetSlice(...args),
        ...createStockSlice(...args),
      }),
      {
        name: 'erp-metallerie-store',
        partialize: (state) => ({
          // Persister uniquement les données d'authentification
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'ERP Métallerie Store',
    }
  )
)