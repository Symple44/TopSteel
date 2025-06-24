import { StateCreator } from "zustand";
import { User } from "@/types";
import { authService } from "@/services/auth.service";

export interface AuthSlice {
  // État
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  // État initial
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isAuthLoading: false,

  // Actions
  login: async (email: string, password: string) => {
    set({ isAuthLoading: true });
    try {
      const response = await authService.login(email, password);
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isAuthLoading: false,
      });
    } catch (error) {
      set({ isAuthLoading: false });
      throw error;
    }
  },

  logout: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    // Rediriger vers la page de connexion
    window.location.href = "/login";
  },

  refreshTokens: async () => {
    const { refreshToken } = get();
    if (!refreshToken) {
      get().logout();
      return;
    }

    try {
      const response = await authService.refreshToken(refreshToken);
      set({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
    } catch (error) {
      get().logout();
      throw error;
    }
  },

  checkAuth: async () => {
    const { accessToken } = get();
    if (!accessToken) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch (error) {
      get().logout();
      throw error;
    }
  },

  updateUser: (userData: Partial<User>) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...userData } });
    }
  },
});
