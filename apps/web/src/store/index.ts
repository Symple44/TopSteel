import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { AuthSlice} from "./slices/auth.slice";
import { createAuthSlice } from "./slices/auth.slice";
import type { ProjetSlice} from "./slices/projet.slice";
import { createProjetSlice } from "./slices/projet.slice";
import type { StockSlice} from "./slices/stock.slice";
import { createStockSlice } from "./slices/stock.slice";
import type { UISlice} from "./slices/ui.slice";
import { createUISlice } from "./slices/ui.slice";

export type StoreState = AuthSlice & UISlice & ProjetSlice & StockSlice;

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
        name: "erp-metallerie-store",
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
      name: "ERP TOPSTEEL Store",
    }
  )
);
