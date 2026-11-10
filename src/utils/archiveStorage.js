const KEY = 'bore_barrel_archived_catalogs'

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

const write = (ids) => {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(ids.map(String))]))
  } catch {
    // Archive state is best effort when storage is unavailable.
  }
}

export const getArchivedIds = () => read()
export const isArchived = (id) => read().includes(String(id))
export const setArchived = (id, archived) => {
  const ids = read().filter((item) => item !== String(id))
  if (archived) ids.push(String(id))
  write(ids)
  return archived
}

export const removeArchived = (id) => setArchived(id, false)
