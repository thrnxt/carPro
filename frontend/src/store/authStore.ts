import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Note: persist middleware requires zustand v4.4.7+

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string | null
  avatarUrl?: string | null
  role: string
}

type AuthUserPayload = Omit<User, 'id'> & {
  id?: number
  userId?: number
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUserPayload) => void
  setUser: (user: AuthUserPayload) => void
  logout: () => void
}

const normalizeUser = (user: AuthUserPayload): User => ({
  id: user.id ?? user.userId ?? 0,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phoneNumber: user.phoneNumber ?? null,
  avatarUrl: user.avatarUrl ?? null,
  role: user.role,
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
