// components/vendor/ProductsClient.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Plus,
  Search,
  Filter,
  X,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Image as ImageIcon,
  Loader2,
  Check,
  Droplets,
  LayoutGrid,
  List,
  ArrowUpDown,
  PackageX,
} from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  category: string
  priceBDT: number
  compareBDT: number | null
  sku: string | null
  stock: number
  lowStockAt: number
  trackStock: boolean
  waterType: string | null
  volumeMl: number | null
  packSize: number
  images: string[]
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  brandName: string
  reviewsCount: number
  ordersCount: number
}

interface Props {
  brandId: string | undefined
  brandName: string
}

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'BOTTLED_WATER', label: 'Bottled Water' },
  { value: 'SPARKLING_WATER', label: 'Sparkling Water' },
  { value: 'FILTRATION_SYSTEM', label: 'Filtration System' },
  { value: 'SOFT_DRINK', label: 'Soft Drink' },
  { value: 'FIZZY_DRINK', label: 'Fizzy Drink' },
]

const waterTypes = [
  { value: '', label: 'Any Type' },
  { value: 'STILL', label: 'Still' },
  { value: 'SPARKLING', label: 'Sparkling' },
  { value: 'MINERAL', label: 'Mineral' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'ARTESIAN', label: 'Artesian' },
]

const statusFilters = [
  { value: '', label: 'All Products' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'lowStock', label: 'Low Stock' },
  { value: 'outOfStock', label: 'Out of Stock' },
]

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'stock-low', label: 'Stock: Low to High' },
  { value: 'stock-high', label: 'Stock: High to Low' },
]

