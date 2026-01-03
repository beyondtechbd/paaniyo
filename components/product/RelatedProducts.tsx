// components/product/RelatedProducts.tsx
// Related Products Carousel with Premium Styling

'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  priceBDT: number;
  comparePriceBDT?: number;
}

interface RelatedProductsProps {
  products: Product[];
  title: string;
  locale?: 'en' | 'bn';
  className?: string;
}

export function RelatedProducts({
  products,
  title,
  locale = 'en',
  className = '',
}: RelatedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (products.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      {/* Section Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scroll('left')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-cyan-500 hover:text-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scroll('right')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-cyan-500 hover:text-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Products Scroll Container */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-6 overflow-x-auto pb-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {products.map((product, index) => {
          const discount = product.comparePriceBDT
            ? Math.round(
                ((product.comparePriceBDT - product.priceBDT) /
                  product.comparePriceBDT) *
                  100
              )
            : 0;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-[260px] flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <Link href={`/product/${product.slug}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-cyan-50 dark:from-slate-800 dark:to-cyan-900/20">
                  {/* Discount Badge */}
                  {discount > 0 && (
                    <div className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                      -{discount}%
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="aspect-square p-6">
                    <div className="relative h-full w-full transition-transform duration-300 group-hover:scale-105">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain"
                        sizes="260px"
                      />
                    </div>
                  </div>

                  {/* Quick Add Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ scale: 1.05 }}
                    className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-cyan-600 opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100 dark:bg-slate-800/90 dark:text-cyan-400"
                    onClick={(e) => {
                      e.preventDefault();
                      // Add to cart logic
                    }}
                    aria-label={locale === 'bn' ? 'কার্টে যোগ করুন' : 'Add to cart'}
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Product Info */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    {product.brand}
                  </p>
                  <h3 className="line-clamp-2 font-semibold text-slate-900 transition-colors group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatPrice(product.priceBDT)}
                    </span>
                    {product.comparePriceBDT && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(product.comparePriceBDT)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Gradient Fades */}
      <div className="pointer-events-none absolute bottom-4 left-0 top-16 w-8 bg-gradient-to-r from-white to-transparent dark:from-slate-950" />
      <div className="pointer-events-none absolute bottom-4 right-0 top-16 w-8 bg-gradient-to-l from-white to-transparent dark:from-slate-950" />
    </div>
  );
}

export default RelatedProducts;
