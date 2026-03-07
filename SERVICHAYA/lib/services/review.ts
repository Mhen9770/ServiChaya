import api from '../api'

export interface CreateReviewDto {
  jobId: number
  rating: number
  qualityRating?: number
  punctualityRating?: number
  communicationRating?: number
  valueRating?: number
  reviewText?: string
  reviewPhotos?: string[]
}

export interface ReviewDto {
  id: number
  jobId: number
  providerId: number
  customerId: number
  rating: number
  qualityRating?: number
  punctualityRating?: number
  communicationRating?: number
  valueRating?: number
  reviewText?: string
  reviewPhotos?: string[]
  isVerified: boolean
  isVisible: boolean
  createdAt: string
}

export const createReview = async (customerId: number, data: CreateReviewDto): Promise<ReviewDto> => {
  const response = await api.post(`/reviews?customerId=${customerId}`, data)
  return response.data.data
}

export const getProviderReviews = async (providerId: number, page: number = 0, size: number = 20): Promise<{ content: ReviewDto[]; totalElements: number; totalPages: number }> => {
  const response = await api.get(`/reviews/provider/${providerId}?page=${page}&size=${size}`)
  return response.data.data
}

export const getJobReview = async (jobId: number): Promise<ReviewDto | null> => {
  const response = await api.get(`/reviews/job/${jobId}`)
  return response.data.data
}
