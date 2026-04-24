import { resolveApiUrl } from '../config/api'

export function resolveFileUrl(fileUrl?: string | null): string | null {
  if (!fileUrl) {
    return null
  }

  return resolveApiUrl(fileUrl)
}
