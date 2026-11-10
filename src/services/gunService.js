import { apiClient, IS_SUPABASE } from '../config/api'
import {
  readQueryCache,
  writeQueryCache,
  clearQueryCache,
} from '../utils/queryCache'

// ---------------------------------------------------------------------------
// Normalizer — standardizes product shape whether received from Supabase
// (public.products) or from the university API (/api/v1/recipes).
// ---------------------------------------------------------------------------
export const normalizeProduct = (item) => {
  if (!item) return null

  let storedImages = item.images
  if (!Array.isArray(storedImages) && typeof item.image_url === 'string') {
    try {
      const parsed = JSON.parse(item.image_url)
      if (Array.isArray(parsed)) storedImages = parsed
    } catch {
      // image_url is a regular URL for older records.
    }
  }
  const images = Array.isArray(storedImages) && storedImages.length
    ? storedImages.filter(Boolean)
    : item.image_url || item.image
      ? [item.image_url || item.image]
      : ['/guns/pistol.svg']
  const primaryImage = images[0] || '/guns/pistol.svg'

  // Resolve specifications from Supabase `specs` (text array) or API `ingredients`
  let specsList = []
  if (Array.isArray(item.specs)) {
    specsList = item.specs.map((s, idx) => {
      if (typeof s === 'string') {
        const colonIndex = s.indexOf(':')
        if (colonIndex > -1) {
          return {
            id: `spec-${idx}`,
            name: s.substring(0, colonIndex).trim(),
            quantity: s.substring(colonIndex + 1).trim(),
          }
        }
        return {
          id: `spec-${idx}`,
          name: 'Specification',
          quantity: s.trim(),
        }
      }
      return s
    })
  } else if (Array.isArray(item.ingredients)) {
    specsList = item.ingredients
  }

  // Resolve steps
  const stepsList =
    Array.isArray(item.steps) && item.steps.length > 0
      ? item.steps
      : ['Verify firearm is completely unloaded and point in safe direction.', 'Inspect receiver and mechanism for maintenance.']

  return {
    ...item,
    id: item.id,
    name: item.name || 'Hardware Piece',
    type: item.type || item.category || 'Hardware',
    category: item.type || item.category || 'Hardware',
    caliber: item.caliber || 'Standard',
    price: Number(item.price ?? item.cook_time ?? 0),
    description: item.description || '',
    image_url: primaryImage,
    image: primaryImage,
    images,
    ingredients: specsList,
    steps: stepsList,
  }
}

