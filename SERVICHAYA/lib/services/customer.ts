import api from '../api'

export interface CustomerProfileDto {
  userId: number
  email: string
  mobileNumber: string
  name?: string
  fullName?: string // Backend compatibility
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  addresses?: AddressDto[]
  totalJobs?: number
  completedJobs?: number
  cancelledJobs?: number
  activeJobs?: number
  totalSpent?: number
  averageRating?: number
  createdAt?: string
}

export interface AddressDto {
  id: number
  addressLine1: string
  addressLine2?: string
  cityId: number
  cityName?: string
  zoneId?: number
  zoneName?: string
  podId?: number
  podName?: string
  pincode?: string
  latitude?: number
  longitude?: number
  isDefault: boolean
}

export interface UpdateCustomerProfileDto {
  name?: string
  profileImageUrl?: string
}

export const getCustomerProfile = async (customerId: number): Promise<CustomerProfileDto> => {
  const response = await api.get(`/customer/profile?customerId=${customerId}`)
  return response.data.data
}

export const updateCustomerProfile = async (customerId: number, data: UpdateCustomerProfileDto): Promise<CustomerProfileDto> => {
  const response = await api.put(`/customer/profile?customerId=${customerId}`, data)
  return response.data.data
}
