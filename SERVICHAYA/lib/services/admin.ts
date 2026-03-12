import api from '../api'

export interface AdminStatsDto {
  totalJobs: number
  pendingJobs: number
  activeProviders: number
  pendingVerifications: number
  totalCustomers: number
  totalEarnings: number
}

export interface ProviderDto {
  id: number
  userId: number
  providerCode: string
  businessName: string
  providerType: string
  email?: string
  mobileNumber?: string
  rating?: number
  totalJobsCompleted?: number
  verificationStatus: string
  profileStatus: string
  isAvailable: boolean
  createdAt: string
  bio?: string
  experienceYears?: number
  profileImageUrl?: string
  documents?: DocumentDto[]
  skills?: SkillDto[]
  serviceAreas?: ServiceAreaDto[]
}

export interface DocumentDto {
  id: number
  documentType: string
  documentNumber?: string
  documentUrl: string
  verificationStatus: string
}

export interface SkillDto {
  id: number
  skillId: number
  skillName: string
  experienceYears?: number
  certificationName?: string
  certificationDocumentUrl?: string
  isPrimary: boolean
}

export interface ServiceAreaDto {
  id: number
  cityId: number
  cityName: string
  zoneId?: number
  zoneName?: string
  podId: number
  podName: string
  serviceRadiusKm: number
  isPrimary: boolean
}

export const getAdminStats = async (): Promise<AdminStatsDto> => {
  const response = await api.get('/admin/stats')
  return response.data.data
}

export const getProviders = async (
  status?: string,
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: ProviderDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  if (status && status !== 'ALL') params.append('status', status)
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  
  const response = await api.get(`/admin/providers?${params.toString()}`)
  return response.data.data
}

export const getProviderById = async (providerId: number): Promise<ProviderDto> => {
  const response = await api.get(`/admin/providers/${providerId}`)
  return response.data.data
}

export const approveProvider = async (providerId: number, adminNotes?: string): Promise<void> => {
  const params = new URLSearchParams()
  if (adminNotes) params.append('adminNotes', adminNotes)
  const queryString = params.toString()
  const url = queryString ? `/admin/providers/${providerId}/approve?${queryString}` : `/admin/providers/${providerId}/approve`
  await api.post(url)
}

export const rejectProvider = async (providerId: number, rejectionReason: string): Promise<void> => {
  const params = new URLSearchParams()
  params.append('rejectionReason', rejectionReason)
  await api.post(`/admin/providers/${providerId}/reject?${params.toString()}`)
}

export const getAllJobs = async (
  status?: string,
  cityId?: number,
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string,
  filters?: {
    customerId?: number
    providerId?: number
    categoryId?: number
    subCategoryId?: number
    isEmergency?: boolean
    dateFrom?: string
    dateTo?: string
    budgetMin?: number
    budgetMax?: number
  }
): Promise<{ content: any[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  if (status && status !== 'ALL') params.append('status', status)
  if (cityId) params.append('cityId', cityId.toString())
  if (filters?.customerId) params.append('customerId', filters.customerId.toString())
  if (filters?.providerId) params.append('providerId', filters.providerId.toString())
  if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString())
  if (filters?.subCategoryId) params.append('subCategoryId', filters.subCategoryId.toString())
  if (filters?.isEmergency !== undefined) params.append('isEmergency', filters.isEmergency.toString())
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.append('dateTo', filters.dateTo)
  if (filters?.budgetMin !== undefined) params.append('budgetMin', filters.budgetMin.toString())
  if (filters?.budgetMax !== undefined) params.append('budgetMax', filters.budgetMax.toString())
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  
  const response = await api.get(`/jobs/all?${params.toString()}`)
  return response.data.data
}

// ========== Master Data DTOs ==========
export interface CityMasterDto {
  id?: number
  code: string
  name: string
  description?: string
  stateId: number
  stateName?: string
  latitude?: number
  longitude?: number
  timezone?: string
  population?: number
  isServiceable?: boolean
  isActive?: boolean
}

