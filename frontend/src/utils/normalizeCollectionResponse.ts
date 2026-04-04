export function normalizeCollectionResponse<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[]
  }

  if (typeof data === 'string') {
    try {
      return normalizeCollectionResponse<T>(JSON.parse(data))
    } catch {
      return []
    }
  }

  if (data && typeof data === 'object') {
    const collection = data as {
      content?: unknown
      data?: unknown
      items?: unknown
      records?: unknown
    }

    if (Array.isArray(collection.content)) {
      return collection.content as T[]
    }
    if (Array.isArray(collection.data)) {
      return collection.data as T[]
    }
    if (Array.isArray(collection.items)) {
      return collection.items as T[]
    }
    if (Array.isArray(collection.records)) {
      return collection.records as T[]
    }
  }

  return []
}
