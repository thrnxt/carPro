import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { useAuthStore } from '../store/authStore'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type')
      config.headers.delete('content-type')
    } else {
      delete (config.headers as Record<string, unknown>)['Content-Type']
      delete (config.headers as Record<string, unknown>)['content-type']
    }
  }

  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response?.data)
    }
    return Promise.reject(error)
  }
)

export default apiClient
