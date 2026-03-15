'use client'

import { useState, useEffect } from 'react'
import { 
  getAllServiceCategories, 
  getAllServiceSkills, 
  getCategorySkillMappings,
  bulkUpdateCategorySkillMappings,
  type ServiceCategoryMasterDto, 
  type ServiceSkillMasterDto,
  type ServiceCategorySkillMapDto
} from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import { Link2, Save, CheckCircle2, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminCategorySkillMappingsPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [categories, setCategories] = useState<ServiceCategoryMasterDto[]>([])
  const [allSkills, setAllSkills] = useState<ServiceSkillMasterDto[]>([])
  const [mappedSkillIds, setMappedSkillIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingMappings, setLoadingMappings] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedCategoryId) {
      loadMappings(selectedCategoryId)
    } else {
      setMappedSkillIds(new Set())
    }
  }, [selectedCategoryId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [catsRes, skillsRes] = await Promise.all([
        getAllServiceCategories(0, 1000, 'name', 'asc').catch(() => ({ content: [] })),
        getAllServiceSkills(0, 1000, 'name', 'asc').catch(() => ({ content: [] }))
      ])
      setCategories(catsRes.content || [])
      setAllSkills(skillsRes.content || [])
    } catch (error: any) {
      console.error('Failed to load initial data:', error)
      toast.error('Failed to load categories and skills')
    } finally {
      setLoading(false)
    }
  }

  const loadMappings = async (categoryId: number) => {
    try {
      setLoadingMappings(true)
      const mappings = await getCategorySkillMappings(categoryId)
      setMappedSkillIds(new Set(mappings.map(m => m.serviceSkillId)))
    } catch (error: any) {
      console.error('Failed to load mappings:', error)
      toast.error(error.response?.data?.message || 'Failed to load category-skill mappings')
      setMappedSkillIds(new Set())
    } finally {
      setLoadingMappings(false)
    }
  }

  const handleSkillToggle = (skillId: number) => {
    const newSet = new Set(mappedSkillIds)
    if (newSet.has(skillId)) {
      newSet.delete(skillId)
    } else {
      newSet.add(skillId)
    }
    setMappedSkillIds(newSet)
  }

  const handleSave = async () => {
    if (!selectedCategoryId) {
      toast.error('Please select a category first')
      return
    }

    try {
      setSaving(true)
      const skillIds = Array.from(mappedSkillIds)
      await bulkUpdateCategorySkillMappings(selectedCategoryId, skillIds)
      toast.success('Category-skill mappings saved successfully')
      await loadMappings(selectedCategoryId)
    } catch (error: any) {
      console.error('Failed to save mappings:', error)
      toast.error(error.response?.data?.message || 'Failed to save category-skill mappings')
    } finally {
      setSaving(false)
    }
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  const rootCategories = categories.filter(c => !c.parentId)
  const subCategories = selectedCategoryId
    ? categories.filter(c => c.parentId === selectedCategoryId)
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-main" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary">Category-Skill Mappings</h1>
          <p className="text-sm text-neutral-textSecondary mt-1">
            Manage which skills are applicable to each service category/sub-category
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-border p-6 space-y-6">
        {/* Category Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
              Root Category <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
            >
              <option value="">Select a category</option>
              {rootCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory && (
            <div>
              <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                Selected Category
              </label>
              <div className="px-3 py-2 bg-neutral-background rounded-lg border border-neutral-border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-textPrimary">{selectedCategory.name}</span>
                  {selectedCategory.parentId && (
                    <span className="text-xs text-neutral-textSecondary">
                      (Sub-category of {categories.find(c => c.id === selectedCategory.parentId)?.name})
                    </span>
                  )}
                </div>
                {selectedCategory.description && (
                  <p className="text-xs text-neutral-textSecondary mt-1">{selectedCategory.description}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sub-categories selector (if root category selected) */}
        {selectedCategoryId && rootCategories.some(c => c.id === selectedCategoryId) && subCategories.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
              Or select a Sub-Category
            </label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedCategoryId(Number(e.target.value))
                }
              }}
              className="w-full px-3 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
            >
              <option value="">Select a sub-category (optional)</option>
              {subCategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Skills Selection */}
        {selectedCategoryId && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-neutral-textPrimary">
                Select Skills for {selectedCategory?.name || 'Category'}
              </label>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Mappings
                  </>
                )}
              </motion.button>
            </div>

            {loadingMappings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-main" />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allSkills
                  .filter(skill => skill.isActive)
                  .map((skill) => {
                    const isMapped = mappedSkillIds.has(skill.id!)
                    return (
                      <motion.div
                        key={skill.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isMapped
                            ? 'border-primary-main bg-primary-main/10'
                            : 'border-neutral-border hover:border-neutral-borderSubtle'
                        }`}
                        onClick={() => handleSkillToggle(skill.id!)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-neutral-textPrimary">{skill.name}</span>
                              {isMapped && (
                                <CheckCircle2 className="w-4 h-4 text-primary-main" />
                              )}
                            </div>
                            {skill.description && (
                              <p className="text-xs text-neutral-textSecondary mt-1 line-clamp-2">
                                {skill.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
              </div>
            )}

            {mappedSkillIds.size > 0 && (
              <div className="mt-4 p-3 bg-primary-main/10 border border-primary-main/30 rounded-lg">
                <p className="text-sm text-neutral-textPrimary">
                  <span className="font-semibold">{mappedSkillIds.size}</span> skill(s) selected for{' '}
                  <span className="font-semibold">{selectedCategory?.name}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {!selectedCategoryId && (
          <div className="text-center py-12 text-neutral-textSecondary">
            <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a category above to manage its skill mappings</p>
          </div>
        )}
      </div>
    </div>
  )
}
