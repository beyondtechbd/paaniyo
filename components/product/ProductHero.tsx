// components/product/ProductHero.tsx
// Immersive Product Hero with Animated Carousel

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, Leaf, Truck, Shield, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImage {
  url: string;
  alt: string;
}

interface ProductHeroProps {
  images: ProductImage[];
  name: string;
  brand: string;
  category: string;
  badges?: {
    freeShipping?: boolean;
    organic?: boolean;
    premium?: boolean;
    sustainable?: boolean;
  };
  locale?: 'en' | 'bn';
  className?: string;
}

const badgeConfig = {
  freeShipping: {
    icon: Truck,
    labelEn: 'Free Shipping BD',
    labelBn: 'বিনামূল্যে ডেলিভারি',
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-500/10',
  },
  organic: {
    icon: Leaf,
    labelEn: 'Natural Source',
    labelBn: 'প্রাকৃতিক উৎস',
    color: 'from-lime-500 to-green-500',
    bgColor: 'bg-lime-500/10',
  },
  premium: {
    icon: Award,
    labelEn: 'Premium Quality',
    labelBn: 'প্রিমিয়াম মান',
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-500/10',
  },
  sustainable: {
    icon: Shield,
    labelEn: 'Eco-Friendly',
    labelBn: 'পরিবেশ বান্ধব',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-500/10',
  },
};

export function ProductHero({
  images,
  name,
  brand,
  category,
  badges = {},
  locale = 'en',
  className = '',
}: ProductHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomed) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPosition({ x, y });
    },
    [isZoomed]
  );

  const activeBadges = Object.entries(badges).filter(([, value]) => value);

  return (
    <div className={cn('relative', className)}>
      {/* Main Image Container */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-blue-950 dark:to-cyan-950">
        {/* Animated Background Bubbles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-cyan-400/10 dark:bg-cyan-400/5"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {/* Category Badge */}
        <div className="absolute left-4 top-4 z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 shadow-lg backdrop-blur-sm dark:bg-slate-800/80 dark:text-slate-200"
          >
            {category}
          </motion.div>
        </div>

        {/* Brand Watermark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.5 }}
          className="absolute right-4 top-4 z-10 text-right"
        >
          <span className="font-serif text-4xl font-light italic tracking-widest text-slate-400 dark:text-slate-600">
            {brand}
          </span>
        </motion.div>

        {/* Main Image */}
        <div
          className="relative aspect-square cursor-zoom-in md:aspect-[4/3]"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <Image
                src={images[currentIndex]?.url || '/images/placeholder-product.jpg'}
                alt={images[currentIndex]?.alt || name}
                fill
                className={cn(
                  'object-contain p-8 transition-transform duration-300',
                  isZoomed && 'scale-150'
                )}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : undefined
                }
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
          </AnimatePresence>

          {/* Zoom Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isZoomed ? 0 : 1 }}
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
          >
            <ZoomIn className="h-3 w-3" />
            {locale === 'bn' ? 'জুম করুন' : 'Hover to zoom'}
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevImage}
              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-colors hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextImage}
              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-colors hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </motion.button>
          </>
        )}

        {/* Badges */}
        {activeBadges.length > 0 && (
          <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2">
            {activeBadges.map(([key], index) => {
              const config = badgeConfig[key as keyof typeof badgeConfig];
              if (!config) return null;
              const Icon = config.icon;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm',
                    config.bgColor,
                    'border border-white/20 dark:border-white/10'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br',
                      config.color
                    )}
                  >
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-200">
                    {locale === 'bn' ? config.labelBn : config.labelEn}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="mt-4 flex justify-center gap-3">
          {images.map((image, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'relative h-16 w-16 overflow-hidden rounded-xl border-2 transition-all',
                currentIndex === index
                  ? 'border-cyan-500 shadow-lg shadow-cyan-500/25'
                  : 'border-slate-200 dark:border-slate-700'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="64px"
              />
              {currentIndex === index && (
                <motion.div
                  layoutId="thumbnail-indicator"
                  className="absolute inset-0 rounded-lg ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-900"
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Dot Indicators (Mobile) */}
      {images.length > 1 && (
        <div className="mt-4 flex justify-center gap-2 md:hidden">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                currentIndex === index
                  ? 'w-6 bg-cyan-500'
                  : 'w-2 bg-slate-300 dark:bg-slate-600'
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductHero;
