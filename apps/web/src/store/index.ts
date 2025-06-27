import { configureStore } from '@reduxjs/toolkit'
import type { TypedUseSelectorHook } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'

// Import des reducers
import projetReducer from './slices/projet.slice'
import stockReducer from './slices/stock.slice'

export const store = configureStore({
  reducer: {
    projets: projetReducer,
    stock: stockReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Hooks typés pour l'utilisation dans les composants
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Export useStore pour la compatibilité
export const useStore = () => ({
  dispatch: useAppDispatch(),
  selector: useAppSelector,
})