// ---------------------------------------------------------------------------
// GunService — wraps backend CRUD endpoints.
// Supports both Supabase PostgREST table (/rest/v1/products) and
// standard REST API (/api/v1/recipes).
// ---------------------------------------------------------------------------
class GunService {
  /**
   * Fetch a paginated, filterable list of products.
   */
  async getGuns(params = {}) {
    const cacheKey = `guns:${JSON.stringify(params)}`
    const cached = readQueryCache(cacheKey)
    if (cached) return cached

    if (IS_SUPABASE) {
      const queryParts = ['select=*']

      if (params.search) {
        queryParts.push(`name=ilike.*${encodeURIComponent(params.search)}*`)
      }

      if (params.category && params.category !== 'All') {
        queryParts.push(`type=eq.${encodeURIComponent(params.category)}`)
      }

      if (params.sort_by) {
        const order = params.order === 'desc' ? 'desc' : 'asc'
        queryParts.push(`order=${encodeURIComponent(params.sort_by)}.${order}`)
      } else {
        queryParts.push('order=created_at.desc')
      }

      if (params.limit) {
        queryParts.push(`limit=${params.limit}`)
      }

      const queryString = queryParts.join('&')
      const data = await apiClient.get(`/rest/v1/products?${queryString}`)
      const list = Array.isArray(data) ? data.map(normalizeProduct) : []

      const result = {
        success: true,
        data: list,
        pagination: {
          total: list.length,
          page: params.page || 1,
          limit: params.limit || 50,
        },
      }
      return writeQueryCache(cacheKey, result)
    }

    // Fallback: university REST API
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    )
    const result = await apiClient.get('/api/v1/recipes', { params: clean })
    if (Array.isArray(result?.data)) {
      result.data = result.data.map(normalizeProduct)
    }
    return writeQueryCache(cacheKey, result)
  }

  /**
   * Fetch a single product by ID.
   */
  async getGunById(id) {
    const cacheKey = `gun:${String(id)}`
    const cached = readQueryCache(cacheKey)
    if (cached) return cached

    if (IS_SUPABASE) {
      const data = await apiClient.get(`/rest/v1/products?id=eq.${id}&select=*`)
      if (Array.isArray(data) && data.length > 0) {
        return writeQueryCache(cacheKey, { success: true, data: normalizeProduct(data[0]) })
      }
      throw new Error('Hardware item not found.')
    }
    const result = await apiClient.get(`/api/v1/recipes/${id}`)
    if (result?.data) result.data = normalizeProduct(result.data)
    return writeQueryCache(cacheKey, result)
  }

  /**
   * Create a new product.
   */
  async createGun(data) {
    if (IS_SUPABASE) {
      const specsArray = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : []

      const payload = {
        name: data.name,
        type: data.type || (data.category === 'minuman' ? 'Rifle' : 'Pistol'),
        caliber: data.caliber || '9mm',
        price: Number(data.price ?? data.cook_time ?? 0),
        description: data.description || '',
        specs: specsArray,
        image_url: Array.isArray(data.images) && data.images.length > 1
          ? JSON.stringify(data.images)
          : data.image_url || data.images?.[0] || null,
      }

      const res = await apiClient.post('/rest/v1/products', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      clearQueryCache()
      return { success: true, data: normalizeProduct(created) }
    }
    const result = await apiClient.post('/api/v1/recipes', data)
    clearQueryCache()
    return result
  }

  /**
   * Update existing product.
   */
  async updateGun(id, data) {
    if (IS_SUPABASE) {
      const specsArray = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : undefined

      const payload = {
        updated_at: new Date().toISOString(),
      }
      if (data.name !== undefined) payload.name = data.name
      if (data.type !== undefined) payload.type = data.type
      if (data.caliber !== undefined) payload.caliber = data.caliber
      if (data.price !== undefined || data.cook_time !== undefined) {
        payload.price = Number(data.price ?? data.cook_time ?? 0)
      }
      if (data.description !== undefined) payload.description = data.description
      if (specsArray !== undefined) payload.specs = specsArray
      if (data.image_url !== undefined || Array.isArray(data.images)) {
        payload.image_url = Array.isArray(data.images) && data.images.length > 1
          ? JSON.stringify(data.images)
          : data.image_url || data.images?.[0] || null
      }

      const res = await apiClient.patch(`/rest/v1/products?id=eq.${id}`, payload, {
        headers: { Prefer: 'return=representation' },
      })
      const updated = Array.isArray(res) ? res[0] : res
      clearQueryCache()
      return { success: true, data: normalizeProduct(updated) }
    }
    const result = await apiClient.put(`/api/v1/recipes/${id}`, data)
    clearQueryCache()
    return result
  }

  /**
   * Partial update (PATCH).
   */
  async patchGun(id, data) {
    if (IS_SUPABASE) {
      return this.updateGun(id, data)
    }
    const result = await apiClient.patch(`/api/v1/recipes/${id}`, data)
    clearQueryCache()
    return result
  }

  /**
   * Delete product.
   */
  async deleteGun(id) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/products?id=eq.${id}`)
      clearQueryCache()
      return { success: true }
    }
    const result = await apiClient.delete(`/api/v1/recipes/${id}`)
    clearQueryCache()
    return result
  }
}

export default new GunService()
