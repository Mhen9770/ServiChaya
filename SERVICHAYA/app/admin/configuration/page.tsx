'use client'

import { useState, useEffect } from 'react'
import { getAllBusinessRules, getAllFeatureFlags, createBusinessRule, updateBusinessRule, deleteBusinessRule, createFeatureFlag, updateFeatureFlag, deleteFeatureFlag, type BusinessRuleDto, type FeatureFlagDto } from '@/lib/services/configuration'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { Settings, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save, X } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminConfigurationPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'flags'>('rules')
  const [businessRules, setBusinessRules] = useState<BusinessRuleDto[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagDto[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<BusinessRuleDto | null>(null)
  const [editingFlag, setEditingFlag] = useState<FeatureFlagDto | null>(null)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [showFlagForm, setShowFlagForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rules, flags] = await Promise.all([
        getAllBusinessRules(),
        getAllFeatureFlags()
      ])
      setBusinessRules(rules)
      setFeatureFlags(flags)
    } catch (error: any) {
      console.error('Failed to fetch configuration:', error)
      toast.error('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRule = async (rule: BusinessRuleDto) => {
    try {
      if (rule.id) {
        await updateBusinessRule(rule.id, rule)
        toast.success('Business rule updated')
      } else {
        await createBusinessRule(rule)
        toast.success('Business rule created')
      }
      setShowRuleForm(false)
      setEditingRule(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save business rule')
    }
  }

  const handleSaveFlag = async (flag: FeatureFlagDto) => {
    try {
      if (flag.id) {
        await updateFeatureFlag(flag.id, flag)
        toast.success('Feature flag updated')
      } else {
        await createFeatureFlag(flag)
        toast.success('Feature flag created')
      }
      setShowFlagForm(false)
      setEditingFlag(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save feature flag')
    }
  }

  const handleDeleteRule = async (ruleCode: string) => {
    if (!confirm('Are you sure you want to delete this business rule?')) return
    try {
      await deleteBusinessRule(ruleCode)
      toast.success('Business rule deleted')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete business rule')
    }
  }

  const handleDeleteFlag = async (featureCode: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return
    try {
      await deleteFeatureFlag(featureCode)
      toast.success('Feature flag deleted')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete feature flag')
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading configuration..." />
  }

  return (
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Configuration Management</h1>
        <p className="text-sm text-neutral-textSecondary mt-1">Manage business rules and feature flags</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-border">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 font-semibold text-sm transition-colors ${
            activeTab === 'rules'
              ? 'text-primary-main border-b-2 border-primary-main'
              : 'text-neutral-textSecondary hover:text-neutral-textPrimary'
          }`}
        >
          Business Rules
        </button>
        <button
          onClick={() => setActiveTab('flags')}
          className={`px-4 py-2 font-semibold text-sm transition-colors ${
            activeTab === 'flags'
              ? 'text-primary-main border-b-2 border-primary-main'
              : 'text-neutral-textSecondary hover:text-neutral-textPrimary'
          }`}
        >
          Feature Flags
        </button>
      </div>

      {/* Business Rules Tab */}
      {activeTab === 'rules' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-neutral-textPrimary">Business Rules</h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingRule({
                  ruleCode: '',
                  ruleName: '',
                  ruleValue: '',
                  ruleType: 'FIXED_AMOUNT',
                  appliesTo: 'PLATFORM',
                  isActive: true
                })
                setShowRuleForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </motion.button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-background">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Applies To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border">
                  {businessRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-neutral-background/50">
                      <td className="px-4 py-3 text-sm font-mono text-neutral-textPrimary">{rule.ruleCode}</td>
                      <td className="px-4 py-3 text-sm text-neutral-textPrimary">{rule.ruleName}</td>
                      <td className="px-4 py-3 text-sm text-neutral-textSecondary font-mono">{rule.ruleValue}</td>
                      <td className="px-4 py-3 text-sm text-neutral-textSecondary">{rule.ruleType}</td>
                      <td className="px-4 py-3 text-sm text-neutral-textSecondary">{rule.appliesTo}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          rule.isActive ? 'bg-accent-green/20 text-accent-green' : 'bg-neutral-background text-neutral-textSecondary'
                        }`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingRule(rule)
                              setShowRuleForm(true)
                            }}
                            className="p-1.5 text-primary-main hover:bg-primary-main/10 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.ruleCode)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Feature Flags Tab */}
      {activeTab === 'flags' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-neutral-textPrimary">Feature Flags</h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingFlag({
                  featureCode: '',
                  featureName: '',
                  description: '',
                  isEnabled: false,
                  rolloutPercentage: 0,
                  isActive: true
                })
                setShowFlagForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Flag
            </motion.button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-background">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Enabled</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Rollout</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border">
                  {featureFlags.map((flag) => (
                    <tr key={flag.id} className="hover:bg-neutral-background/50">
                      <td className="px-4 py-3 text-sm font-mono text-neutral-textPrimary">{flag.featureCode}</td>
                      <td className="px-4 py-3 text-sm text-neutral-textPrimary">{flag.featureName}</td>
                      <td className="px-4 py-3">
                        {flag.isEnabled ? (
                          <ToggleRight className="w-6 h-6 text-accent-green" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-neutral-textSecondary" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-textSecondary">{flag.rolloutPercentage}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          flag.isActive ? 'bg-accent-green/20 text-accent-green' : 'bg-neutral-background text-neutral-textSecondary'
                        }`}>
                          {flag.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingFlag(flag)
                              setShowFlagForm(true)
                            }}
                            className="p-1.5 text-primary-main hover:bg-primary-main/10 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFlag(flag.featureCode)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rule Form Modal */}
      {showRuleForm && editingRule && (
        <RuleFormModal
          rule={editingRule}
          onSave={handleSaveRule}
          onClose={() => {
            setShowRuleForm(false)
            setEditingRule(null)
          }}
        />
      )}

      {/* Flag Form Modal */}
      {showFlagForm && editingFlag && (
        <FlagFormModal
          flag={editingFlag}
          onSave={handleSaveFlag}
          onClose={() => {
            setShowFlagForm(false)
            setEditingFlag(null)
          }}
        />
      )}
    </div>
  )
}

// Rule Form Modal Component
function RuleFormModal({ rule, onSave, onClose }: { rule: BusinessRuleDto; onSave: (rule: BusinessRuleDto) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<BusinessRuleDto>(rule)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neutral-textPrimary">
            {rule.id ? 'Edit Business Rule' : 'Create Business Rule'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-background rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Rule Code *</label>
            <input
              type="text"
              value={formData.ruleCode}
              onChange={(e) => setFormData({ ...formData, ruleCode: e.target.value })}
              disabled={!!rule.id}
              className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
              placeholder="MIN_WITHDRAWAL"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Rule Name *</label>
            <input
              type="text"
              value={formData.ruleName}
              onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
              className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
              placeholder="Minimum Withdrawal Amount"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Rule Value (JSON) *</label>
            <textarea
              value={formData.ruleValue}
              onChange={(e) => setFormData({ ...formData, ruleValue: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main font-mono text-sm"
              placeholder='{"value": 500}'
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Rule Type *</label>
              <select
                value={formData.ruleType}
                onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
              >
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="TIME_DURATION">Time Duration</option>
                <option value="BOOLEAN">Boolean</option>
                <option value="STRING">String</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Applies To *</label>
              <select
                value={formData.appliesTo}
                onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="PROVIDER">Provider</option>
                <option value="PLATFORM">Platform</option>
                <option value="ALL">All</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
              placeholder="Description of the business rule"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary-main rounded focus:ring-primary-main"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-neutral-textPrimary">Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-neutral-border rounded-xl text-sm font-semibold hover:bg-neutral-background transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSave(formData)}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Flag Form Modal Component
function FlagFormModal({ flag, onSave, onClose }: { flag: FeatureFlagDto; onSave: (flag: FeatureFlagDto) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<FeatureFlagDto>(flag)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neutral-textPrimary">
            {flag.id ? 'Edit Feature Flag' : 'Create Feature Flag'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-background rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Feature Code *</label>
            <input
              type="text"
              value={formData.featureCode}
              onChange={(e) => setFormData({ ...formData, featureCode: e.target.value })}
              disabled={!!flag.id}
              className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
              placeholder="ENABLE_WALLET"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Feature Name *</label>
            <input
              type="text"
              value={formData.featureName}
              onChange={(e) => setFormData({ ...formData, featureName: e.target.value })}
              className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
              placeholder="Wallet System"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
              placeholder="Description of the feature"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">Rollout Percentage</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.rolloutPercentage}
                onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isEnabled"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="w-4 h-4 text-primary-main rounded focus:ring-primary-main"
              />
              <label htmlFor="isEnabled" className="text-sm font-semibold text-neutral-textPrimary">Enabled</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-main rounded focus:ring-primary-main"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-neutral-textPrimary">Active</label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-neutral-border rounded-xl text-sm font-semibold hover:bg-neutral-background transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSave(formData)}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
