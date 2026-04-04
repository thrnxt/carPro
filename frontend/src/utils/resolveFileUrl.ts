export function resolveFileUrl(fileUrl?: string | null): string | null {
  if (!fileUrl) {
    return null
  }

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('/api/')) {
    return fileUrl
  }

  if (fileUrl.startsWith('/')) {
    return `/api${fileUrl}`
  }

  return `/api/${fileUrl}`
}
