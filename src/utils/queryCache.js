const memoryCache = new Map()
const DEFAULT_TTL = 5 * 60 * 1000

const storageKey = (key) => `bore_barrel_query_${key}`

export const readQueryCache = (key, ttl = DEFAULT_TTL) => {
  const now = Date.now()
  const memory = memoryCache.get(key)
  if (memory && now - memory.timestamp < ttl) return memory.value

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(key)) || 'null')
    if (stored && now - stored.timestamp < ttl) {
      memoryCache.set(key, stored)
      return stored.value
    }
  } catch {
    // Storage can be unavailable in private browsing.
  }
  return null
}

export const writeQueryCache = (key, value) => {
  const entry = { timestamp: Date.now(), value }
  memoryCache.set(key, entry)
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(entry))
  } catch {
    // The in-memory cache still improves repeated requests for this session.
  }
  return value
}

export const clearQueryCache = (key) => {
  if (key) memoryCache.delete(key)
  else memoryCache.clear()
  try {
    if (key) localStorage.removeItem(storageKey(key))
    else {
      Object.keys(localStorage)
        .filter((item) => item.startsWith('bore_barrel_query_'))
        .forEach((item) => localStorage.removeItem(item))
    }
  } catch {
    // Ignore unavailable storage.
  }
}
