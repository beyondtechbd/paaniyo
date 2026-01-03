'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, Filter, X, Droplets, Sparkles, Package, 
  Wrench, Coffee, Zap, Heart, ShoppingCart, ChevronDown,
  Dumbbell, Baby, Building2, Sun, Leaf, Clock
} from 'lucide-react';

const typeLabels: Record<string, { label: string; icon: any }> = {
  JAR: { label: 'Water Jars (Refillable)', icon: Droplets },
  BOTTLE: { label: 'Bottles', icon: Droplets },
  PACK: { label: 'Bulk Packs', icon: Package },
  FILTER_SYSTEM: { label: 'Filtration Systems', icon: Wrench },
  SPARE_PART: { label: 'Spare Parts & Filters', icon: Wrench },
  DISPENSER: { label: 'Dispensers', icon: Droplets },
  BEVERAGE: { label: 'Beverages', icon: Coffee },
};

const useCaseConfig: Record<string, { label: string; icon: any; color: string }> = {
  'home': { label: 'Home', icon: Droplets, color: 'bg-blue-100 text-blue-700' },
  'office': { label: 'Office', icon: Building2, color: 'bg-purple-100 text-purple-700' },
  'workout': { label: 'After Workout', icon: Dumbbell, color: 'bg-orange-100 text-orange-700' },
  'kids': { label: 'For Kids', icon: Baby, color: 'bg-pink-100 text-pink-700' },
  'premium': { label: 'Premium', icon: Sparkles, color: 'bg-amber-100 text-amber-700' },
  'daily': { label: 'Daily Use', icon: Clock, color: 'bg-cyan-100 text-cyan-700' },
  'health': { label: 'Health', icon: Heart, color: 'bg-red-100 text-red-700' },
  'energy': { label: 'Energy Boost', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  'budget': { label: 'Budget Friendly', icon: Leaf, color: 'bg-green-100 text-green-700' },
  'maintenance': { label: 'Maintenance', icon: Wrench, color: 'bg-slate-100 text-slate-700' },
};

interface ShopClientProps {
  data: {
    products: any[];
    total: number;
    brands: { name: string; slug: string }[];
    types: { type: string; _count: { type: number } }[];
    useCases: string[];
    page: number;
    totalPages: number;
    filters: any;
  };
}

export function ShopClient({ data }: ShopClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(data.filters.search || '');

  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete('page');
    return `/shop?${params.toString()}`;
  };

  const clearFilters = () => router.push('/shop');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ search: searchQuery || undefined }));
  };

  const hasFilters = data.filters.type || data.filters.category || data.filters.brand || data.filters.useCase;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-cyan-600 to-blue-700 py-8 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Shop</h1>
          <p className="text-cyan-100">Water, beverages, filtration systems & more</p>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="mt-4 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Use Case Discovery */}
      <section className="bg-white dark:bg-slate-900 border-b py-4 overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 min-w-max">
            {data.useCases.map((uc) => {
              const config = useCaseConfig[uc] || { label: uc, icon: Droplets, color: 'bg-slate-100 text-slate-700' };
              const Icon = config.icon;
              const isActive = data.filters.useCase === uc;
              return (
                <Link
                  key={uc}
                  href={buildUrl({ useCase: isActive ? undefined : uc })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive ? 'bg-cyan-600 text-white' : config.color + ' hover:opacity-80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Filters</h2>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-sm text-cyan-600 hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              {/* Product Type */}
              <div className="mb-5">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Product Type</h3>
                <div className="space-y-1">
                  {data.types.map(({ type, _count }) => {
                    const config = typeLabels[type] || { label: type, icon: Package };
                    const Icon = config.icon;
                    return (
                      <Link
                        key={type}
                        href={buildUrl({ type: data.filters.type === type ? undefined : type })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          data.filters.type === type
                            ? 'bg-cyan-100 text-cyan-700 font-medium'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1">{config.label}</span>
                        <span className="text-xs text-slate-400">{_count.type}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Brand */}
              <div className="mb-5">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Brand</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {data.brands.map((brand) => (
                    <Link
                      key={brand.slug}
                      href={buildUrl({ brand: data.filters.brand === brand.slug ? undefined : brand.slug })}
                      className={`block px-3 py-2 rounded-lg text-sm ${
                        data.filters.brand === brand.slug
                          ? 'bg-cyan-100 text-cyan-700 font-medium'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      {brand.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm"
          >
            <Filter className="w-5 h-5" />
            Filters
            {hasFilters && <span className="w-2 h-2 bg-cyan-500 rounded-full" />}
          </button>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600">
                <span className="font-medium">{data.total}</span> products
              </p>
              <select
                value={data.filters.sort || 'featured'}
                onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
                className="px-3 py-2 rounded-lg border bg-white text-sm"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Products */}
            {data.products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <Droplets className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold mb-2">No products found</h3>
                <p className="text-slate-500 mb-4">Try adjusting your filters</p>
                <button onClick={clearFilters} className="px-6 py-2 bg-cyan-500 text-white rounded-lg">
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {data.page > 1 && (
                  <Link
                    href={buildUrl({ page: String(data.page - 1) })}
                    className="px-4 py-2 rounded-lg border hover:bg-slate-100"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-4 py-2">
                  Page {data.page} of {data.totalPages}
                </span>
                {data.page < data.totalPages && (
                  <Link
                    href={buildUrl({ page: String(data.page + 1) })}
                    className="px-4 py-2 rounded-lg border hover:bg-slate-100"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Type */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Product Type</h3>
              {data.types.map(({ type }) => {
                const config = typeLabels[type] || { label: type };
                return (
                  <Link
                    key={type}
                    href={buildUrl({ type: data.filters.type === type ? undefined : type })}
                    onClick={() => setShowFilters(false)}
                    className={`block px-3 py-2 rounded-lg ${
                      data.filters.type === type ? 'bg-cyan-100 text-cyan-700' : ''
                    }`}
                  >
                    {config.label}
                  </Link>
                );
              })}
            </div>

            {/* Brand */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Brand</h3>
              {data.brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={buildUrl({ brand: data.filters.brand === brand.slug ? undefined : brand.slug })}
                  onClick={() => setShowFilters(false)}
                  className={`block px-3 py-2 rounded-lg ${
                    data.filters.brand === brand.slug ? 'bg-cyan-100 text-cyan-700' : ''
                  }`}
                >
                  {brand.name}
                </Link>
              ))}
            </div>

            <button
              onClick={() => { clearFilters(); setShowFilters(false); }}
              className="w-full py-3 border rounded-xl"
            >
              Clear All Filters
            </button>
          </motion.div>
        </div>
      )}
    </main>
  );
}

function ProductCard({ product, index }: { product: any; index: number }) {
  const hasDeposit = product.depositBDT && Number(product.depositBDT) > 0;
  const isJar = product.type === 'JAR';
  const discount = product.compareBDT 
    ? Math.round(((Number(product.compareBDT) - Number(product.priceBDT)) / Number(product.compareBDT)) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link
        href={`/product/${product.slug}`}
        className="group block bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
      >
        {/* Image */}
        <div className="aspect-square bg-slate-100 relative overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Droplets className="w-12 h-12 text-slate-300" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isFeatured && (
              <span className="px-2 py-1 bg-cyan-500 text-white text-xs font-medium rounded-full">
                Featured
              </span>
            )}
            {isJar && (
              <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                Refillable
              </span>
            )}
          </div>
          
          {discount > 0 && (
            <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-cyan-600 font-medium">{product.brand?.name}</p>
          <h3 className="font-medium text-slate-900 dark:text-white mt-1 line-clamp-2 text-sm">
            {product.name}
          </h3>
          
          {product.volumeMl && (
            <p className="text-xs text-slate-500 mt-1">
              {product.volumeMl >= 1000 ? `${product.volumeMl / 1000}L` : `${product.volumeMl}ml`}
              {product.packSize > 1 && ` × ${product.packSize}`}
            </p>
          )}

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">৳{Number(product.priceBDT)}</span>
            {product.compareBDT && (
              <span className="text-sm text-slate-400 line-through">৳{Number(product.compareBDT)}</span>
            )}
          </div>

          {hasDeposit && (
            <p className="text-xs text-amber-600 mt-1">
              + ৳{Number(product.depositBDT)} refundable deposit
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
