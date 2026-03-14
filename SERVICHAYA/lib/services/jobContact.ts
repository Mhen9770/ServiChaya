import api from '../api'

export interface ContactDetails {
  providerName?: string
  providerCode?: string
  providerType?: string
  customerName?: string
  customerMobile?: string
  customerEmail?: string
  customerAddress?: string
}

/**
 * Get contact details for a job (only available after provider accepts)
 */
export const getContactDetails = async (jobId: number): Promise<ContactDetails> => {
  const response = await api.get(`/jobs/${jobId}/contact-details`)
  return response.data.data
}
