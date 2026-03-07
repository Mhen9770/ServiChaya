import api from '../api'

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
  subCategories?: ServiceSubCategory[]
}

// Get all active categories
export const getAllCategories = async (featured?: boolean): Promise<ServiceCategory[]> => {
  const url = featured ? '/service-categories?featured=true' : '/service-categories'
  const response = await api.get(url)
  return response.data.data
}

// Get category by ID
export const getCategoryById = async (id: number): Promise<ServiceCategory> => {
  const response = await api.get(`/service-categories/${id}`)
  return response.data.data
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
