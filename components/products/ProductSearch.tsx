// components/products/ProductSearch.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, useTransition, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductSearchProps {
  initialSearch: string;
}

export function ProductSearch({ initialSearch }: ProductSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [query, setQuery] = useState(initialSearch);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== initialSearch) {
        const params = new URLSearchParams(searchParams.toString());
        
        if (query.trim()) {
          params.set('search', query.trim());
        } else {
          params.delete('search');
        }
        params.delete('page');
        
        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`, { scroll: false });
        });
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [query, initialSearch, router, pathname, searchParams]);

  const handleClear = useCallback(() => {
    setQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('page');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [router, pathname, searchParams]);

  const popularSearches = [
    'Evian',
    'Fiji',
    'San Pellegrino',
    'Sparkling',
    'Mineral Water',
    'Premium',
  ];

  return (
    <div className="relative mx-auto max-w-2xl">
      <div
        className={`relative flex items-center overflow-hidden rounded-2xl border-2 bg-white transition-all dark:bg-slate-800 ${
          isFocused
            ? 'border-primary shadow-lg shadow-primary/20'
            : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <div className="flex h-14 flex-1 items-center">
          {isPending ? (
            <Loader2 className="ml-5 h-5 w-5 animate-spin text-primary" />
          ) : (
            <Search className="ml-5 h-5 w-5 text-slate-400" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search for waters, brands, products..."
            className="h-full flex-1 bg-transparent px-4 text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClear}
                className="mr-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => {
            if (query.trim()) {
              const params = new URLSearchParams(searchParams.toString());
              params.set('search', query.trim());
              params.delete('page');
              startTransition(() => {
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
              });
            }
          }}
          className="mr-2 rounded-xl bg-primary px-6 py-2.5 font-medium text-white transition-all hover:bg-primary/90 hover:shadow-lg"
        >
          Search
        </button>
      </div>

      {/* Popular Searches */}
      <AnimatePresence>
        {isFocused && !query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              Popular Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    setIsFocused(false);
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm text-slate-600 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-300"
                >
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
