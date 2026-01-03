// components/products/ProductFilters.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X, Filter, Check } from 'lucide-react';

interface Category {
  value: string;
  label: string;
  icon: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

interface PriceRange {
  min: number;
  max: number;
}

interface CurrentFilters {
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  freeShipping: boolean;
}

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  priceRange: PriceRange;
  currentFilters: CurrentFilters;
}

export function ProductFilters({
  categories,
  brands,
  priceRange,
  currentFilters,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [expanded, setExpanded] = useState({
    categories: true,
    brands: true,
    price: true,
    options: true,
  });

  const [localPrice, setLocalPrice] = useState({
    min: currentFilters.minPrice || '',
    max: currentFilters.maxPrice || '',
  });

  const updateFilters = useCallback((key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === '' || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [router, pathname, searchParams]);

  const clearAllFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const hasActiveFilters = 
    currentFilters.category || 
    currentFilters.brand || 
    currentFilters.minPrice || 
    currentFilters.maxPrice || 
    currentFilters.inStock || 
    currentFilters.freeShipping;

  const handlePriceApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (localPrice.min) {
      params.set('minPrice', localPrice.min);
    } else {
      params.delete('minPrice');
    }
    
    if (localPrice.max) {
      params.set('maxPrice', localPrice.max);
    } else {
      params.delete('maxPrice');
    }
    
    params.delete('page');
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Filters
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Categories */}
      <FilterSection
        title="Categories"
        expanded={expanded.categories}
        onToggle={() => setExpanded(e => ({ ...e, categories: !e.categories }))}
      >
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => updateFilters('category', currentFilters.category === category.value ? '' : category.value)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                currentFilters.category === category.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="flex-1">{category.label}</span>
              {currentFilters.category === category.value && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Brands */}
      <FilterSection
        title="Brands"
        expanded={expanded.brands}
        onToggle={() => setExpanded(e => ({ ...e, brands: !e.brands }))}
      >
        <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => updateFilters('brand', currentFilters.brand === brand.slug ? '' : brand.slug)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                currentFilters.brand === brand.slug
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span>{brand.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                {brand._count.products}
              </span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection
        title="Price Range"
        expanded={expanded.price}
        onToggle={() => setExpanded(e => ({ ...e, price: !e.price }))}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Min</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">৳</span>
                <input
                  type="number"
                  value={localPrice.min}
                  onChange={(e) => setLocalPrice(p => ({ ...p, min: e.target.value }))}
                  placeholder={String(priceRange.min)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <span className="mt-6 text-slate-400">—</span>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Max</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">৳</span>
                <input
                  type="number"
                  value={localPrice.max}
                  onChange={(e) => setLocalPrice(p => ({ ...p, max: e.target.value }))}
                  placeholder={String(priceRange.max)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handlePriceApply}
            className="w-full rounded-lg bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Apply Price
          </button>
        </div>
      </FilterSection>

      {/* Options */}
      <FilterSection
        title="Options"
        expanded={expanded.options}
        onToggle={() => setExpanded(e => ({ ...e, options: !e.options }))}
      >
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={currentFilters.inStock}
              onChange={(e) => updateFilters('inStock', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">In Stock Only</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={currentFilters.freeShipping}
              onChange={(e) => updateFilters('freeShipping', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">Free Shipping</span>
          </label>
        </div>
      </FilterSection>
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, expanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="rounded-2xl bg-white/50 p-4 backdrop-blur-sm dark:bg-slate-800/50">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="font-medium text-slate-900 dark:text-white">{title}</h3>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
