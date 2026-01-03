'use client'

// components/vendor/BrandClient.tsx
// Vendor Brand Management Client Component

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  Save,
  Camera,
  Image as ImageIcon,
  Globe,
  MapPin,
  FileText,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  Loader2,
  Info,
  X,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
  description: string | null
  story: string | null
  logo: string | null
  banner: string | null
  country: string | null
  region: string | null
  metaTitle: string | null
  metaDescription: string | null
  isActive: boolean
  isFeatured: boolean
  productCount: number
  createdAt: string
  updatedAt: string
}

interface BrandClientProps {
  initialBrand: Brand
}

export default function BrandClient({ initialBrand }: BrandClientProps) {
  const [brand, setBrand] = useState<Brand>(initialBrand)
  const [formData, setFormData] = useState({
    name: initialBrand.name,
    description: initialBrand.description || '',
    story: initialBrand.story || '',
    logo: initialBrand.logo || '',
    banner: initialBrand.banner || '',
    country: initialBrand.country || '',
    region: initialBrand.region || '',
    metaTitle: initialBrand.metaTitle || '',
    metaDescription: initialBrand.metaDescription || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'branding' | 'seo'>('basic')
  const [previewLogo, setPreviewLogo] = useState(initialBrand.logo || '')
  const [previewBanner, setPreviewBanner] = useState(initialBrand.banner || '')

  // Track changes
  useEffect(() => {
    const changed = 
      formData.name !== initialBrand.name ||
      formData.description !== (initialBrand.description || '') ||
      formData.story !== (initialBrand.story || '') ||
      formData.logo !== (initialBrand.logo || '') ||
      formData.banner !== (initialBrand.banner || '') ||
      formData.country !== (initialBrand.country || '') ||
      formData.region !== (initialBrand.region || '') ||
      formData.metaTitle !== (initialBrand.metaTitle || '') ||
      formData.metaDescription !== (initialBrand.metaDescription || '')
    
    setHasChanges(changed)
  }, [formData, initialBrand])

  // Update preview when URL changes
  useEffect(() => {
    setPreviewLogo(formData.logo)
    setPreviewBanner(formData.banner)
  }, [formData.logo, formData.banner])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Brand name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Brand name must be at least 2 characters'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Brand name must be less than 100 characters'
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters'
    }

    if (formData.story && formData.story.length > 5000) {
      newErrors.story = 'Brand story must be less than 5000 characters'
    }

    if (formData.logo && !isValidUrl(formData.logo)) {
      newErrors.logo = 'Please enter a valid URL'
    }

    if (formData.banner && !isValidUrl(formData.banner)) {
      newErrors.banner = 'Please enter a valid URL'
    }

    if (formData.metaTitle && formData.metaTitle.length > 60) {
      newErrors.metaTitle = 'Meta title must be less than 60 characters'
    }

    if (formData.metaDescription && formData.metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta description must be less than 160 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please fix the errors below' })
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/vendor/brand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          story: formData.story || null,
          logo: formData.logo || null,
          banner: formData.banner || null,
          country: formData.country || null,
          region: formData.region || null,
          metaTitle: formData.metaTitle || null,
          metaDescription: formData.metaDescription || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update brand')
      }

      // Update local state
      setBrand(prev => ({
        ...prev,
        ...data.brand,
      }))

      setToast({ type: 'success', message: 'Brand updated successfully!' })
      setHasChanges(false)
    } catch (error) {
      setToast({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to update brand' 
      })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Store },
    { id: 'branding', label: 'Branding', icon: Camera },
    { id: 'seo', label: 'SEO', icon: Search },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <Store className="w-7 h-7 text-sky-400" />
            Brand Management
          </h1>
          <p className="text-slate-400 mt-1">
            Customize your brand profile and appearance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/brands/${brand.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View Store</span>
          </a>
          
          <motion.button
            onClick={handleSubmit}
            disabled={saving || !hasChanges}
            whileHover={{ scale: hasChanges ? 1.02 : 1 }}
            whileTap={{ scale: hasChanges ? 0.98 : 1 }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
              hasChanges
                ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-lg shadow-sky-500/25'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </motion.button>
        </div>
      </div>

      {/* Brand Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border border-sky-500/20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Logo Preview */}
          <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {previewLogo ? (
              <img 
                src={previewLogo} 
                alt={brand.name}
                className="w-full h-full object-cover"
                onError={() => setPreviewLogo('')}
              />
            ) : (
              <Store className="w-8 h-8 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{brand.name}</h2>
            <p className="text-sm text-slate-400">
              {brand.productCount} products • Joined {new Date(brand.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              brand.isActive
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {brand.isActive ? 'Active' : 'Inactive'}
            </span>
            {brand.isFeatured && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                Featured
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'basic' && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Basic Info */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-sky-400" />
                  Basic Information
                </h3>

                {/* Brand Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.name ? 'border-red-500' : 'border-white/10'
                    } text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all`}
                    placeholder="Your brand name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Store URL: paaniyo.com/brands/{brand.slug}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Short Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.description ? 'border-red-500' : 'border-white/10'
                    } text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all resize-none`}
                    placeholder="A brief description of your brand (shown on brand listings)"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                {/* Origin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Country of Origin
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                      placeholder="e.g., Bangladesh"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Region
                    </label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                      placeholder="e.g., Dhaka Division"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Story */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Brand Story
                </h3>
                <p className="text-sm text-slate-400">
                  Tell customers about your brand's history, values, and what makes your products special.
                </p>
                <textarea
                  name="story"
                  value={formData.story}
                  onChange={handleChange}
                  rows={8}
                  className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                    errors.story ? 'border-red-500' : 'border-white/10'
                  } text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all resize-none`}
                  placeholder="Share your brand's story, mission, and what makes your products unique..."
                />
                {errors.story && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.story}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {formData.story.length}/5000 characters
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'branding' && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Logo */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-sky-400" />
                  Brand Logo
                </h3>
                <p className="text-sm text-slate-400">
                  Your logo appears on product pages and brand listings. Recommended: 400×400px, square format.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Preview */}
                  <div className="w-32 h-32 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
                    {previewLogo ? (
                      <img 
                        src={previewLogo} 
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                        onError={() => setPreviewLogo('')}
                      />
                    ) : (
                      <div className="text-center text-slate-500">
                        <Camera className="w-8 h-8 mx-auto mb-1" />
                        <span className="text-xs">No logo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      name="logo"
                      value={formData.logo}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                        errors.logo ? 'border-red-500' : 'border-white/10'
                      } text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all`}
                      placeholder="https://example.com/logo.png"
                    />
                    {errors.logo && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.logo}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Use a direct link to your image file
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                  Brand Banner
                </h3>
                <p className="text-sm text-slate-400">
                  A banner image for your brand page. Recommended: 1600×400px, landscape format.
                </p>

                {/* Banner Preview */}
                <div className="w-full h-40 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                  {previewBanner ? (
                    <img 
                      src={previewBanner} 
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                      onError={() => setPreviewBanner('')}
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                      <span className="text-sm">No banner image</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Banner URL
                  </label>
                  <input
                    type="url"
                    name="banner"
                    value={formData.banner}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.banner ? 'border-red-500' : 'border-white/10'
                    } text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all`}
                    placeholder="https://example.com/banner.jpg"
                  />
                  {errors.banner && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.banner}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'seo' && (
            <motion.div
              key="seo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* SEO Settings */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-sky-400" />
                    Search Engine Optimization
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Optimize how your brand appears in search engine results.
                  </p>
                </div>

                {/* Meta Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.metaTitle ? 'border-red-500' : 'border-white/10'
                    } text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all`}
                    placeholder={`${brand.name} | Premium Hydration | Paaniyo`}
                  />
                  {errors.metaTitle && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.metaTitle}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.metaTitle.length}/60 characters • Leave empty to use default
                  </p>
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.metaDescription ? 'border-red-500' : 'border-white/10'
                    } text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all resize-none`}
                    placeholder="A compelling description of your brand that will appear in search results..."
                  />
                  {errors.metaDescription && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.metaDescription}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>

                {/* SEO Preview */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Search Preview</h4>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sky-400 text-lg hover:underline cursor-pointer">
                      {formData.metaTitle || `${brand.name} | Premium Hydration | Paaniyo`}
                    </p>
                    <p className="text-emerald-500 text-sm">
                      paaniyo.com/brands/{brand.slug}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      {formData.metaDescription || formData.description || `Shop ${brand.name} products at Paaniyo - Bangladesh's premium hydration marketplace.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* SEO Tips */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border border-sky-500/20">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-sky-400" />
                  SEO Tips
                </h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Keep your meta title under 60 characters for best display
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Include your brand name and key products in the description
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Make your description compelling - it's your first impression in search results
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    Use natural language - avoid keyword stuffing
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Unsaved Changes Warning */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="px-6 py-3 rounded-full bg-amber-500/90 text-white font-medium shadow-lg shadow-amber-500/25 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              You have unsaved changes
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-4 left-1/2 z-50"
          >
            <div className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {toast.message}
              <button
                onClick={() => setToast(null)}
                className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
