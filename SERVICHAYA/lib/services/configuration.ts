import api from '../api'

export interface BusinessRuleDto {
  id?: number
  ruleCode: string
  ruleName: string
  ruleValue: string
  ruleType: string
  appliesTo: string
  description?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface FeatureFlagDto {
  id?: number
  featureCode: string
  featureName: string
  description?: string
  isEnabled: boolean
  enabledForUsers?: string
  enabledForCities?: string
  rolloutPercentage: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

// Business Rules API
export async function getAllBusinessRules(): Promise<BusinessRuleDto[]> {
  const response = await api.get('/admin/configuration/business-rules')
  return response.data.data || []
}

export async function getBusinessRule(ruleCode: string): Promise<BusinessRuleDto> {
  const response = await api.get(`/admin/configuration/business-rules/${ruleCode}`)
  return response.data.data
}

export async function createBusinessRule(rule: BusinessRuleDto): Promise<BusinessRuleDto> {
  const response = await api.post('/admin/configuration/business-rules', rule)
  return response.data.data
}

export async function updateBusinessRule(id: number, rule: BusinessRuleDto): Promise<BusinessRuleDto> {
  const response = await api.put(`/admin/configuration/business-rules/${id}`, rule)
  return response.data.data
}

export async function deleteBusinessRule(ruleCode: string): Promise<void> {
  await api.delete(`/admin/configuration/business-rules/${ruleCode}`)
}

// Feature Flags API
export async function getAllFeatureFlags(): Promise<FeatureFlagDto[]> {
  const response = await api.get('/admin/configuration/feature-flags')
  return response.data.data || []
}

export async function getFeatureFlag(featureCode: string): Promise<FeatureFlagDto> {
  const response = await api.get(`/admin/configuration/feature-flags/${featureCode}`)
  return response.data.data
}

export async function createFeatureFlag(flag: FeatureFlagDto): Promise<FeatureFlagDto> {
  const response = await api.post('/admin/configuration/feature-flags', flag)
  return response.data.data
}

export async function updateFeatureFlag(id: number, flag: FeatureFlagDto): Promise<FeatureFlagDto> {
  const response = await api.put(`/admin/configuration/feature-flags/${id}`, flag)
  return response.data.data
}

export async function deleteFeatureFlag(featureCode: string): Promise<void> {
  await api.delete(`/admin/configuration/feature-flags/${featureCode}`)
}

// Public configuration checks (for frontend feature flags)
export async function checkFeatureEnabled(featureCode: string, userId?: number, cityId?: number): Promise<boolean> {
  try {
    const flag = await getFeatureFlag(featureCode)
    if (!flag.isEnabled || !flag.isActive) return false
    
    // Check user-specific enable
    if (userId && flag.enabledForUsers) {
      const users = JSON.parse(flag.enabledForUsers)
      if (users.includes(userId)) return true
    }
    
    // Check city-specific enable
    if (cityId && flag.enabledForCities) {
      const cities = JSON.parse(flag.enabledForCities)
      if (cities.includes(cityId)) return true
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage < 100 && userId) {
      // Hash-based rollout (simple implementation)
      const hash = userId % 100
      if (hash >= flag.rolloutPercentage) return false
    }
    
    return flag.isEnabled
  } catch {
    return false
  }
}

// Get business rule value (for frontend display)
export async function getBusinessRuleValue(ruleCode: string): Promise<string | null> {
  try {
    const rule = await getBusinessRule(ruleCode)
    return rule.ruleValue || null
  } catch {
    return null
  }
}
