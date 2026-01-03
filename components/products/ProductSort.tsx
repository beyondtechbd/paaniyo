// components/products/ProductSort.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition, useRef, useEffect } from 'react';
import { ChevronDown, Check, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductSortProps {
  currentSort: string;
  currentOrder: string;
}

const sortOptions = [
  { value: 'createdAt-desc', label: 'Newest First', icon: '🆕' },
  { value: 'createdAt-asc', label: 'Oldest First', icon: '📅' },
  { value: 'price-asc', label: 'Price: Low to High', icon: '💰' },
  { value: 'price-desc', label: 'Price: High to Low', icon: '💎' },
  { value: 'name-asc', label: 'Name: A to Z', icon: '🔤' },
  { value: 'name-desc', label: 'Name: Z to A', icon: '🔠' },
  { value: 'rating-desc', label: 'Top Rated', icon: '⭐' },
  { value: 'popularity-desc', label: 'Best Sellers', icon: '🔥' },
];

export function ProductSort({ currentSort, currentOrder }: ProductSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentValue = `${currentSort}-${currentOrder}`;
  const currentOption = sortOptions.find(o => o.value === currentValue) || sortOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition-all hover:border-primary hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-primary"
      >
        <ArrowUpDown className="h-4 w-4 text-slate-400" />
        <span className="hidden sm:inline">Sort by:</span>
        <span className="font-medium">{currentOption.label}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="p-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSort(option.value)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                    currentValue === option.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span className="flex-1">{option.label}</span>
                  {currentValue === option.value && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-sm dark:bg-slate-800/50">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