export interface ZoneMasterDto {
  id?: number
  code: string
  name: string
  description?: string
  cityId: number
  cityName?: string
  latitude?: number
  longitude?: number
  servicePriority?: number
  isActive?: boolean
}

export interface PodMasterDto {
  id?: number
  code: string
  name: string
  description?: string
  cityId: number
  cityName?: string
  zoneId: number
  zoneName?: string
  latitude: number
  longitude: number
  serviceRadiusKm: number
  maxProviders?: number
  maxWorkforce?: number
  isActive?: boolean
}

export interface ServiceCategoryMasterDto {
  id?: number
  code: string
  name: string
  description?: string
  iconUrl?: string
  displayOrder?: number
  isFeatured?: boolean
  isActive?: boolean
}

// NOTE: Legacy ServiceSubCategoryMaster has been deprecated.
// Sub-categories are now represented using ServiceCategoryMaster with parentId.

export interface MatchingRuleMasterDto {
  id?: number
  ruleCode: string
  ruleName: string
  ruleType: string
  weightPercentage: number
  calculationLogic?: string
  isActive?: boolean
  priorityOrder?: number
}

// ========== City Master ==========
export const getAllCities = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: CityMasterDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  const response = await api.get(`/admin/master-data/cities?${params.toString()}`)
  return response.data.data
}

export const getCityById = async (id: number): Promise<CityMasterDto> => {
  const response = await api.get(`/admin/master-data/cities/${id}`)
  return response.data.data
}

export const createCity = async (data: CityMasterDto): Promise<CityMasterDto> => {
  const response = await api.post('/admin/master-data/cities', data)
  return response.data.data
}

export const updateCity = async (id: number, data: CityMasterDto): Promise<CityMasterDto> => {
  const response = await api.put(`/admin/master-data/cities/${id}`, data)
  return response.data.data
}

export const deleteCity = async (id: number): Promise<void> => {
  await api.delete(`/admin/master-data/cities/${id}`)
}

export const getAllActiveCities = async (): Promise<CityMasterDto[]> => {
  const response = await api.get('/admin/master-data/cities/active')
  return response.data.data
}

// ========== Zone Master ==========
export const getAllZones = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: ZoneMasterDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  const response = await api.get(`/admin/master-data/zones?${params.toString()}`)
  return response.data.data
}

export const getZoneById = async (id: number): Promise<ZoneMasterDto> => {
  const response = await api.get(`/admin/master-data/zones/${id}`)
  return response.data.data
}

export const createZone = async (data: ZoneMasterDto): Promise<ZoneMasterDto> => {
  const response = await api.post('/admin/master-data/zones', data)
  return response.data.data
}

export const updateZone = async (id: number, data: ZoneMasterDto): Promise<ZoneMasterDto> => {
  const response = await api.put(`/admin/master-data/zones/${id}`, data)
  return response.data.data
}

export const deleteZone = async (id: number): Promise<void> => {
  await api.delete(`/admin/master-data/zones/${id}`)
}

export const getZonesByCity = async (cityId: number): Promise<ZoneMasterDto[]> => {
  const response = await api.get(`/admin/master-data/zones/city/${cityId}`)
  return response.data.data
}

// ========== POD Master ==========
export const getAllPods = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: PodMasterDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  const response = await api.get(`/admin/master-data/pods?${params.toString()}`)
  return response.data.data
}

export const getPodById = async (id: number): Promise<PodMasterDto> => {
  const response = await api.get(`/admin/master-data/pods/${id}`)
  return response.data.data
}

export const createPod = async (data: PodMasterDto): Promise<PodMasterDto> => {
  const response = await api.post('/admin/master-data/pods', data)
  return response.data.data
}

export const updatePod = async (id: number, data: PodMasterDto): Promise<PodMasterDto> => {
  const response = await api.put(`/admin/master-data/pods/${id}`, data)
  return response.data.data
}

export const deletePod = async (id: number): Promise<void> => {
  await api.delete(`/admin/master-data/pods/${id}`)
}

export const getPodsByCity = async (cityId: number): Promise<PodMasterDto[]> => {
  const response = await api.get(`/admin/master-data/pods/city/${cityId}`)
  return response.data.data
}

