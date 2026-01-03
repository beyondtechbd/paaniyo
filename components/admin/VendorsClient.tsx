// components/admin/VendorsClient.tsx
// Admin Vendor Management UI

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building2,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Shield,
  RefreshCw,
  X,
  BadgeCheck,
  Ban,
} from 'lucide-react'

interface VendorCounts {
  pending: number
  approved: number
  suspended: number
  total: number
}

interface Vendor {
  id: string
  businessName: string
  contactName: string
  contactEmail: string
  contactPhone: string
  tradeLicense: string | null
  taxId: string | null
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED'
  bankName: string | null
  bankAccount: string | null
  bkashNumber: string | null
  commissionRate: number
  balance: number
  createdAt: string
  approvedAt: string | null
  user: {
    id: string
    name: string | null
    email: string
  }
  brands: {
    id: string
    name: string
    productCount: number
  }[]
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

interface VendorsClientProps {
  initialCounts: VendorCounts
}

export default function VendorsClient({ initialCounts }: VendorsClientProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [counts, setCounts] = useState(initialCounts)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (status !== 'all') params.set('status', status)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/admin/vendors?${params}`)
      if (res.ok) {
        const data = await res.json()
        setVendors(data.vendors)
        setTotalPages(data.pagination.totalPages)
        setCounts(data.counts)
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
      showToast('error', 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  // Toast helpers
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  // Update vendor status
  const updateVendorStatus = async (vendorId: string, newStatus: string) => {
    setActionLoading(vendorId)
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status')
      }
      
      // Update local state
      setVendors(prev => prev.map(v => 
        v.id === vendorId ? { ...v, status: newStatus as Vendor['status'] } : v
      ))
      
      // Update counts
      fetchVendors()
      
      showToast('success', `Vendor ${newStatus.toLowerCase()} successfully`)
      
      if (selectedVendor?.id === vendorId) {
        setSelectedVendor(prev => prev ? { ...prev, status: newStatus as Vendor['status'] } : null)
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to update vendor')
    } finally {
      setActionLoading(null)
    }
  }

  // Status badge
  const getStatusBadge = (vendorStatus: string) => {
    switch (vendorStatus) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        )
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            <Ban className="w-3 h-3" />
            Suspended
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
  }

  const statusFilters = [
    { value: 'all', label: 'All', count: counts.total },
    { value: 'PENDING', label: 'Pending', count: counts.pending },
    { value: 'APPROVED', label: 'Approved', count: counts.approved },
    { value: 'SUSPENDED', label: 'Suspended', count: counts.suspended },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Management</h1>
          <p className="text-slate-500 mt-1">Review and manage vendor applications</p>
        </div>
        
        <button
          onClick={fetchVendors}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setStatus(filter.value)
              setPage(1)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              status === filter.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {filter.label}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              status === filter.value
                ? filter.value === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                : 'bg-slate-200 text-slate-500'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by business name, contact, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading && vendors.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">No vendors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                    Business
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                    Contact
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                    Brands
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                    Applied
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{vendor.businessName}</p>
                          <p className="text-sm text-slate-500">{vendor.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{vendor.contactName}</p>
                      <p className="text-sm text-slate-500">{vendor.contactPhone}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(vendor.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{vendor.brands.length} brand(s)</p>
                      {vendor.brands[0] && (
                        <p className="text-sm text-slate-500">
                          {vendor.brands[0].name} ({vendor.brands[0].productCount} products)
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {formatDate(vendor.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor)
                            setShowDetailModal(true)
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {vendor.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateVendorStatus(vendor.id, 'APPROVED')}
                              disabled={actionLoading === vendor.id}
                              className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              {actionLoading === vendor.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => updateVendorStatus(vendor.id, 'REJECTED')}
                              disabled={actionLoading === vendor.id}
                              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {vendor.status === 'APPROVED' && (
                          <button
                            onClick={() => updateVendorStatus(vendor.id, 'SUSPENDED')}
                            disabled={actionLoading === vendor.id}
                            className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Suspend"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        
                        {vendor.status === 'SUSPENDED' && (
                          <button
                            onClick={() => updateVendorStatus(vendor.id, 'APPROVED')}
                            disabled={actionLoading === vendor.id}
                            className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Reactivate"
                          >
                            <BadgeCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Vendor Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedVendor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Vendor Details</h2>
                  <p className="text-sm text-slate-500">{selectedVendor.businessName}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-500">Current Status</span>
                    <div className="mt-1">{getStatusBadge(selectedVendor.status)}</div>
                  </div>
                  {selectedVendor.approvedAt && (
                    <div className="text-right">
                      <span className="text-sm text-slate-500">Approved On</span>
                      <p className="text-slate-900">{formatDate(selectedVendor.approvedAt)}</p>
                    </div>
                  )}
                </div>

                {/* Business Info */}
                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <h3 className="font-medium text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    Business Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Business Name</p>
                      <p className="text-slate-900">{selectedVendor.businessName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Trade License</p>
                      <p className="text-slate-900">{selectedVendor.tradeLicense || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Tax ID</p>
                      <p className="text-slate-900">{selectedVendor.taxId || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Commission Rate</p>
                      <p className="text-slate-900">{selectedVendor.commissionRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <h3 className="font-medium text-slate-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Contact Name</p>
                      <p className="text-slate-900">{selectedVendor.contactName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Phone</p>
                      <p className="text-slate-900">{selectedVendor.contactPhone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Email</p>
                      <p className="text-slate-900">{selectedVendor.contactEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Banking Info */}
                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <h3 className="font-medium text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    Payout Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Bank Name</p>
                      <p className="text-slate-900">{selectedVendor.bankName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Account Number</p>
                      <p className="text-slate-900">{selectedVendor.bankAccount || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">bKash Number</p>
                      <p className="text-slate-900">{selectedVendor.bkashNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Current Balance</p>
                      <p className="text-emerald-600 font-medium">{formatCurrency(selectedVendor.balance)}</p>
                    </div>
                  </div>
                </div>

                {/* Brands */}
                {selectedVendor.brands.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                    <h3 className="font-medium text-slate-900 flex items-center gap-2">
                      <Store className="w-4 h-4 text-slate-500" />
                      Brands ({selectedVendor.brands.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedVendor.brands.map((brand) => (
                        <div key={brand.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="font-medium text-slate-900">{brand.name}</span>
                          <span className="text-sm text-slate-500">{brand.productCount} products</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Close
                </button>
                
                {selectedVendor.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        updateVendorStatus(selectedVendor.id, 'REJECTED')
                        setShowDetailModal(false)
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        updateVendorStatus(selectedVendor.id, 'APPROVED')
                        setShowDetailModal(false)
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-colors"
                    >
                      Approve Vendor
                    </button>
                  </>
                )}
                
                {selectedVendor.status === 'APPROVED' && (
                  <button
                    onClick={() => {
                      updateVendorStatus(selectedVendor.id, 'SUSPENDED')
                      setShowDetailModal(false)
                    }}
                    className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-medium transition-colors"
                  >
                    Suspend Vendor
                  </button>
                )}
                
                {selectedVendor.status === 'SUSPENDED' && (
                  <button
                    onClick={() => {
                      updateVendorStatus(selectedVendor.id, 'APPROVED')
                      setShowDetailModal(false)
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-colors"
                  >
                    Reactivate Vendor
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
                toast.type === 'success'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
