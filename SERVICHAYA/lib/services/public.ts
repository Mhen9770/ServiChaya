import api from '../api'

export interface PlatformStatsDto {
  verifiedProviders: number
  completedJobs: number
  averageRating: number | string
  citiesCovered: number
}

export interface FeaturedServiceDto {
  id: number
  name: string
  description?: string
  providerCount: number
  avgRating?: number
  avgResponseTime?: number
  color?: string
}

export interface TestimonialDto {
  id: number
  customerName: string
  customerLocation?: string
  rating: number
  reviewText: string
  serviceName?: string
  createdAt: string
}

// Get platform statistics for home page
export const getPlatformStats = async (): Promise<PlatformStatsDto> => {
  try {
    const response = await api.get('/public/stats')
    const data = response.data.data
    // Convert BigDecimal to number if needed
    return {
      verifiedProviders: Number(data.verifiedProviders) || 0,
      completedJobs: Number(data.completedJobs) || 0,
      averageRating: typeof data.averageRating === 'string' ? parseFloat(data.averageRating) : Number(data.averageRating) || 4.8,
      citiesCovered: Number(data.citiesCovered) || 0,
    }
  } catch (error) {
    // Fallback to admin stats if public endpoint doesn't exist
    try {
      const adminResponse = await api.get('/admin/stats')
      const adminStats = adminResponse.data.data
      return {
        verifiedProviders: Number(adminStats.activeProviders) || 0,
        completedJobs: Number(adminStats.totalJobs) || 0,
        averageRating: 4.8, // Will be calculated from reviews
        citiesCovered: 35, // Will be calculated from active cities
      }
    } catch {
      // Return default values if both fail
      return {
        verifiedProviders: 0,
        completedJobs: 0,
        averageRating: 4.8,
        citiesCovered: 0,
      }
    }
  }
}

// Get featured services (top categories by provider count)
export const getFeaturedServices = async (limit: number = 4): Promise<FeaturedServiceDto[]> => {
  try {
    const response = await api.get(`/service-categories?featured=true`)
    const categories = response.data.data || []
    
    // Map to featured service format with colors
    const colors = [
      'from-yellow-400 to-orange-500',
      'from-blue-400 to-blue-600',
      'from-green-400 to-emerald-600',
      'from-purple-400 to-purple-600',
    ]
    
    return categories.slice(0, limit).map((cat: any, index: number) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      providerCount: cat.providerCount || 0,
      avgRating: 4.5 + (index * 0.1), // Placeholder - should come from DB
      avgResponseTime: 45 + (index * 5), // Placeholder - should come from DB
      color: colors[index % colors.length],
    }))
  } catch (error) {
    console.error('Failed to fetch featured services:', error)
    return []
  }
}

// Get featured testimonials/reviews
export const getFeaturedTestimonials = async (limit: number = 3): Promise<TestimonialDto[]> => {
  try {
    const response = await api.get(`/reviews/featured?limit=${limit}`)
    return response.data.data || []
  } catch (error) {
    // If endpoint doesn't exist, try to get recent reviews
    try {
      const response = await api.get(`/reviews?page=0&size=${limit}&sortBy=createdAt&sortDir=desc`)
      const reviews = response.data.data?.content || []
      
      return reviews
        .filter((r: any) => r.reviewText && r.reviewText.length > 20)
        .slice(0, limit)
        .map((r: any) => ({
          id: r.id,
          customerName: r.customerName || 'Customer',
          customerLocation: r.customerLocation,
          rating: r.rating,
          reviewText: r.reviewText,
          serviceName: r.serviceName,
          createdAt: r.createdAt,
        }))
    } catch {
      return []
    }
  }
}
