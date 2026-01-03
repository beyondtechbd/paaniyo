// components/vendor/OrdersClient.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Truck,
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Loader2,
  XCircle,
  Package,
  ArrowUpDown,
} from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  brandName: string
  quantity: number
  priceBDT: number
  total: number
  status: string
}

interface Order {
  id: string
  orderNo: string
  status: string
  paymentStatus: string
  paymentMethod: string
  customer: {
    name: string | null
    email: string | null
    phone: string | null
  }
  shippingAddress: {
    name: string
    phone: string
    address: string
    area: string
    city: string
    division: string
  } | null
  items: OrderItem[]
  vendorSubtotal: number
  vendorItemCount: number
  totalBDT: number
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  notes: string | null
}

interface Stats {
  pending: number
  processing: number
  shipped: number
  delivered: number
}

interface Props {
  brandId: string | undefined
  brandName: string
  commissionRate: number
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'Pending', color: 'bg-slate-100 text-slate-700', icon: Clock },
  PAID: { label: 'Paid', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  PROCESSING: { label: 'Processing', color: 'bg-amber-100 text-amber-700', icon: Clock },
  SHIPPED: { label: 'Shipped', color: 'bg-purple-100 text-purple-700', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: PackageCheck },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const statusFilters = [
  { value: '', label: 'All Orders' },
  { value: 'PAID', label: 'New / Paid' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'total-high', label: 'Total: High to Low' },
  { value: 'total-low', label: 'Total: Low to High' },
]

const itemStatusOptions = [
  { value: 'PROCESSING', label: 'Processing', color: 'text-amber-600' },
  { value: 'SHIPPED', label: 'Shipped', color: 'text-purple-600' },
  { value: 'DELIVERED', label: 'Delivered', color: 'text-emerald-600' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'text-red-600' },
]

export default function OrdersClient({ brandId, brandName, commissionRate }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<Stats>({ pending: 0, processing: 0, shipped: 0, delivered: 0 })
  
  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingItem, setUpdatingItem] = useState<string | null>(null)
  
  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort,
      })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      
      const res = await fetch(`/api/vendor/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      showToast('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, status, sort, dateFrom, dateTo])
  
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])
  
  useEffect(() => {
    setPage(1)
  }, [search, status, sort, dateFrom, dateTo])
  
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  const updateItemStatus = async (orderId: string, itemId: string, newStatus: string) => {
    try {
      setUpdatingItem(itemId)
      
      const res = await fetch(`/api/vendor/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status: newStatus })
      })
      
      if (res.ok) {
        // Update local state
        setOrders(prev => prev.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              items: order.items.map(item => 
                item.id === itemId ? { ...item, status: newStatus } : item
              )
            }
          }
          return order
        }))
        
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? {
            ...prev,
            items: prev.items.map(item => 
              item.id === itemId ? { ...item, status: newStatus } : item
            )
          } : null)
        }
        
        showToast('Item status updated', 'success')
        fetchOrders() // Refresh to get updated order status
      } else {
        showToast('Failed to update status', 'error')
      }
    } catch (error) {
      showToast('Failed to update status', 'error')
    } finally {
      setUpdatingItem(null)
    }
  }
  
  const getOrderStatus = (order: Order) => {
    const config = statusConfig[order.status] || statusConfig.PENDING
    return config
  }
  
  const activeFiltersCount = [status, dateFrom, dateTo].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">
            Manage {brandName} orders and shipments
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setStatus(status === 'PAID' ? '' : 'PAID')}
          className={`p-4 rounded-xl border transition-colors text-left ${
            status === 'PAID'
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">New Orders</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
        </motion.button>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => setStatus(status === 'PROCESSING' ? '' : 'PROCESSING')}
          className={`p-4 rounded-xl border transition-colors text-left ${
            status === 'PROCESSING'
              ? 'border-amber-500 bg-amber-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Processing</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.processing}</p>
        </motion.button>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setStatus(status === 'SHIPPED' ? '' : 'SHIPPED')}
          className={`p-4 rounded-xl border transition-colors text-left ${
            status === 'SHIPPED'
              ? 'border-purple-500 bg-purple-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Truck className="w-5 h-5" />
            <span className="text-sm font-medium">Shipped</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.shipped}</p>
        </motion.button>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => setStatus(status === 'DELIVERED' ? '' : 'DELIVERED')}
          className={`p-4 rounded-xl border transition-colors text-left ${
            status === 'DELIVERED'
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <PackageCheck className="w-5 h-5" />
            <span className="text-sm font-medium">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.delivered}</p>
        </motion.button>
      </div>
      
      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number or customer..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        
        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-4 border-t border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {statusFilters.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setStatus('')
                    setDateFrom('')
                    setDateTo('')
                  }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{total} order{total !== 1 ? 's' : ''} found</span>
      </div>
      
      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
          <p className="text-slate-500">
            {search || status || dateFrom || dateTo
              ? 'Try adjusting your filters'
              : 'Orders will appear here when customers purchase your products'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getOrderStatus(order)
            const StatusIcon = statusConfig.icon
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-100 gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          #{order.orderNo.slice(-8)}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Your portion</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.vendorSubtotal)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Customer Info */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      {order.customer.name || 'Guest'}
                    </div>
                    {order.shippingAddress && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {order.shippingAddress.city}, {order.shippingAddress.division}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Package className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/product/${item.productSlug}`}
                              target="_blank"
                              className="font-medium text-slate-900 hover:text-sky-600 truncate block"
                            >
                              {item.productName}
                            </Link>
                            <p className="text-sm text-slate-500">
                              {formatCurrency(item.priceBDT)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <p className="font-medium text-slate-900 whitespace-nowrap">
                            {formatCurrency(item.total)}
                          </p>
                          
                          {/* Item status selector */}
                          <div className="relative">
                            <select
                              value={item.status}
                              onChange={(e) => updateItemStatus(order.id, item.id, e.target.value)}
                              disabled={updatingItem === item.id || item.status === 'DELIVERED' || item.status === 'CANCELLED'}
                              className={`appearance-none pl-3 pr-8 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                item.status === 'DELIVERED'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : item.status === 'CANCELLED'
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : item.status === 'SHIPPED'
                                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                                  : item.status === 'PROCESSING'
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-white border-slate-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {itemStatusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            {updatingItem === item.id ? (
                              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                            ) : (
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= page - 1 && pageNum <= page + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {pageNum}
                </button>
              )
            }
            if (pageNum === page - 2 || pageNum === page + 2) {
              return <span key={pageNum} className="text-slate-400">...</span>
            }
            return null
          })}
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              className="bg-white rounded-xl w-full max-w-2xl my-8"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Order #{selectedOrder.orderNo.slice(-8)}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {formatDateTime(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    statusConfig[selectedOrder.status]?.color || 'bg-slate-100 text-slate-700'
                  }`}>
                    {(() => {
                      const config = statusConfig[selectedOrder.status]
                      const Icon = config?.icon || Clock
                      return <Icon className="w-4 h-4" />
                    })()}
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                  <span className="text-sm text-slate-500">
                    {selectedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
                
                {/* Customer */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Customer</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{selectedOrder.customer.name || 'Guest'}</span>
                    </div>
                    {selectedOrder.customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{selectedOrder.customer.email}</span>
                      </div>
                    )}
                    {selectedOrder.customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{selectedOrder.customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 mb-3">Shipping Address</h3>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p className="font-medium">{selectedOrder.shippingAddress.name}</p>
                      <p>{selectedOrder.shippingAddress.phone}</p>
                      <p>{selectedOrder.shippingAddress.address}</p>
                      <p>
                        {selectedOrder.shippingAddress.area}, {selectedOrder.shippingAddress.city}
                      </p>
                      <p>{selectedOrder.shippingAddress.division}</p>
                    </div>
                  </div>
                )}
                
                {/* Items */}
                <div>
                  <h3 className="font-medium text-slate-900 mb-3">Your Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {item.productName}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatCurrency(item.priceBDT)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium text-slate-900">
                            {formatCurrency(item.total)}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.status === 'SHIPPED'
                              ? 'bg-purple-100 text-purple-700'
                              : item.status === 'PROCESSING'
                              ? 'bg-amber-100 text-amber-700'
                              : item.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Total */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Your Subtotal</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(selectedOrder.vendorSubtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm text-slate-500">
                    <span>Platform Fee ({commissionRate}%)</span>
                    <span>-{formatCurrency(selectedOrder.vendorSubtotal * commissionRate / 100)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                    <span className="font-medium text-slate-900">Net Earnings</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(selectedOrder.vendorSubtotal * (100 - commissionRate) / 100)}
                    </span>
                  </div>
                </div>
                
                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h3 className="font-medium text-amber-800 mb-1">Customer Notes</h3>
                    <p className="text-sm text-amber-700">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-end p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
