// components/search/SearchClient.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Grid3X3,
  LayoutList,
  ShoppingCart,
  Heart,
  Star,
  Truck,
  Leaf,
  Sparkles,
  SlidersHorizontal,
  Package,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  image: string;
  volumeMl: number | null;
  waterType: string | null;
  stock: number;
  freeShipping: boolean;
  isFeatured: boolean;
  sustainable: boolean;
  brand: { id: string; name: string; slug: string };
  discount: number;
  available: boolean;
}

interface SearchClientProps {
  initialData: {
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: {
      brands: Array<{ id: string; name: string; slug: string }>;
      categories: Array<{ value: string; label: string; count: number }>;
      waterTypes: Array<{ value: string; label: string; count: number }>;
      priceRange: { min: number; max: number };
    };
  };
  query: string;
  currentFilters: {
    category?: string;
    brand?: string;
    waterType?: string;
    minPrice?: string;
    maxPrice?: string;
  };
  currentSort: string;
}

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

const waterTypeLabels: Record<string, string> = {
  STILL: 'Still',
  SPARKLING: 'Sparkling',
  MINERAL: 'Mineral',
  SPRING: 'Spring',
  ARTESIAN: 'Artesian',
};

export function SearchClient({ initialData, query, currentFilters, currentSort }: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  
  // Local filter state for mobile drawer
  const [localFilters, setLocalFilters] = useState(currentFilters);

  const { products, pagination, filters } = initialData;

  const updateURL = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 1 when filters change
    if (!updates.page) {
      params.delete('page');
    }
    
    router.push(`/search?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(`/search${query ? `?q=${query}` : ''}`);
  };

  const hasActiveFilters = Object.values(currentFilters).some(v => v);

  const addToCart = async (productId: string) => {
    setAddingToCart(prev => new Set(prev).add(productId));

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add to cart');
      }

      toast.success('Added to cart');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to add to cart');
    } finally {
      setAddingToCart(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const addToWishlist = async (productId: string) => {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          toast.info('Already in wishlist');
          return;
        }
        throw new Error(data.error);
      }

      toast.success('Added to wishlist');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to add to wishlist');
    }
  };

  // Filter Sidebar Component
  const FilterSidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? '' : 'sticky top-24'}>
      {/* Categories */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Category</h3>
        <div className="space-y-2">
          {filters.categories.map((cat) => (
            <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={currentFilters.category === cat.value}
                onChange={() => updateURL({ category: currentFilters.category === cat.value ? undefined : cat.value })}
                className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                {cat.label}
              </span>
              <span className="text-xs text-slate-400">({cat.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Brand</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filters.brands.map((brand) => (
            <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="brand"
                checked={currentFilters.brand === brand.slug}
                onChange={() => updateURL({ brand: currentFilters.brand === brand.slug ? undefined : brand.slug })}
                className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {brand.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Water Type */}
      {filters.waterTypes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Water Type</h3>
          <div className="space-y-2">
            {filters.waterTypes.map((type) => (
              <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="waterType"
                  checked={currentFilters.waterType === type.value}
                  onChange={() => updateURL({ waterType: currentFilters.waterType === type.value ? undefined : type.value })}
                  className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                  {type.label}
                </span>
                <span className="text-xs text-slate-400">({type.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={currentFilters.minPrice || ''}
            onChange={(e) => updateURL({ minPrice: e.target.value || undefined })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={currentFilters.maxPrice || ''}
            onChange={(e) => updateURL({ maxPrice: e.target.value || undefined })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Range: ৳{filters.priceRange.min.toLocaleString()} - ৳{filters.priceRange.max.toLocaleString()}
        </p>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2 text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
          {query ? `Search results for "${query}"` : 'All Products'}
        </h1>
        <p className="text-slate-500">
          {pagination.total} {pagination.total === 1 ? 'product' : 'products'} found
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <FilterSidebar />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                  {Object.values(currentFilters).filter(Boolean).length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-4 ml-auto">
              {/* Sort */}
              <div className="relative">
                <select
                  value={currentSort}
                  onChange={(e) => updateURL({ sort: e.target.value })}
                  className="appearance-none pl-4 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* View Mode */}
              <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {currentFilters.category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {currentFilters.category.replace('_', ' ')}
                  <button onClick={() => updateURL({ category: undefined })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {currentFilters.brand && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {filters.brands.find(b => b.slug === currentFilters.brand)?.name}
                  <button onClick={() => updateURL({ brand: undefined })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {currentFilters.waterType && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {waterTypeLabels[currentFilters.waterType]}
                  <button onClick={() => updateURL({ waterType: undefined })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(currentFilters.minPrice || currentFilters.maxPrice) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  ৳{currentFilters.minPrice || 0} - ৳{currentFilters.maxPrice || '∞'}
                  <button onClick={() => updateURL({ minPrice: undefined, maxPrice: undefined })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-4'
            }>
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={viewMode === 'grid'
                    ? 'group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all'
                    : 'group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex'
                  }
                >
                  {/* Image */}
                  <Link
                    href={`/product/${product.slug}`}
                    className={viewMode === 'grid' ? 'block' : 'block w-48 flex-shrink-0'}
                  >
                    <div className={`relative ${viewMode === 'grid' ? 'aspect-square' : 'h-full'} overflow-hidden bg-slate-100 dark:bg-slate-700`}>
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.discount > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                            -{product.discount}%
                          </span>
                        )}
                        {product.isFeatured && (
                          <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* Wishlist */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          addToWishlist(product.id);
                        }}
                        className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      >
                        <Heart className="w-4 h-4 text-slate-600 hover:text-red-500" />
                      </button>

                      {!product.available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="px-3 py-1 bg-white text-slate-900 text-sm font-medium rounded-full">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className={viewMode === 'grid' ? 'p-4' : 'p-4 flex-1 flex flex-col'}>
                    <Link href={`/brands/${product.brand.slug}`} className="text-xs text-primary font-medium mb-1 hover:underline">
                      {product.brand.name}
                    </Link>
                    
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                    </Link>

                    {product.volumeMl && (
                      <span className="text-xs text-slate-500 mb-2">
                        {product.volumeMl >= 1000 ? `${product.volumeMl / 1000}L` : `${product.volumeMl}ml`}
                      </span>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.freeShipping && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                          <Truck className="w-3 h-3" />
                          Free
                        </span>
                      )}
                      {product.sustainable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                          <Leaf className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div className={viewMode === 'list' ? 'mt-auto' : ''}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            ৳{product.price.toLocaleString()}
                          </span>
                          {product.comparePrice && (
                            <span className="text-sm text-slate-400 line-through">
                              ৳{product.comparePrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={!product.available || addingToCart.has(product.id)}
                          className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          {addingToCart.has(product.id) ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ShoppingCart className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl">
              <Package className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-slate-500 mb-4">
                {query 
                  ? `We couldn't find any products matching "${query}"`
                  : 'Try adjusting your filters'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => updateURL({ page: String(pagination.page - 1) })}
                disabled={pagination.page === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  const current = pagination.page;
                  return page === 1 || page === pagination.totalPages || Math.abs(page - current) <= 1;
                })
                .map((page, index, arr) => (
                  <span key={page}>
                    {index > 0 && arr[index - 1] !== page - 1 && (
                      <span className="px-2 text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => updateURL({ page: String(page) })}
                      className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                        page === pagination.page
                          ? 'bg-primary text-white'
                          : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                ))}
              
              <button
                onClick={() => updateURL({ page: String(pagination.page + 1) })}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-80 max-w-full bg-white dark:bg-slate-800 z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Filters
                  </h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar mobile />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
