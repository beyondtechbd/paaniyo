'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Star,
  ShoppingCart,
  Heart,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Copy,
  ArrowUpDown,
  TrendingUp,
  PackageX,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Droplets,
  Loader2,
  Save,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
  vendor?: {
    id: string;
    businessName: string;
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  sku: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  images: string[];
  size: string;
  packSize: number;
  waterType: string | null;
  ph: number | null;
  tds: number | null;
  minerals: string[] | null;
  source: string | null;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  categoryId: string | null;
  brandId: string | null;
  brand: Brand | null;
  category: Category | null;
  _count: {
    reviews: number;
    orderItems: number;
    wishlistItems?: number;
  };
  ordersCount: number;
  createdAt: string;
}

interface ProductsClientProps {
  initialCounts: {
    active: number;
    inactive: number;
    outOfStock: number;
    total: number;
  };
  categories: Category[];
  brands: Brand[];
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'outofstock';
type SortField = 'createdAt' | 'name' | 'price' | 'stock' | 'rating' | 'reviewCount';
type SortOrder = 'asc' | 'desc';

export default function ProductsClient({
  initialCounts,
  categories,
  brands,
}: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    limit: 20,
  });
  const [counts, setCounts] = useState(initialCounts);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    sku: '',
    price: '',
    comparePrice: '',
    stock: '',
    size: '',
    packSize: '',
    waterType: '',
    ph: '',
    tds: '',
    source: '',
    categoryId: '',
    brandId: '',
    isActive: true,
    isFeatured: false,
    metaTitle: '',
    metaDescription: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (brandFilter) params.set('brand', brandFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', page.toString());

      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch products');

      const data = await res.json();
      setProducts(data.products);
      setPagination(data.pagination);
      setCounts(data.counts);
    } catch {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, brandFilter, searchQuery, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, brandFilter, searchQuery, sortBy, sortOrder]);

  const fetchProductDetails = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      const data = await res.json();
      setSelectedProduct(data.product);
      return data.product;
    } catch {
      showToast('Failed to load product details', 'error');
      return null;
    }
  };

  const openDetailModal = async (product: Product) => {
    const fullProduct = await fetchProductDetails(product.id);
    if (fullProduct) {
      setShowDetailModal(true);
    }
  };

  const openEditModal = async (product: Product) => {
    const fullProduct = await fetchProductDetails(product.id);
    if (fullProduct) {
      setEditForm({
        name: fullProduct.name || '',
        description: fullProduct.description || '',
        shortDescription: fullProduct.shortDescription || '',
        sku: fullProduct.sku || '',
        price: fullProduct.price?.toString() || '',
        comparePrice: fullProduct.comparePrice?.toString() || '',
        stock: fullProduct.stock?.toString() || '',
        size: fullProduct.size || '',
        packSize: fullProduct.packSize?.toString() || '1',
        waterType: fullProduct.waterType || '',
        ph: fullProduct.ph?.toString() || '',
        tds: fullProduct.tds?.toString() || '',
        source: fullProduct.source || '',
        categoryId: fullProduct.categoryId || '',
        brandId: fullProduct.brandId || '',
        isActive: fullProduct.isActive ?? true,
        isFeatured: fullProduct.isFeatured ?? false,
        metaTitle: fullProduct.metaTitle || '',
        metaDescription: fullProduct.metaDescription || '',
      });
      setShowEditModal(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setEditLoading(true);

      const updateData: Record<string, unknown> = {
        name: editForm.name,
        description: editForm.description,
        shortDescription: editForm.shortDescription || null,
        sku: editForm.sku,
        price: parseFloat(editForm.price),
        comparePrice: editForm.comparePrice ? parseFloat(editForm.comparePrice) : null,
        stock: parseInt(editForm.stock),
        size: editForm.size,
        packSize: parseInt(editForm.packSize) || 1,
        waterType: editForm.waterType || null,
        ph: editForm.ph ? parseFloat(editForm.ph) : null,
        tds: editForm.tds ? parseInt(editForm.tds) : null,
        source: editForm.source || null,
        categoryId: editForm.categoryId || null,
        brandId: editForm.brandId || null,
        isActive: editForm.isActive,
        isFeatured: editForm.isFeatured,
        metaTitle: editForm.metaTitle || null,
        metaDescription: editForm.metaDescription || null,
      };

      const res = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update product');
      }

      showToast('Product updated successfully', 'success');
      setShowEditModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update product', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (!res.ok) throw new Error('Failed to update product');

      showToast(
        `Product ${product.isActive ? 'deactivated' : 'activated'} successfully`,
        'success'
      );
      fetchProducts();
    } catch {
      showToast('Failed to update product', 'error');
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !product.isFeatured }),
      });

      if (!res.ok) throw new Error('Failed to update product');

      showToast(
        `Product ${product.isFeatured ? 'removed from' : 'added to'} featured`,
        'success'
      );
      fetchProducts();
    } catch {
      showToast('Failed to update product', 'error');
    }
  };

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete product');

      const data = await res.json();
      showToast(data.message, 'success');
      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchProducts();
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (product: Product) => {
    if (!product.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <ToggleLeft className="w-3 h-3" />
          Inactive
        </span>
      );
    }
    if (product.stock <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <PackageX className="w-3 h-3" />
          Out of Stock
        </span>
      );
    }
    if (product.stock <= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <AlertTriangle className="w-3 h-3" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <Check className="w-3 h-3" />
        Active
      </span>
    );
  };

  const statusTabs = [
    { key: 'all', label: 'All Products', count: counts.total },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'inactive', label: 'Inactive', count: counts.inactive },
    { key: 'outofstock', label: 'Out of Stock', count: counts.outOfStock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage all products in the marketplace</p>
        </div>
        <button
          onClick={fetchProducts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-xl font-bold text-gray-900">{counts.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xl font-bold text-gray-900">{counts.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ToggleLeft className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-xl font-bold text-gray-900">{counts.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <PackageX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-xl font-bold text-gray-900">{counts.outOfStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as StatusFilter)}
              className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  SKU
                </th>
                <th
                  className="text-left p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-1">
                    Price
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="text-left p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center gap-1">
                    Stock
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="text-left p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('rating')}
                >
                  <div className="flex items-center gap-1">
                    Rating
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                    <p className="mt-2 text-gray-600">Loading products...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Package className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Droplets className="w-6 h-6 m-3 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate max-w-48">
                              {product.name}
                            </p>
                            {product.isFeatured && (
                              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate max-w-48">
                            {product.brand?.name || 'No brand'} • {product.category?.name || 'No category'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => copyToClipboard(product.sku)}
                        className="flex items-center gap-1 text-sm font-mono text-gray-600 hover:text-gray-900"
                      >
                        {product.sku}
                        <Copy className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(product.price)}
                        </p>
                        {product.comparePrice && (
                          <p className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.comparePrice)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-medium ${
                          product.stock <= 0
                            ? 'text-red-600'
                            : product.stock <= 10
                            ? 'text-amber-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium text-gray-900">
                          {product.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({product.reviewCount})
                        </span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(product)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetailModal(product)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.isActive
                              ? 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={product.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {product.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(product)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.isFeatured
                              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                          }`}
                          title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(product)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * pagination.limit + 1} to{' '}
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum: number;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.pages}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Product Images */}
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {selectedProduct.images?.length > 0 ? (
                    selectedProduct.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
                      >
                        <Image src={img} alt={`${selectedProduct.name} ${idx + 1}`} fill className="object-cover" />
                      </div>
                    ))
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Droplets className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                    {selectedProduct.isFeatured && <Sparkles className="w-5 h-5 text-amber-500" />}
                    {getStatusBadge(selectedProduct)}
                  </div>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">SKU</p>
                    <p className="font-mono font-medium">{selectedProduct.sku}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Price</p>
                    <p className="font-medium">{formatCurrency(selectedProduct.price)}</p>
                    {selectedProduct.comparePrice && (
                      <p className="text-sm text-gray-500 line-through">
                        {formatCurrency(selectedProduct.comparePrice)}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Stock</p>
                    <p className={`font-medium ${selectedProduct.stock <= 0 ? 'text-red-600' : ''}`}>
                      {selectedProduct.stock} units
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Size</p>
                    <p className="font-medium">
                      {selectedProduct.size} × {selectedProduct.packSize}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-gray-600">Rating</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedProduct.rating.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Orders</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedProduct._count?.orderItems || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-600">Reviews</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedProduct._count?.reviews || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-600" />
                      <span className="text-sm text-gray-600">Wishlists</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedProduct._count?.wishlistItems || 0}
                    </p>
                  </div>
                </div>

                {/* Water Properties */}
                {(selectedProduct.waterType || selectedProduct.ph || selectedProduct.tds) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Water Properties</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedProduct.waterType && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase">Type</p>
                          <p className="font-medium">{selectedProduct.waterType}</p>
                        </div>
                      )}
                      {selectedProduct.ph && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase">pH Level</p>
                          <p className="font-medium">{selectedProduct.ph}</p>
                        </div>
                      )}
                      {selectedProduct.tds && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase">TDS</p>
                          <p className="font-medium">{selectedProduct.tds} ppm</p>
                        </div>
                      )}
                      {selectedProduct.source && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase">Source</p>
                          <p className="font-medium">{selectedProduct.source}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Brand & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Brand</p>
                    <p className="font-medium">
                      {selectedProduct.brand?.name || 'No brand'}
                      {selectedProduct.brand?.vendor && (
                        <span className="text-sm text-gray-500 block">
                          by {selectedProduct.brand.vendor.businessName}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Category</p>
                    <p className="font-medium">
                      {selectedProduct.category?.name || 'No category'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openEditModal(selectedProduct);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Product
                  </button>
                  <button
                    onClick={() => handleToggleActive(selectedProduct)}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      selectedProduct.isActive
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {selectedProduct.isActive ? (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        Activate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Short Description
                      </label>
                      <input
                        type="text"
                        value={editForm.shortDescription}
                        onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU *
                      </label>
                      <input
                        type="text"
                        value={editForm.sku}
                        onChange={(e) => setEditForm({ ...editForm, sku: e.target.value.toUpperCase() })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Pricing & Stock</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (৳) *
                      </label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Compare Price (৳)
                      </label>
                      <input
                        type="number"
                        value={editForm.comparePrice}
                        onChange={(e) => setEditForm({ ...editForm, comparePrice: e.target.value })}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock *
                      </label>
                      <input
                        type="number"
                        value={editForm.stock}
                        onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Attributes */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Product Attributes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size
                      </label>
                      <input
                        type="text"
                        value={editForm.size}
                        onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                        placeholder="e.g., 500ml, 1L"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pack Size
                      </label>
                      <input
                        type="number"
                        value={editForm.packSize}
                        onChange={(e) => setEditForm({ ...editForm, packSize: e.target.value })}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Water Type
                      </label>
                      <select
                        value={editForm.waterType}
                        onChange={(e) => setEditForm({ ...editForm, waterType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select type</option>
                        <option value="Mineral">Mineral</option>
                        <option value="Purified">Purified</option>
                        <option value="Spring">Spring</option>
                        <option value="Alkaline">Alkaline</option>
                        <option value="Sparkling">Sparkling</option>
                        <option value="Distilled">Distilled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        pH Level
                      </label>
                      <input
                        type="number"
                        value={editForm.ph}
                        onChange={(e) => setEditForm({ ...editForm, ph: e.target.value })}
                        min="0"
                        max="14"
                        step="0.1"
                        placeholder="7.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TDS (ppm)
                      </label>
                      <input
                        type="number"
                        value={editForm.tds}
                        onChange={(e) => setEditForm({ ...editForm, tds: e.target.value })}
                        min="0"
                        placeholder="150"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source
                      </label>
                      <input
                        type="text"
                        value={editForm.source}
                        onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                        placeholder="e.g., Himalayan Spring"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Category & Brand */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Category & Brand</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={editForm.categoryId}
                        onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">No category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand
                      </label>
                      <select
                        value={editForm.brandId}
                        onChange={(e) => setEditForm({ ...editForm, brandId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">No brand</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Status</h3>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isFeatured}
                        onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">Featured</span>
                    </label>
                  </div>
                </div>

                {/* SEO */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">SEO</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={editForm.metaTitle}
                        onChange={(e) => setEditForm({ ...editForm, metaTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        value={editForm.metaDescription}
                        onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {editLoading ? (
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
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && productToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Product</h2>
              </div>

              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>{productToDelete.name}</strong>?
              </p>

              {productToDelete._count?.orderItems > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> This product has {productToDelete._count.orderItems} orders.
                    It will be deactivated instead of deleted to preserve order history.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {productToDelete._count?.orderItems > 0 ? 'Deactivate' : 'Delete'}
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
            className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