export const getPodsByZone = async (zoneId: number): Promise<PodMasterDto[]> => {
  const response = await api.get(`/admin/master-data/pods/zone/${zoneId}`)
  return response.data.data
}

// ========== Service Category Master ==========
export const getAllServiceCategories = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string,
  parentId?: number
): Promise<{ content: ServiceCategoryMasterDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  if (typeof parentId === 'number') params.append('parentId', parentId.toString())
  const response = await api.get(`/admin/master-data/service-categories?${params.toString()}`)
  return response.data.data
}

export const getServiceCategoryById = async (id: number): Promise<ServiceCategoryMasterDto> => {
  const response = await api.get(`/admin/master-data/service-categories/${id}`)
  return response.data.data
}

export const createServiceCategory = async (data: ServiceCategoryMasterDto): Promise<ServiceCategoryMasterDto> => {
  const response = await api.post('/admin/master-data/service-categories', data)
  return response.data.data
}

export const updateServiceCategory = async (id: number, data: ServiceCategoryMasterDto): Promise<ServiceCategoryMasterDto> => {
  const response = await api.put(`/admin/master-data/service-categories/${id}`, data)
  return response.data.data
}

export const deleteServiceCategory = async (id: number): Promise<void> => {
  await api.delete(`/admin/master-data/service-categories/${id}`)
}

// ========== Service SubCategory Master (deprecated) ==========
// Sub-categories are now managed via the hierarchical service-categories endpoints (parentId filter).

// ========== Matching Rule Master ==========
export const getAllMatchingRules = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: MatchingRuleMasterDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  const response = await api.get(`/admin/master-data/matching-rules?${params.toString()}`)
  return response.data.data
}

export const getMatchingRuleById = async (id: number): Promise<MatchingRuleMasterDto> => {
  const response = await api.get(`/admin/master-data/matching-rules/${id}`)
  return response.data.data
}

export const createMatchingRule = async (data: MatchingRuleMasterDto): Promise<MatchingRuleMasterDto> => {
  const response = await api.post('/admin/master-data/matching-rules', data)
  return response.data.data
}

export const updateMatchingRule = async (id: number, data: MatchingRuleMasterDto): Promise<MatchingRuleMasterDto> => {
  const response = await api.put(`/admin/master-data/matching-rules/${id}`, data)
  return response.data.data
}

export const deleteMatchingRule = async (id: number): Promise<void> => {
  await api.delete(`/admin/master-data/matching-rules/${id}`)
}

// ========== Service Skill Master ==========
export interface ServiceSkillMasterDto {
  id?: number
  code: string
  name: string
  description?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export const getAllServiceSkills = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string,
  serviceCategoryId?: number
): Promise<{ content: ServiceSkillMasterDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  if (serviceCategoryId) params.append('serviceCategoryId', serviceCategoryId.toString())
  const response = await api.get(`/admin/master-data/service-skills?${params.toString()}`)
  return response.data.data
}

export const getServiceSkillById = async (id: number): Promise<ServiceSkillMasterDto> => {
  const response = await api.get(`/admin/master-data/service-skills/${id}`)
  return response.data.data
}

export const createServiceSkill = async (data: ServiceSkillMasterDto): Promise<ServiceSkillMasterDto> => {
  const response = await api.post('/admin/master-data/service-skills', data)
  return response.data.data
}

export const updateServiceSkill = async (id: number, data: ServiceSkillMasterDto): Promise<ServiceSkillMasterDto> => {
  const response = await api.put(`/admin/master-data/service-skills/${id}`, data)
  return response.data.data
}

export const deleteServiceSkill = async (id: number): Promise<void> => {
  await api.delete(`/admin/master-data/service-skills/${id}`)
}

// ========== Service Category - Skill Mapping ==========
export interface ServiceCategorySkillMapDto {
  id?: number
  serviceCategoryId: number
  serviceCategoryName?: string
  serviceSkillId: number
  serviceSkillName?: string
  isActive?: boolean
}

