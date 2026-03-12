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

export interface HomePageDataDto {
  stats: PlatformStatsDto
  featuredCategories: any[]
  rootCategories: any[]
  featuredReviews: any[]
  featuredSubCategories: any[]
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
      averageRating: typeof data.averageRating === 'string' ? parseFloat(data.averageRating) : Number(data.averageRating) || 0,
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
        // When falling back to admin stats, do not invent ratings or cities;
        // keep them neutral so UI never shows misleading numbers.
        averageRating: 0,
        citiesCovered: 0,
      }
    } catch {
      // Return default values if both fail
      return {
        verifiedProviders: 0,
        completedJobs: 0,
        averageRating: 0,
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

// Get featured testimonials/reviews for homepage
export const getFeaturedTestimonials = async (limit: number = 3): Promise<TestimonialDto[]> => {
  try {
    const response = await api.get(`/reviews/featured?limit=${limit}`)
    const reviews = response.data.data || []

    // Map backend review DTOs to the testimonial shape expected by the homepage
    return (reviews as any[])
      .filter((r) => r.reviewText && String(r.reviewText).length > 20)
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        customerName: 'Customer', // Customer-identifying details are not exposed in public DTO
        customerLocation: undefined,
        rating: Number(r.rating) || 5,
        reviewText: r.reviewText,
        serviceName: undefined,
        createdAt: r.createdAt,
      }))
  } catch (error) {
    console.error('Failed to fetch featured testimonials:', error)
    return []
  }
}

// Aggregated homepage data from backend public controller
export const getHomePageData = async (): Promise<{
  stats: PlatformStatsDto | null
  featuredCategories: any[]
  rootCategories: any[]
  featuredReviews: TestimonialDto[]
  featuredSubCategories: any[]
}> => {
  const response = await api.get('/public/home')
  const data: HomePageDataDto = response.data.data

  const stats = data?.stats ?? null
  const featuredCategories = data?.featuredCategories ?? []
  const rootCategories = data?.rootCategories ?? []

  const featuredReviewsRaw = data?.featuredReviews ?? []
  const featuredReviews: TestimonialDto[] = (featuredReviewsRaw as any[]).map((r) => ({
    id: r.id,
    customerName: 'Customer',
    customerLocation: undefined,
    rating: Number(r.rating) || 5,
    reviewText: r.reviewText,
    serviceName: undefined,
    createdAt: r.createdAt,
  }))

  return {
    stats,
    featuredCategories,
    rootCategories,
    featuredReviews,
    featuredSubCategories: data?.featuredSubCategories ?? [],
  }
}
