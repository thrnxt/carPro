import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Note: persist middleware requires zustand v4.4.7+

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  role: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User & { userId?: number }) => void
  setUser: (user: User & { userId?: number }) => void
  logout: () => void
}

const normalizeUser = (user: User & { userId?: number }): User => ({
  ...user,
  id: user.id ?? user.userId ?? 0,
})

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) =>
        set({
          token,
          user: normalizeUser(user),
          isAuthenticated: true,
        }),
      setUser: (user) =>
        set((state) => ({
          token: state.token,
          user: normalizeUser(user),
          isAuthenticated: Boolean(state.token),
        })),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