export const getCategorySkillMappings = async (categoryId: number): Promise<ServiceCategorySkillMapDto[]> => {
  const response = await api.get(`/admin/master-data/category-skill-mappings?categoryId=${categoryId}`)
  return response.data.data || []
}

export const createCategorySkillMapping = async (categoryId: number, skillId: number): Promise<ServiceCategorySkillMapDto> => {
  const response = await api.post(`/admin/master-data/category-skill-mappings?categoryId=${categoryId}&skillId=${skillId}`)
  return response.data.data
}

export const deleteCategorySkillMapping = async (id: number): Promise<void> => {
  await api.delete(`/admin/master-data/category-skill-mappings/${id}`)
}

export const bulkUpdateCategorySkillMappings = async (categoryId: number, skillIds: number[]): Promise<void> => {
  await api.put(`/admin/master-data/category-skill-mappings/bulk?categoryId=${categoryId}`, skillIds)
}

// ========== Job Workflow Engine (Templates, Steps, Assignments) ==========

export interface JobWorkflowTemplateDto {
  id?: number
  workflowCode: string
  workflowName: string
  description?: string
  isActive?: boolean
}

export interface JobWorkflowStepTemplateDto {
  id?: number
  workflowTemplateId: number
  stepOrder: number
  stepCode: string
  stepType: string
  statusValue?: string
  paymentType?: string
  isMandatory?: boolean
  autoAdvance?: boolean
  configJson?: string
}

export interface JobWorkflowAssignmentDto {
  id?: number
  workflowTemplateId: number
  workflowCode?: string
  serviceTypeId?: number
  serviceCategoryId?: number
  serviceSubCategoryId?: number
  priority?: number
  isActive?: boolean
}

export const getAllWorkflowTemplates = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: JobWorkflowTemplateDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  const response = await api.get(`/admin/workflows/templates?${params.toString()}`)
  return response.data.data
}

export const createWorkflowTemplate = async (data: JobWorkflowTemplateDto): Promise<JobWorkflowTemplateDto> => {
  const response = await api.post('/admin/workflows/templates', data)
  return response.data.data
}

export const updateWorkflowTemplate = async (
  id: number,
  data: JobWorkflowTemplateDto
): Promise<JobWorkflowTemplateDto> => {
  const response = await api.put(`/admin/workflows/templates/${id}`, data)
  return response.data.data
}

export const deleteWorkflowTemplate = async (id: number): Promise<void> => {
  await api.delete(`/admin/workflows/templates/${id}`)
}

export const getWorkflowSteps = async (templateId: number): Promise<JobWorkflowStepTemplateDto[]> => {
  const response = await api.get(`/admin/workflows/templates/${templateId}/steps`)
  return response.data.data
}

export const createWorkflowStep = async (
  templateId: number,
  data: JobWorkflowStepTemplateDto
): Promise<JobWorkflowStepTemplateDto> => {
  const response = await api.post(`/admin/workflows/templates/${templateId}/steps`, data)
  return response.data.data
}

export const updateWorkflowStep = async (
  stepId: number,
  data: JobWorkflowStepTemplateDto
): Promise<JobWorkflowStepTemplateDto> => {
  const response = await api.put(`/admin/workflows/steps/${stepId}`, data)
  return response.data.data
}

export const deleteWorkflowStep = async (stepId: number): Promise<void> => {
  await api.delete(`/admin/workflows/steps/${stepId}`)
}

export const getAllWorkflowAssignments = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: JobWorkflowAssignmentDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  const response = await api.get(`/admin/workflows/assignments?${params.toString()}`)
  return response.data.data
}

export const createWorkflowAssignment = async (
  data: JobWorkflowAssignmentDto
): Promise<JobWorkflowAssignmentDto> => {
  const response = await api.post('/admin/workflows/assignments', data)
  return response.data.data
}

export const updateWorkflowAssignment = async (
  id: number,
  data: JobWorkflowAssignmentDto
): Promise<JobWorkflowAssignmentDto> => {
  const response = await api.put(`/admin/workflows/assignments/${id}`, data)
  return response.data.data
}

