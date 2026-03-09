'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, Bell, Shield, Database, 
  Globe, CreditCard, Mail, Save, RefreshCw 
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    platformName: 'SERVICHAYA',
    platformEmail: 'support@servichaya.com',
    platformPhone: '+91-9876543210',
    commissionRate: 15,
    enableNotifications: true,
    enableEmailNotifications: true,
    enableSMSNotifications: true,
    maintenanceMode: false,
    allowNewRegistrations: true
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // TODO: Implement API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Settings saved successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    {
      title: 'General Settings',
      icon: SettingsIcon,
      fields: [
        {
          key: 'platformName',
          label: 'Platform Name',
          type: 'text',
          placeholder: 'Enter platform name'
        },
        {
          key: 'platformEmail',
          label: 'Platform Email',
          type: 'email',
          placeholder: 'support@servichaya.com'
        },
        {
          key: 'platformPhone',
          label: 'Platform Phone',
          type: 'tel',
          placeholder: '+91-9876543210'
        }
      ]
    },
    {
      title: 'Commission Settings',
      icon: CreditCard,
      fields: [
        {
          key: 'commissionRate',
          label: 'Default Commission Rate (%)',
          type: 'number',
          placeholder: '15',
          min: 0,
          max: 100
        }
      ]
    },
    {
      title: 'Notification Settings',
      icon: Bell,
      fields: [
        {
          key: 'enableNotifications',
          label: 'Enable Notifications',
          type: 'checkbox'
        },
        {
          key: 'enableEmailNotifications',
          label: 'Enable Email Notifications',
          type: 'checkbox'
        },
        {
          key: 'enableSMSNotifications',
          label: 'Enable SMS Notifications',
          type: 'checkbox'
        }
      ]
    },
    {
      title: 'System Settings',
      icon: Database,
      fields: [
        {
          key: 'maintenanceMode',
          label: 'Maintenance Mode',
          type: 'checkbox'
        },
        {
          key: 'allowNewRegistrations',
          label: 'Allow New Registrations',
          type: 'checkbox'
        }
      ]
    }
  ]

  return (
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Platform Settings</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Manage platform configuration and preferences</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Settings
          </motion.button>
        </div>
      </motion.div>

      <div className="space-y-6">
        {sections.map((section, sectionIndex) => {
          const Icon = section.icon
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-main/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-main" />
                </div>
                <h2 className="text-lg font-bold text-neutral-textPrimary font-display">{section.title}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    {field.type === 'checkbox' ? (
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={settings[field.key as keyof typeof settings] as boolean}
                          onChange={(e) => setSettings({ ...settings, [field.key]: e.target.checked })}
                          className="w-5 h-5 text-primary-main rounded focus:ring-primary-main cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-neutral-textPrimary group-hover:text-primary-main transition-colors">
                          {field.label}
                        </span>
                      </label>
                    ) : (
                      <>
                        <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={settings[field.key as keyof typeof settings] as string | number}
                          onChange={(e) => {
                            const value = field.type === 'number' ? Number(e.target.value) : e.target.value
                            setSettings({ ...settings, [field.key]: value })
                          }}
                          placeholder={'placeholder' in field ? field.placeholder : ''}
                          min={'min' in field ? field.min : undefined}
                          max={'max' in field ? field.max : undefined}
                          className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
