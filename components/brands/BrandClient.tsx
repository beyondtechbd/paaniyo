// components/brands/BrandClient.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  MapPin,
  Package,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  LayoutList,
  ShoppingCart,
  Heart,
  Star,
  Truck,
  Leaf,
  Sparkles,
  ArrowUpDown,
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
  discount: number;
  available: boolean;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  story: string | null;
  country: string | null;
  region: string | null;
  productCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BrandClientProps {
  brand: Brand;
  products: Product[];
  pagination: Pagination;
  currentSort: string;
}

const sortOptions = [
  { value: 'featured', label: 'Featured' },
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

export function BrandClient({ brand, products, pagination, currentSort }: BrandClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());

  const updateSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    params.delete('page');
    router.push(`/brands/${brand.slug}?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/brands/${brand.slug}?${params.toString()}`);
  };

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
        throw new Error(data.error || 'Failed to add to wishlist');
      }

      toast.success('Added to wishlist');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to add to wishlist');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative">
        {/* Banner */}
        <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
          {brand.banner ? (
            <Image
              src={brand.banner}
              alt={brand.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-sky-100 to-cyan-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800" />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>

        {/* Brand Info Overlay */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="container mx-auto px-4 pb-8">
            <div className="flex items-end gap-6">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden flex-shrink-0 -mb-12"
              >
                {brand.logo ? (
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain p-3"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-400 to-cyan-500">
                    <span className="text-3xl font-display font-bold text-white">
                      {brand.name.charAt(0)}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Brand Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 text-white pb-2"
              >
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2">
                  {brand.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                  {brand.country && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{brand.region ? `${brand.region}, ` : ''}{brand.country}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>{brand.productCount} Products</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 pt-20 pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/brands" className="hover:text-primary transition-colors">Brands</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white">{brand.name}</span>
        </nav>

        {/* Brand Story */}
        {brand.story && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Our Story
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {brand.story}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Description */}
        {brand.description && !brand.story && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-600 dark:text-slate-300 mb-8 max-w-3xl"
          >
            {brand.description}
          </motion.p>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="text-sm text-slate-500">
            Showing {products.length} of {pagination.total} products
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <div className="relative">
              <select
                value={currentSort}
                onChange={(e) => updateSort(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* View Mode */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
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

        {/* Products Grid/List */}
        {products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
              : 'space-y-4'
            }
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index % 8) }}
                className={viewMode === 'grid'
                  ? 'group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300'
                  : 'group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex'
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
                          Featured
                        </span>
                      )}
                      {product.sustainable && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                          <Leaf className="w-3 h-3" />
                          Eco
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          addToWishlist(product.id);
                        }}
                        className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-slate-600 dark:text-slate-300 hover:text-red-500" />
                      </button>
                    </div>

                    {/* Out of Stock Overlay */}
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
                  {/* Water Type */}
                  {product.waterType && (
                    <span className="text-xs text-primary font-medium mb-1">
                      {waterTypeLabels[product.waterType] || product.waterType}
                    </span>
                  )}
                  
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Volume */}
                  {product.volumeMl && (
                    <span className="text-xs text-slate-500 mb-2">
                      {product.volumeMl >= 1000 ? `${product.volumeMl / 1000}L` : `${product.volumeMl}ml`}
                    </span>
                  )}

                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.freeShipping && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                        <Truck className="w-3 h-3" />
                        Free Shipping
                      </span>
                    )}
                  </div>

                  {/* Price & Add to Cart */}
                  <div className={viewMode === 'grid' ? '' : 'mt-auto'}>
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
                        className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
              No products available
            </h3>
            <p className="text-slate-500">
              Check back later for new arrivals from {brand.name}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    onClick={() => goToPage(page)}
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
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