export const deleteWorkflowAssignment = async (id: number): Promise<void> => {
  await api.delete(`/admin/workflows/assignments/${id}`)
}

// ========== Country Master ==========
export interface CountryMasterDto {
  id?: number
  code: string
  name: string
  description?: string
  countryCode?: string
  currencyCode?: string
  phoneCode?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export const getAllCountries = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: CountryMasterDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  const response = await api.get(`/admin/master-data/countries?${params.toString()}`)
  return response.data.data
}

export const getCountryById = async (id: number): Promise<CountryMasterDto> => {
  const response = await api.get(`/admin/master-data/countries/${id}`)
  return response.data.data
}

export const createCountry = async (data: CountryMasterDto): Promise<CountryMasterDto> => {
  const response = await api.post('/admin/master-data/countries', data)
  return response.data.data
}

export const updateCountry = async (id: number, data: CountryMasterDto): Promise<CountryMasterDto> => {
  const response = await api.put(`/admin/master-data/countries/${id}`, data)
  return response.data.data
}

export const deleteCountry = async (id: number): Promise<void> => {
  await api.delete(`/admin/master-data/countries/${id}`)
}

export const getAllActiveCountries = async (): Promise<CountryMasterDto[]> => {
  const response = await api.get('/admin/master-data/countries/active')
  return response.data.data
}

// ========== State Master ==========
export interface StateMasterDto {
  id?: number
  code: string
  name: string
  description?: string
  countryId: number
  countryName?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export const getAllStates = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: StateMasterDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  const response = await api.get(`/admin/master-data/states?${params.toString()}`)
  return response.data.data
}

export const getStateById = async (id: number): Promise<StateMasterDto> => {
  const response = await api.get(`/admin/master-data/states/${id}`)
  return response.data.data
}

export const createState = async (data: StateMasterDto): Promise<StateMasterDto> => {
  const response = await api.post('/admin/master-data/states', data)
  return response.data.data
}

export const updateState = async (id: number, data: StateMasterDto): Promise<StateMasterDto> => {
  const response = await api.put(`/admin/master-data/states/${id}`, data)
  return response.data.data
}

export const deleteState = async (id: number): Promise<void> => {
  await api.delete(`/admin/master-data/states/${id}`)
}

export const getStatesByCountry = async (countryId: number): Promise<StateMasterDto[]> => {
  const response = await api.get(`/admin/master-data/states/country/${countryId}`)
  return response.data.data
}

export const getAllActiveStates = async (): Promise<StateMasterDto[]> => {
  const response = await api.get('/admin/master-data/states?page=0&size=1000&sortBy=name&sortDir=asc')
  return response.data.data.content || []
}

