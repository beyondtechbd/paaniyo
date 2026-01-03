// components/vendor/SettingsClient.tsx
// Vendor Settings Management UI

'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  Building2,
  User,
  Phone,
  Mail,
  CreditCard,
  Wallet,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Info,
  Shield,
  Calendar,
  Percent,
  BadgeCheck,
  AlertTriangle,
} from 'lucide-react'

interface VendorSettings {
  id: string
  businessName: string
  tradeLicense: string | null
  taxId: string | null
  status: string
  
  contactName: string
  contactEmail: string
  contactPhone: string
  
  commissionRate: number
  balance: number
  
  bankName: string | null
  bankAccount: string | null
  bankRouting: string | null
  bkashNumber: string | null
  
  brands: { id: string; name: string }[]
  createdAt: string
  approvedAt: string | null
  
  userEmail: string
  userName: string | null
}

interface SettingsClientProps {
  initialSettings: VendorSettings
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState<VendorSettings>(initialSettings)
  const [formData, setFormData] = useState({
    // Business Info
    businessName: initialSettings.businessName,
    tradeLicense: initialSettings.tradeLicense || '',
    taxId: initialSettings.taxId || '',
    
    // Contact Info
    contactName: initialSettings.contactName,
    contactEmail: initialSettings.contactEmail,
    contactPhone: initialSettings.contactPhone,
    
    // Banking
    bankName: initialSettings.bankName || '',
    bankAccount: initialSettings.bankAccount || '',
    bankRouting: initialSettings.bankRouting || '',
    bkashNumber: initialSettings.bkashNumber || '',
  })
  
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toasts, setToasts] = useState<Toast[]>([])
  const [activeTab, setActiveTab] = useState<'business' | 'contact' | 'payout'>('business')
  const [hasChanges, setHasChanges] = useState(false)

  // Toast helpers
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
    setHasChanges(true)
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Business name
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    } else if (formData.businessName.length < 2) {
      newErrors.businessName = 'Business name must be at least 2 characters'
    } else if (formData.businessName.length > 100) {
      newErrors.businessName = 'Business name must be under 100 characters'
    }
    
    // Contact name
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required'
    } else if (formData.contactName.length < 2) {
      newErrors.contactName = 'Contact name must be at least 2 characters'
    }
    
    // Contact email
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required'
    } else if (!isValidEmail(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address'
    }
    
    // Contact phone
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required'
    } else if (formData.contactPhone.length < 10) {
      newErrors.contactPhone = 'Phone number must be at least 10 digits'
    }
    
    // bKash number validation
    if (formData.bkashNumber && !/^01[3-9]\d{8}$/.test(formData.bkashNumber)) {
      newErrors.bkashNumber = 'Please enter a valid bKash number (e.g., 01712345678)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Save changes
  const handleSave = async () => {
    if (!validateForm()) {
      showToast('error', 'Please fix the errors below')
      return
    }
    
    setSaving(true)
    
    try {
      const res = await fetch('/api/vendor/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName.trim(),
          tradeLicense: formData.tradeLicense.trim() || null,
          taxId: formData.taxId.trim() || null,
          contactName: formData.contactName.trim(),
          contactEmail: formData.contactEmail.trim().toLowerCase(),
          contactPhone: formData.contactPhone.trim(),
          bankName: formData.bankName.trim() || null,
          bankAccount: formData.bankAccount.trim() || null,
          bankRouting: formData.bankRouting.trim() || null,
          bkashNumber: formData.bkashNumber.trim() || null,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings')
      }
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        ...data.vendor,
      }))
      
      setHasChanges(false)
      showToast('success', 'Settings updated successfully!')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
  }

  const tabs = [
    { id: 'business' as const, label: 'Business', icon: Building2 },
    { id: 'contact' as const, label: 'Contact', icon: User },
    { id: 'payout' as const, label: 'Payout', icon: Wallet },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-white/60 mt-1">Manage your vendor account and payout details</p>
      </div>

      {/* Account Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{settings.businessName}</h2>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Mail className="w-4 h-4" />
                {settings.userEmail}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
              settings.status === 'APPROVED'
                ? 'bg-emerald-500/20 text-emerald-400'
                : settings.status === 'PENDING'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              <BadgeCheck className="w-4 h-4" />
              {settings.status}
            </div>
            <div className="flex items-center gap-1.5 text-white/60">
              <Calendar className="w-4 h-4" />
              Since {formatDate(settings.createdAt)}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-white/50 text-sm">Commission Rate</p>
            <p className="text-xl font-semibold text-white flex items-center gap-1">
              {settings.commissionRate}%
              <Percent className="w-4 h-4 text-white/40" />
            </p>
          </div>
          <div>
            <p className="text-white/50 text-sm">Available Balance</p>
            <p className="text-xl font-semibold text-emerald-400">
              {formatCurrency(settings.balance)}
            </p>
          </div>
          <div>
            <p className="text-white/50 text-sm">Brands</p>
            <p className="text-xl font-semibold text-white">
              {settings.brands.length}
            </p>
          </div>
          <div>
            <p className="text-white/50 text-sm">Approved</p>
            <p className="text-xl font-semibold text-white">
              {settings.approvedAt ? formatDate(settings.approvedAt) : 'Pending'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white/[0.02] p-1 rounded-xl border border-white/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <AnimatePresence mode="wait">
          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <motion.div
              key="business"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  placeholder="Your business name"
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all ${
                    errors.businessName ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {errors.businessName && (
                  <p className="text-red-400 text-sm mt-1">{errors.businessName}</p>
                )}
              </div>

              {/* Trade License */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Trade License Number
                </label>
                <input
                  type="text"
                  value={formData.tradeLicense}
                  onChange={(e) => handleChange('tradeLicense', e.target.value)}
                  placeholder="Enter your trade license number"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
              </div>

              {/* Tax ID */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Tax ID / TIN
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  placeholder="Enter your tax identification number"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
              </div>

              {/* Brands Info */}
              {settings.brands.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-medium text-white/80 mb-3">Your Brands</h4>
                  <div className="flex flex-wrap gap-2">
                    {settings.brands.map(brand => (
                      <span
                        key={brand.id}
                        className="px-3 py-1.5 bg-sky-500/20 text-sky-300 rounded-lg text-sm"
                      >
                        {brand.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Contact Name */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Contact Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => handleChange('contactName', e.target.value)}
                    placeholder="Primary contact person"
                    className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all ${
                      errors.contactName ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                </div>
                {errors.contactName && (
                  <p className="text-red-400 text-sm mt-1">{errors.contactName}</p>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Contact Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="business@example.com"
                    className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all ${
                      errors.contactEmail ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                </div>
                {errors.contactEmail && (
                  <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="01712345678"
                    className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all ${
                      errors.contactPhone ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                </div>
                {errors.contactPhone && (
                  <p className="text-red-400 text-sm mt-1">{errors.contactPhone}</p>
                )}
              </div>

              {/* Account Email Note */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/60">
                    <p className="font-medium text-white/80 mb-1">Account Email</p>
                    <p>
                      Your login email ({settings.userEmail}) is separate from your business contact email.
                      To change your login email, please contact support.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payout Tab */}
          {activeTab === 'payout' && (
            <motion.div
              key="payout"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Payout Info Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-sky-500/10 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/70">
                    <p className="font-medium text-white/90 mb-1">Payout Schedule</p>
                    <p>
                      Payouts are processed weekly on Thursdays. Minimum payout amount is ৳1,000.
                      Earnings from delivered orders will be available for withdrawal after a 7-day hold period.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Transfer Section */}
              <div className="border border-white/10 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-sky-400" />
                  <h4 className="font-medium text-white">Bank Transfer</h4>
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="e.g., Dutch Bangla Bank"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                  />
                </div>

                {/* Bank Account */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => handleChange('bankAccount', e.target.value)}
                    placeholder="Enter your bank account number"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                  />
                </div>

                {/* Routing Number */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Routing Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.bankRouting}
                    onChange={(e) => handleChange('bankRouting', e.target.value)}
                    placeholder="Bank routing number"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                  />
                </div>
              </div>

              {/* bKash Section */}
              <div className="border border-white/10 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#E2136E] flex items-center justify-center text-white text-xs font-bold">
                    b
                  </div>
                  <h4 className="font-medium text-white">bKash</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    bKash Number
                  </label>
                  <input
                    type="tel"
                    value={formData.bkashNumber}
                    onChange={(e) => handleChange('bkashNumber', e.target.value)}
                    placeholder="01712345678"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all ${
                      errors.bkashNumber ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {errors.bkashNumber && (
                    <p className="text-red-400 text-sm mt-1">{errors.bkashNumber}</p>
                  )}
                  <p className="text-white/40 text-xs mt-1">
                    Must be a valid Bangladeshi mobile number starting with 01
                  </p>
                </div>
              </div>

              {/* Warning */}
              {(!formData.bankAccount && !formData.bkashNumber) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-white/70">
                      <p className="font-medium text-amber-400 mb-1">No Payout Method</p>
                      <p>
                        You haven't added any payout method yet. Please add your bank details or bKash
                        number to receive payouts.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/60">
                    <p className="font-medium text-white/80 mb-1">Security</p>
                    <p>
                      Your banking information is encrypted and stored securely. We only use this
                      information to process your payouts.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          <p className="text-white/40 text-sm">
            {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 rounded-xl font-medium text-white shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/20 border border-red-500/30 text-red-300'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm">{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
