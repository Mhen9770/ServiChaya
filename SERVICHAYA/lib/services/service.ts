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

// Get all active subcategories
export const getAllSubCategories = async (categoryId?: number, featured?: boolean): Promise<ServiceSubCategory[]> => {
  const params = new URLSearchParams()
  if (categoryId) params.append('categoryId', categoryId.toString())
  if (featured) params.append('featured', 'true')
  const url = params.toString() ? `/service-subcategories?${params.toString()}` : '/service-subcategories'
  const response = await api.get(url)
  return response.data.data
}

// Get subcategory by ID
export const getSubCategoryById = async (id: number): Promise<ServiceSubCategory> => {
  const response = await api.get(`/service-subcategories/${id}`)
  return response.data.data
}

// Get subcategory by code
export const getSubCategoryByCode = async (code: string): Promise<ServiceSubCategory> => {
  const response = await api.get(`/service-subcategories/code/${code}`)
  return response.data.data
}