export default function ProductsClient({ brandId, brandName }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filters
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  
  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort,
      })
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      if (status) params.set('status', status)
      
      const res = await fetch(`/api/vendor/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      showToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, category, status, sort])
  
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])
  
  useEffect(() => {
    setPage(1)
  }, [search, category, status, sort])
  
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
  
  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  const getStockStatus = (product: Product) => {
    if (!product.trackStock) return { label: 'Not Tracked', color: 'bg-slate-100 text-slate-600' }
    if (product.stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' }
    if (product.stock <= product.lowStockAt) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700' }
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700' }
  }
  
  const toggleProductStatus = async (product: Product) => {
    try {
      const res = await fetch(`/api/vendor/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive })
      })
      
      if (res.ok) {
        setProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, isActive: !p.isActive } : p
        ))
        showToast(`Product ${product.isActive ? 'deactivated' : 'activated'}`, 'success')
      } else {
        showToast('Failed to update product status', 'error')
      }
    } catch (error) {
      showToast('Failed to update product status', 'error')
    }
  }
  
  const deleteProduct = async () => {
    if (!deletingProduct) return
    
    try {
      const res = await fetch(`/api/vendor/products/${deletingProduct.id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.softDeleted) {
          setProducts(prev => prev.map(p => 
            p.id === deletingProduct.id ? { ...p, isActive: false } : p
          ))
          showToast('Product deactivated (has existing orders)', 'success')
        } else {
          setProducts(prev => prev.filter(p => p.id !== deletingProduct.id))
          showToast('Product deleted successfully', 'success')
        }
        setDeletingProduct(null)
      } else {
        showToast('Failed to delete product', 'error')
      }
    } catch (error) {
      showToast('Failed to delete product', 'error')
    }
  }
  
  const activeFiltersCount = [category, status].filter(Boolean).length

  if (!brandId) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No Brand Found</h2>
        <p className="text-slate-500 mb-6">
          You need to create a brand before adding products.
        </p>
        <Link
          href="/vendor/brand"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          Create Brand
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">
            Manage your {brandName} product catalog
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
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
              placeholder="Search products by name or SKU..."
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
            
            {/* View toggle */}
            <div className="flex items-center border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
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
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setCategory('')
                      setStatus('')
                    }}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{total} product{total !== 1 ? 's' : ''} found</span>
        {(category || status || search) && (
          <button
            onClick={() => {
              setCategory('')
              setStatus('')
              setSearch('')
            }}
            className="text-sky-600 hover:text-sky-700"
          >
            Clear all
          </button>
        )}
      </div>
      
      {/* Products List/Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <PackageX className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
          <p className="text-slate-500 mb-6">
            {search || category || status
              ? 'Try adjusting your filters'
              : 'Add your first product to get started'}
          </p>
          {!search && !category && !status && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product)
                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate max-w-xs">
                              {product.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {product.sku || 'No SKU'}
                              {product.volumeMl && ` • ${product.volumeMl}ml`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-600">
                          {formatCategory(product.category)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {formatCurrency(product.priceBDT)}
                          </p>
                          {product.compareBDT && product.compareBDT > product.priceBDT && (
                            <p className="text-sm text-slate-400 line-through">
                              {formatCurrency(product.compareBDT)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                          {product.trackStock && (
                            <span className="text-sm text-slate-500">
                              ({product.stock})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleProductStatus(product)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            product.isActive
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {product.isActive ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/product/${product.slug}`}
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            title="View on store"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const stockStatus = getStockStatus(product)
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden group"
              >
                {/* Image */}
                <div className="aspect-square relative bg-slate-100">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Droplets className="w-16 h-16 text-slate-200" />
                    </div>
                  )}
                  
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Link
                      href={`/product/${product.slug}`}
                      target="_blank"
                      className="p-2 bg-white rounded-lg text-slate-700 hover:text-sky-600"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-2 bg-white rounded-lg text-slate-700 hover:text-sky-600"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(product)}
                      className="p-2 bg-white rounded-lg text-slate-700 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-500 text-white'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-4">
                  <p className="font-medium text-slate-900 truncate">{product.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {formatCategory(product.category)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(product.priceBDT)}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span>{product.reviewsCount} reviews</span>
                    <span>{product.ordersCount} orders</span>
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
      
      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingProduct) && (
          <ProductFormModal
            product={editingProduct}
            brandId={brandId}
            onClose={() => {
              setShowAddModal(false)
              setEditingProduct(null)
            }}
            onSuccess={() => {
              setShowAddModal(false)
              setEditingProduct(null)
              fetchProducts()
              showToast(editingProduct ? 'Product updated' : 'Product created', 'success')
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setDeletingProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Product</h3>
              </div>
              
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete <strong>{deletingProduct.name}</strong>?
                {deletingProduct.ordersCount > 0 && (
                  <span className="block mt-2 text-sm text-amber-600">
                    This product has {deletingProduct.ordersCount} orders and will be deactivated instead.
                  </span>
                )}
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeletingProduct(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteProduct}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
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
              <Check className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Product Form Modal Component
interface ProductFormModalProps {
  product: Product | null
  brandId: string
  onClose: () => void
  onSuccess: () => void
}

function ProductFormModal({ product, brandId, onClose, onSuccess }: ProductFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form state
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'BOTTLED_WATER',
    priceBDT: product?.priceBDT?.toString() || '',
    compareBDT: product?.compareBDT?.toString() || '',
    sku: product?.sku || '',
    stock: product?.stock?.toString() || '0',
    lowStockAt: product?.lowStockAt?.toString() || '10',
    trackStock: product?.trackStock ?? true,
    waterType: product?.waterType || '',
    volumeMl: product?.volumeMl?.toString() || '',
    packSize: product?.packSize?.toString() || '1',
    shortDesc: '',
    description: '',
    images: product?.images || [],
    freeShipping: product?.freeShipping ?? false,
    sustainable: product?.sustainable ?? false,
    isActive: product?.isActive ?? true,
  })
  
  const [newImageUrl, setNewImageUrl] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Basic validation
    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }
    if (!formData.priceBDT || parseFloat(formData.priceBDT) <= 0) {
      setErrors({ priceBDT: 'Valid price is required' })
      return
    }
    
    try {
      setLoading(true)
      
      const payload = {
        name: formData.name,
        category: formData.category,
        priceBDT: parseFloat(formData.priceBDT),
        compareBDT: formData.compareBDT ? parseFloat(formData.compareBDT) : null,
        sku: formData.sku || null,
        stock: parseInt(formData.stock) || 0,
        lowStockAt: parseInt(formData.lowStockAt) || 10,
        trackStock: formData.trackStock,
        waterType: formData.waterType || null,
        volumeMl: formData.volumeMl ? parseInt(formData.volumeMl) : null,
        packSize: parseInt(formData.packSize) || 1,
        shortDesc: formData.shortDesc || null,
        description: formData.description || null,
        images: formData.images,
        freeShipping: formData.freeShipping,
        sustainable: formData.sustainable,
        isActive: formData.isActive,
      }
      
      const url = product
        ? `/api/vendor/products/${product.id}`
        : '/api/vendor/products'
      
      const res = await fetch(url, {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const data = await res.json()
        if (data.details) {
          const fieldErrors: Record<string, string> = {}
          data.details.forEach((err: any) => {
            if (err.path?.[0]) {
              fieldErrors[err.path[0]] = err.message
            }
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ general: data.error || 'Failed to save product' })
        }
        return
      }
      
      onSuccess()
    } catch (error) {
      setErrors({ general: 'Failed to save product' })
    } finally {
      setLoading(false)
    }
  }
  
  const addImage = () => {
    if (newImageUrl && !formData.images.includes(newImageUrl)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl]
      }))
      setNewImageUrl('')
    }
  }
  
  const removeImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== url)
    }))
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto"
      onClick={onClose}
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
          <h2 className="text-xl font-semibold text-slate-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              {errors.general}
            </div>
          )}
          
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.name ? 'border-red-500' : 'border-slate-200'
                }`}
                placeholder="e.g., Premium Spring Water 500ml"
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Water Type
                </label>
                <select
                  value={formData.waterType}
                  onChange={(e) => setFormData(prev => ({ ...prev, waterType: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {waterTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="e.g., PWS-500-001"
              />
            </div>
          </div>
          
          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Pricing</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price (BDT) *
                </label>
                <input
                  type="number"
                  value={formData.priceBDT}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceBDT: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    errors.priceBDT ? 'border-red-500' : 'border-slate-200'
                  }`}
                  placeholder="0"
                  min="1"
                />
                {errors.priceBDT && <p className="text-sm text-red-600 mt-1">{errors.priceBDT}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Compare Price (BDT)
                </label>
                <input
                  type="number"
                  value={formData.compareBDT}
                  onChange={(e) => setFormData(prev => ({ ...prev, compareBDT: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          {/* Stock */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Inventory</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.trackStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, trackStock: e.target.checked }))}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <span className="text-sm text-slate-600">Track stock</span>
              </label>
            </div>
            
            {formData.trackStock && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Low Stock Alert At
                  </label>
                  <input
                    type="number"
                    value={formData.lowStockAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, lowStockAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Product Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Volume (ml)
                </label>
                <input
                  type="number"
                  value={formData.volumeMl}
                  onChange={(e) => setFormData(prev => ({ ...prev, volumeMl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g., 500"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pack Size
                </label>
                <input
                  type="number"
                  value={formData.packSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, packSize: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  min="1"
                />
              </div>
            </div>
          </div>
          
          {/* Images */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Images</h3>
            
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Enter image URL"
              />
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Add
              </button>
            </div>
            
            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`Product ${i + 1}`}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Options */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-900">Options</h3>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.freeShipping}
                onChange={(e) => setFormData(prev => ({ ...prev, freeShipping: e.target.checked }))}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
              <span className="text-sm text-slate-700">Free shipping</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sustainable}
                onChange={(e) => setFormData(prev => ({ ...prev, sustainable: e.target.checked }))}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
              <span className="text-sm text-slate-700">Eco-friendly / Sustainable</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
              <span className="text-sm text-slate-700">Active (visible on store)</span>
            </label>
          </div>
        </form>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {product ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
