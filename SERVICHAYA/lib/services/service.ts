import api from '../api'

export interface ServiceCategory {
  id: number
  code: string
  name: string
  description: string
  iconUrl: string
  displayOrder: number
  isFeatured: boolean
  providerCount: number
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
