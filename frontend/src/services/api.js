// Central API service using Axios with JWT auth and token refresh
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        // Refresh token is sent automatically via HttpOnly cookie (withCredentials: true)
        // No need to read it from storage or pass it in the body
        const { data } = await axios.post(
          `${BASE_URL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        )
        const { access } = data
        // Store new access token in same location as original
        if (localStorage.getItem('access_token')) {
          localStorage.setItem('access_token', access)
        } else {
          sessionStorage.setItem('access_token', access)
        }
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      } catch {
        // Clear only access token and redirect to login
        localStorage.removeItem('access_token')
        sessionStorage.removeItem('access_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
