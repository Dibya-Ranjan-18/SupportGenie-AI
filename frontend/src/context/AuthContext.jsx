import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await authService.getProfile()
      setUser(data)
    } catch {
      // Only clear the access token — don't wipe all storage on a network error
      localStorage.removeItem('access_token')
      sessionStorage.removeItem('access_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  const login = async (credentials) => {
    const { data } = await authService.login(credentials)
    // Only store access_token — refresh_token is managed via HttpOnly cookie
    const storage = credentials.remember_me ? localStorage : sessionStorage
    storage.setItem('access_token', data.tokens.access)
    setUser(data.user)
    return data.user
  }

  const register = async (userData) => {
    const { data } = await authService.register(userData)
    // Only store access_token — refresh_token is managed via HttpOnly cookie
    sessionStorage.setItem('access_token', data.tokens.access)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      // No need to pass refresh token — backend reads it from HttpOnly cookie
      await authService.logout()
    } catch {}
    localStorage.removeItem('access_token')
    sessionStorage.removeItem('access_token')
    setUser(null)
  }

  const updateUser = (userData) => setUser((prev) => ({ ...prev, ...userData }))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, loadProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