// ========== User Role Master ==========
export interface UserRoleMasterDto {
  id?: number
  code: string
  name: string
  description?: string
  roleCode: string
  isSystemRole?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export const getAllUserRoles = async (
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: UserRoleMasterDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  const response = await api.get(`/admin/master-data/user-roles?${params.toString()}`)
  return response.data.data
}

export const getUserRoleById = async (id: number): Promise<UserRoleMasterDto> => {
  const response = await api.get(`/admin/master-data/user-roles/${id}`)
  return response.data.data
}

export const createUserRole = async (data: UserRoleMasterDto): Promise<UserRoleMasterDto> => {
  const response = await api.post('/admin/master-data/user-roles', data)
  return response.data.data
}

export const updateUserRole = async (id: number, data: UserRoleMasterDto): Promise<UserRoleMasterDto> => {
  const response = await api.put(`/admin/master-data/user-roles/${id}`, data)
  return response.data.data
}

export const deleteUserRole = async (id: number): Promise<void> => {
  await api.delete(`/admin/master-data/user-roles/${id}`)
}

// ========== Earning Configuration ==========
export interface PlatformEarningConfigDto {
  id?: number
  earningModel: string // COMMISSION_ONLY, LEAD_ONLY, HYBRID
  serviceCategoryId?: number
  cityId?: number
  commissionPercentage?: number
  fixedCommissionAmount?: number
  minimumCommission?: number
  maximumCommission?: number
  leadPrice?: number
  leadPricePercentage?: number
  minimumLeadPrice?: number
  maximumLeadPrice?: number
  hybridCommissionWeight?: number
  hybridLeadWeight?: number
  effectiveFrom: string
  effectiveUntil?: string
  isActive?: boolean
  description?: string
}

export interface ProviderEarningConfigDto {
  id?: number
  providerId: number
  serviceCategoryId?: number
  earningModel: string
  commissionPercentage?: number
  fixedCommissionAmount?: number
  minimumCommission?: number
  maximumCommission?: number
  leadPrice?: number
  leadPricePercentage?: number
  minimumLeadPrice?: number
  maximumLeadPrice?: number
  hybridCommissionWeight?: number
  hybridLeadWeight?: number
  effectiveFrom: string
  effectiveUntil?: string
  isActive?: boolean
  reason?: string
  createdByAdmin?: number
}

export const getPlatformEarningConfigs = async (
  page: number = 0,
  size: number = 20
): Promise<{ content: PlatformEarningConfigDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  const response = await api.get(`/admin/earning-config/platform?${params.toString()}`)
  return response.data.data
}

export const createPlatformEarningConfig = async (data: Partial<PlatformEarningConfigDto>): Promise<PlatformEarningConfigDto> => {
  const response = await api.post('/admin/earning-config/platform', data)
  return response.data.data
}

export const updatePlatformEarningConfig = async (id: number, data: Partial<PlatformEarningConfigDto>): Promise<PlatformEarningConfigDto> => {
  const response = await api.put(`/admin/earning-config/platform/${id}`, data)
  return response.data.data
}

export const getProviderEarningConfigs = async (
  providerId?: number,
  page: number = 0,
  size: number = 20
): Promise<{ content: ProviderEarningConfigDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  if (providerId) params.append('providerId', providerId.toString())
  params.append('page', page.toString())
  params.append('size', size.toString())
  const response = await api.get(`/admin/earning-config/provider?${params.toString()}`)
  return response.data.data
}

export const createProviderEarningConfig = async (data: Partial<ProviderEarningConfigDto>): Promise<ProviderEarningConfigDto> => {
  const response = await api.post('/admin/earning-config/provider', data)
  return response.data.data
}

export const updateProviderEarningConfig = async (id: number, data: Partial<ProviderEarningConfigDto>): Promise<ProviderEarningConfigDto> => {
  const response = await api.put(`/admin/earning-config/provider/${id}`, data)
  return response.data.data
}

export const deleteProviderEarningConfig = async (id: number): Promise<void> => {
  await api.delete(`/admin/earning-config/provider/${id}`)
}

// ========== Job Assignment ==========
export interface ProviderMatchDto {
  matchId?: number
  jobId: number
  providerId: number
  matchScore?: number
  status: string
  rankOrder?: number
  notifiedAt?: string
  respondedAt?: string
  job?: any
  provider?: any
}

export const getAvailableProvidersForJob = async (jobId: number): Promise<ProviderMatchDto[]> => {
  const response = await api.get(`/admin/jobs/${jobId}/available-providers`)
  return response.data.data
}

export const assignJobToProvider = async (
  jobId: number,
  providerId: number,
  matchScore?: number,
  rankOrder?: number
): Promise<void> => {
  const params = new URLSearchParams()
  params.append('providerId', providerId.toString())
  if (matchScore !== undefined) params.append('matchScore', matchScore.toString())
  if (rankOrder !== undefined) params.append('rankOrder', rankOrder.toString())
  await api.post(`/admin/jobs/${jobId}/assign?${params.toString()}`)
}

export const getJobAssignments = async (jobId: number): Promise<ProviderMatchDto[]> => {
  const response = await api.get(`/admin/jobs/${jobId}/assignments`)
  return response.data.data
}

export const removeJobAssignment = async (jobId: number, matchId: number): Promise<void> => {
  await api.delete(`/admin/jobs/${jobId}/assignments/${matchId}`)
}
