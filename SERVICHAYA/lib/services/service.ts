import api from '../api'
import { ProviderProfileDto } from './provider'

export interface ServiceSubCategory {
  id: number
  code: string
  name: string
  description: string
  categoryId: number
  categoryName?: string
  iconUrl: string
  displayOrder: number
  isFeatured: boolean
  providerCount: number
}

export interface ServiceCategory {
  id: number
  code: string
  name: string
  description: string
  iconUrl: string
  displayOrder: number
  isFeatured: boolean
  providerCount: number
  // Hierarchical fields
  parentId?: number
  parentName?: string
  categoryType?: string // ELECTRONICS, APPLIANCE, etc.
  level?: number // 0 = root, 1 = first level, etc.
  path?: string // Full path for display
  children?: ServiceCategory[] // Unlimited depth hierarchy
  // Legacy support
  subCategories?: ServiceSubCategory[]
}

// Get all active categories
export const getAllCategories = async (featured?: boolean, categoryType?: string, rootOnly?: boolean): Promise<ServiceCategory[]> => {
  const params = new URLSearchParams()
  if (featured) params.append('featured', 'true')
  if (categoryType) params.append('categoryType', categoryType)
  if (rootOnly) params.append('rootOnly', 'true')
  const url = params.toString() ? `/service-categories?${params.toString()}` : '/service-categories'
  const response = await api.get(url)
  return response.data.data
}

// Get categories by type (e.g., 'ELECTRONICS')
export const getCategoriesByType = async (categoryType: string): Promise<ServiceCategory[]> => {
  const response = await api.get(`/service-categories/type/${categoryType}`)
  return response.data.data
}

// Get root categories only
export const getRootCategories = async (): Promise<ServiceCategory[]> => {
  const response = await api.get('/service-categories?rootOnly=true')
  return response.data.data
}

// Get category tree by ID (includes all descendants)
export const getCategoryTree = async (id: number): Promise<ServiceCategory> => {
  const response = await api.get(`/service-categories/tree/${id}`)
  return response.data.data
}

// Get category by ID
export const getCategoryById = async (id: number): Promise<ServiceCategory> => {
  const response = await api.get(`/service-categories/${id}`)
  return response.data.data
}

// Get providers by category ID
export const getProvidersByCategory = async (categoryId: number): Promise<ProviderProfileDto[]> => {
  const response = await api.get(`/service-categories/${categoryId}/providers`)
  return response.data.data || []
}

// Get category by code
export const getCategoryByCode = async (code: string): Promise<ServiceCategory> => {
  const response = await api.get(`/service-categories/code/${code}`)
  return response.data.data
}

// Helper to flatten category tree into a flat list
const flattenCategories = (categories: ServiceCategory[]): ServiceCategory[] => {
  const result: ServiceCategory[] = []
  const stack: ServiceCategory[] = [...categories]
  while (stack.length) {
    const current = stack.pop()!
    result.push(current)
    if (current.children && current.children.length) {
      stack.push(...current.children)
    }
  }
  return result
}

// Map a ServiceCategory (child node) into a ServiceSubCategory shape
const mapCategoryToSubCategory = (category: ServiceCategory): ServiceSubCategory => ({
  id: category.id,
  code: category.code,
  name: category.name,
  description: category.description,
  categoryId: category.parentId ?? 0,
  categoryName: category.parentName,
  iconUrl: category.iconUrl,
  displayOrder: category.displayOrder,
  isFeatured: category.isFeatured,
  providerCount: category.providerCount,
})

// Get all active subcategories (derived from /service-categories)
export const getAllSubCategories = async (categoryId?: number, featured?: boolean): Promise<ServiceSubCategory[]> => {
  // Load full active category tree
  const allCategories = await getAllCategories(undefined, undefined, false)
  const flat = flattenCategories(allCategories)

  // Subcategories = any category with a parentId
  let subs = flat.filter((c) => c.parentId != null)

  if (categoryId) {
    subs = subs.filter((c) => c.parentId === categoryId)
  }
  if (featured) {
    subs = subs.filter((c) => c.isFeatured)
  }

  return subs.map(mapCategoryToSubCategory)
}

// Get subcategory by ID (via /service-categories/{id})
export const getSubCategoryById = async (id: number): Promise<ServiceSubCategory> => {
  const category = await getCategoryById(id)
  return mapCategoryToSubCategory(category)
}

// Get subcategory by code (via /service-categories/code/{code})
export const getSubCategoryByCode = async (code: string): Promise<ServiceSubCategory> => {
  const category = await getCategoryByCode(code)
  return mapCategoryToSubCategory(category)
}
