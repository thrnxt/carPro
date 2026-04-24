const DEFAULT_API_BASE_URL = '/api'
const API_PATH_SUFFIX = '/api'
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i

function normalizeApiBaseUrl(rawValue?: string): string {
  if (!rawValue) {
    return DEFAULT_API_BASE_URL
  }

  const trimmedValue = rawValue.trim()
  if (!trimmedValue) {
    return DEFAULT_API_BASE_URL
  }

  const normalizedValue = trimmedValue.replace(/\/+$/, '')
  if (normalizedValue === DEFAULT_API_BASE_URL || normalizedValue.endsWith(API_PATH_SUFFIX)) {
    return normalizedValue
  }

  return `${normalizedValue}${API_PATH_SUFFIX}`
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

export function resolveApiUrl(path = ''): string {
  if (!path) {
    return API_BASE_URL
  }

  if (ABSOLUTE_URL_PATTERN.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (normalizedPath === API_PATH_SUFFIX) {
    return API_BASE_URL
  }

  if (normalizedPath.startsWith(`${API_PATH_SUFFIX}/`)) {
    if (API_BASE_URL === DEFAULT_API_BASE_URL) {
      return normalizedPath
    }

    return `${API_BASE_URL}${normalizedPath.slice(API_PATH_SUFFIX.length)}`
  }

  return `${API_BASE_URL}${normalizedPath}`
}
